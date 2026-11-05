#include <Arduino.h>
#include <math.h>
#include <DHT.h>

// Modulo DHT11: VCC -> 5V, GND -> GND, DAT -> D2.
DHT dht(2, DHT11);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  delay(5000);
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("{\"error\":\"lectura_fallida\"}");
    return;
  }
  Serial.print("{\"temperatura\":");
  Serial.print(temperature, 1);
  Serial.print(",\"humedad\":");
  Serial.print(humidity, 1);
  Serial.println("}");
}
