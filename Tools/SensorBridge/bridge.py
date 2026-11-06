"""Puente local DHT11/USB hacia la API existente. Python 3.10+."""
import argparse
import getpass
import json
import logging
import math
import os
from pathlib import Path
import time
from urllib.parse import urlsplit

import requests
import serial

LOG = logging.getLogger("sensor-bridge")


def parse_reading(line):
    data = json.loads(line)
    if not isinstance(data, dict) or "error" in data:
        raise ValueError("El sensor no pudo obtener una lectura")
    result = []
    for field, low, high in (("temperatura", 0, 50), ("humedad", 0, 100)):
        value = data.get(field)
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError("Falta un valor numerico: " + field)
        if not math.isfinite(value) or not low <= value <= high:
            raise ValueError("Valor fuera de rango: " + field)
        result.append(value)
    return tuple(result)


def load_config(path):
    config = json.loads(Path(path).read_text(encoding="utf-8-sig"))
    url = urlsplit(config["api_url"])
    if (url.scheme != "https" and not (
        url.scheme == "http" and url.hostname in ("localhost", "127.0.0.1")
    )) or not url.hostname or url.username or url.password or url.query or url.fragment:
        raise ValueError("Usa HTTPS para la VPS o HTTP solamente para localhost")
    for field in ("temperature_sensor_id", "humidity_sensor_id"):
        if type(config[field]) is not int or config[field] <= 0:
            raise ValueError("ID de sensor invalido: " + field)
    if config["temperature_sensor_id"] == config["humidity_sensor_id"]:
        raise ValueError("Temperatura y humedad necesitan IDs diferentes")
    interval = config.get("send_interval_seconds", 30)
    if isinstance(interval, bool) or not isinstance(interval, (int, float)) or not math.isfinite(interval) or interval < 5:
        raise ValueError("El intervalo debe ser al menos 5 segundos")
    config["send_interval_seconds"] = interval
    for field in ("username", "serial_port"):
        if not isinstance(config.get(field), str) or not config[field].strip():
            raise ValueError("Configuracion requerida: " + field)
    config["api_url"] = config["api_url"].rstrip("/")
    return config


class Api:
    def __init__(self, config, password):
        self.config = config
        self.password = password
        self.session = requests.Session()
        self.token = None

    def login(self):
        response = self.session.post(
            self.config["api_url"] + "/auth/login",
            json={"username": self.config["username"], "password": self.password},
            timeout=(5, 15), allow_redirects=False,
        )
        self.check(response)
        self.token = response.json()["token"]

    @staticmethod
    def check(response):
        if not 200 <= response.status_code < 300:
            # No imprimir cuerpos, credenciales ni tokens.
            raise RuntimeError("API HTTP " + str(response.status_code))

    def request(self, method, path, **kwargs):
        if not self.token:
            self.login()
        for attempt in range(2):
            response = self.session.request(
                method, self.config["api_url"] + path,
                headers={"Authorization": "Bearer " + self.token},
                timeout=(5, 15), allow_redirects=False, **kwargs,
            )
            if response.status_code == 401 and attempt == 0:
                self.login()
                continue
            self.check(response)
            return response

    def validate_sensors(self):
        for field, expected in (("temperature_sensor_id", "TEMPERATURA"),
                                ("humidity_sensor_id", "HUMEDAD")):
            sensor = self.request("GET", "/sensores/" + str(self.config[field])).json()
            if sensor.get("tipo") != expected or sensor.get("activo") is not True:
                raise ValueError("El sensor debe estar activo y ser de tipo " + expected)

    def send(self, sensor_id, value):
        self.request("POST", "/lecturas", json={"sensorId": sensor_id, "valor": value})


def run(config, api, read_only=False):
    next_send = 0
    next_invalid_log = 0
    while True:
        try:
            with serial.Serial(config["serial_port"], 9600, timeout=2) as port:
                LOG.info("USB conectado: %s", config["serial_port"])
                time.sleep(2)  # El Uno normalmente se reinicia al abrir el puerto.
                port.reset_input_buffer()
                while True:
                    raw = port.readline(257)
                    if not raw:
                        continue
                    if not raw.endswith(b"\n") or len(raw) > 256:
                        port.reset_input_buffer()
                        LOG.warning("Linea serie incompleta o demasiado larga")
                        continue
                    try:
                        temperature, humidity = parse_reading(raw)
                    except (ValueError, UnicodeError) as error:
                        if time.monotonic() >= next_invalid_log:
                            LOG.warning("Lectura invalida; NO se envia. Motivo: %s. USB: %r",
                                        str(error), raw[:256])
                            next_invalid_log = time.monotonic() + 5
                        continue
                    LOG.info("Temperatura: %.1f C; humedad: %.1f %%", temperature, humidity)
                    if read_only or time.monotonic() < next_send:
                        continue
                    for field, value in (("temperature_sensor_id", temperature),
                                         ("humidity_sensor_id", humidity)):
                        try:
                            api.send(config[field], value)
                            LOG.info("Lectura enviada: sensorId=%s, tipo=%s, valor=%.1f %s",
                                     config[field],
                                     "TEMPERATURA" if field == "temperature_sensor_id" else "HUMEDAD",
                                     value, "C" if field == "temperature_sensor_id" else "%")
                        except (requests.RequestException, RuntimeError, ValueError, KeyError) as error:
                            LOG.warning("No se confirmo envio al sensor %s (%s). Revisar red, cuenta y reglas.",
                                        config[field], type(error).__name__ + (": " + str(error) if isinstance(error, RuntimeError) else ""))
                    next_send = time.monotonic() + config["send_interval_seconds"]
                    # Descartar datos acumulados mientras la red estaba ocupada.
                    port.reset_input_buffer()
        except serial.SerialException:
            LOG.warning("USB no disponible. Cierra el monitor serie y revisa cable/puerto. Reintento en 5 s.")
            time.sleep(5)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default=str(Path(__file__).with_name("config.json")))
    parser.add_argument("--read-only", action="store_true", help="Mostrar USB sin iniciar sesion ni enviar")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    try:
        config = load_config(args.config)
        api = None
        if not args.read_only:
            password = os.environ.get("SENSOR_BRIDGE_PASSWORD") or getpass.getpass("Password del operador: ")
            api = Api(config, password)
            api.validate_sensors()
            LOG.info("Cuenta y sensores verificados")
        run(config, api, args.read_only)
    except KeyboardInterrupt:
        LOG.info("Puente detenido")
    except (OSError, ValueError, KeyError, RuntimeError, requests.RequestException) as error:
        LOG.error("No se pudo iniciar (%s). Revisa configuracion, API y credenciales.",
                  type(error).__name__ + (": " + str(error) if isinstance(error, RuntimeError) else ""))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
