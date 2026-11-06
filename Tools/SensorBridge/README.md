# Arduino Uno + DHT11 + computadora + VPS

Este puente se ejecuta en la computadora conectada por USB al Arduino, no en la VPS.
Utiliza los endpoints actuales de la app; no requiere cambiar ni desplegar el backend.
Requiere Python 3.10 o superior, Arduino IDE, Internet y el dominio de la app con HTTPS funcionando.

## 1. Cableado y Arduino

Desconecta la alimentacion antes de cablear. Usa las etiquetas de tu modulo de tres pines, no el color de los cables:

| Modulo DHT11 | Arduino Uno |
| --- | --- |
| VCC | 5V |
| DAT / DATA | D2 |
| GND | GND |

En Arduino IDE instala `DHT sensor library` de Adafruit y `Adafruit Unified Sensor`.
Abre `arduino/dht11/dht11.ino`, selecciona Arduino Uno y su puerto y carga el programa.
En el monitor serie a 9600 baudios debe aparecer cada 5 segundos:

```json
{"temperatura":26.0,"humedad":64.0}
```

Cierra el monitor serie antes de ejecutar Python: dos programas no pueden usar el mismo puerto.

## 2. Preparar los registros en la app

1. Como administrador, crea una cuenta dedicada `sensor_arduino` con rol `OPERADOR` y una contrasena propia. El rol actual permite mas operaciones que solo enviar lecturas; usa una cuenta que puedas desactivar por separado.
2. Crea dos sensores activos en la misma comunidad. Ambos representan el mismo dispositivo fisico:
   - Codigo `DHT11-01-T`, tipo `TEMPERATURA`, unidad `°C`.
   - Codigo `DHT11-01-H`, tipo `HUMEDAD`, unidad `%`.
3. Anota sus IDs numericos (no sus codigos). Puedes verlos en las respuestas de `GET /api/sensores` con una sesion autenticada, o en la pestaña Network del navegador al consultar sensores.
4. Configura al menos una regla activa para cada tipo. El backend actual rechaza lecturas si el tipo carece de reglas activas. Los umbrales deben corresponder a los requisitos de tu proyecto.
5. Si la simulacion esta habilitada, desactivala con una sesion ADMIN mediante `PATCH /api/monitoreo/estado` y cuerpo `{"activo":false}`. El simulador actual tambien escribe en sensores fisicos activos. No uses “reiniciar monitoreo”, porque vuelve a habilitar la simulacion.

## 3. Instalar en Windows

Instala Python si `python --version` no funciona; habilita su acceso desde la terminal durante la instalacion. Abre PowerShell en la raiz del repositorio:

```powershell
cd Tools/SensorBridge
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item config.example.json config.json
.\.venv\Scripts\python.exe -m serial.tools.list_ports
```

Edita `config.json` con tu dominio, puerto y los dos IDs reales:

```json
{
  "api_url": "https://tu-dominio/api",
  "username": "sensor_arduino",
  "serial_port": "COM3",
  "temperature_sensor_id": 12,
  "humidity_sensor_id": 13,
  "send_interval_seconds": 30
}
```

Los IDs 12 y 13 son ejemplos. La URL debe terminar en `/api`, sin `/lecturas`.
`config.json` y `.venv` quedan excluidos de Git. No copies el `.env` de la VPS ni uses `SERVICE_KEY`.
No necesitas activar el entorno virtual ni cambiar la politica de ejecucion de PowerShell.

## 4. Probar y enviar

Primero prueba solamente el USB; este modo no inicia sesion ni envia lecturas:

```powershell
.\.venv\Scripts\python.exe bridge.py --read-only
```

Detenlo con Ctrl+C. Luego inicia el envio real:

```powershell
.\.venv\Scripts\python.exe bridge.py
```

Introduce la contrasena del operador cuando se solicite (no se muestra ni se guarda en archivo).
El puente verifica los tipos y el estado de ambos sensores, envia la primera medicion valida y despues una cada 30 segundos.
Cada medicion genera dos solicitudes `POST /api/lecturas` con `{sensorId, valor}`.
Renueva la sesion al recibir HTTP 401 y reconecta el USB si se desconecta.
La API actual registra la hora de recepcion en UTC, actualiza el valor y publica el evento SignalR existente.
Revisa la pagina de Lecturas para confirmar ambos sensores y el historial.

La computadora debe permanecer encendida, sin suspension, conectada al Arduino y con Internet.
No necesitas abrir puertos en tu router. Para automatizacion se admite la variable de entorno `SENSOR_BRIDGE_PASSWORD`; evita guardarla en scripts versionados.

## Limites y diagnostico

- Esta primera version transmite mediciones actuales: no guarda una cola durante cortes de Internet. Reanuda con nuevas mediciones en el siguiente intervalo; no reconstruye el historial perdido.
- No reintenta automaticamente una escritura cuando hay timeout, porque la API podria haberla guardado antes de perder la respuesta y actualmente no admite una clave de idempotencia. Los dos valores se guardan por separado; si una solicitud falla, la otra puede haberse guardado.
- HTTP 400 al enviar: revisa sensor activo y reglas activas para su tipo.
- HTTP 401/403: revisa usuario activo, contrasena y rol OPERADOR.
- HTTP 404: revisa dominio, prefijo `/api` e IDs.
- HTTP 502/504: revisa Nginx, Gateway y servicios en la VPS.
- USB ocupado: cierra el monitor serie y otras instancias del puente. Comprueba el puerto COM y el cable de datos.
- Lectura invalida: revisa VCC, GND, DAT y las bibliotecas del Arduino.
- Certificado HTTPS: corrige el certificado del dominio; el puente mantiene la verificacion TLS habilitada.

Para ejecutar las pruebas del parser y del flujo de autenticacion, desde esta carpeta:

```powershell
.\.venv\Scripts\python.exe -m unittest -v
```

Referencias: [DHT con Arduino](https://learn.adafruit.com/dht/using-a-dhtxx-sensor-with-arduino), [pySerial](https://pyserial.readthedocs.io/en/latest/shortintro.html), [Requests](https://requests.readthedocs.io/en/latest/user/quickstart/).
