# Semilla de demostración

La semilla reemplaza los INSERT del monolito por llamadas autenticadas a las APIs de los microservicios. No requiere restaurar `Backend/` ni una base compartida. Los umbrales son ilustrativos y no están validados para uso meteorológico.

## Ejecutar en local o VPS

Desde la raíz del proyecto, con el `.env` configurado y los servicios funcionando:

```bash
docker compose up -d --build --wait
docker compose --profile demo run --rm seed-demo
```

El perfil `demo` evita cargar datos automáticamente en un despliegue normal. El contenedor usa Node 24; no requiere instalar Node en la VPS. Se conecta al Gateway dentro de Docker, sin depender del dominio ni de Cloudflare.

Si Node 24 ya está instalado en el equipo, también se puede ejecutar directamente:

```bash
node scripts/seed-demo.mjs
```

En ese caso se utiliza `http://127.0.0.1:API_PORT`, con puerto 5000 por defecto; `API_URL` permite indicar otro destino. Se leen las credenciales de `.env`, con prioridad de las variables de entorno.

## Datos creados

- Se conserva el administrador existente y se utiliza para autenticar las operaciones.
- Usuarios `demo-operador` y `demo-consulta`, con contraseñas aleatorias que se muestran solo al crearlos. Guardarlas de forma privada. Opcionalmente `DEMO_PASSWORD` permite definir una contraseña de al menos 12 caracteres para ambos usuarios nuevos.
- Una comunidad: `[DEMO-SEED-v1] Comunidad Central`, en San Salvador.
- Seis sensores con códigos `DEMO-V1-*`: temperatura, humedad, viento, lluvia, nivel de río y humo.
- Diez reglas para inundación, tormenta, sequía, helada e incendio forestal.
- Una lectura inicial por sensor. Se espera su evaluación asíncrona antes de generar reportes.
- Alertas e historial producidos por Alert; las reglas existentes también pueden influir en el resultado. No se modifica ni cierra una alerta existente.
- Ocho reportes PDF con metadatos e historial. No se simula una descarga; su fecha se registra al descargar realmente.
- Auditoría mediante las operaciones normales. Su entrega sigue sujeta a la disponibilidad y garantías del servicio Audit.

## Reejecución y fallos

Ejecutar una sola instancia de la semilla a la vez. La comprobación previa de existencia evita duplicados en ejecuciones secuenciales; no hay un bloqueo distribuido para ejecuciones simultáneas.

La comunidad se identifica por su nombre, las reglas por nombres prefijados, los sensores por código y los usuarios por username. No se asumen IDs concretos. Se conservan las contraseñas de usuarios existentes y no se agregan lecturas si el sensor ya tiene alguna. Los PDF usan claves de idempotencia estables por administrador, comunidad y tipo de reporte: repetir con el mismo administrador no los duplica. Otro administrador tiene su propio espacio de idempotencia.

Si una regla demo fue modificada o un sensor está inactivo o asociado a otra comunidad, el proceso informa el conflicto y se detiene sin sobrescribirlo. No es una transacción global: lo creado antes de un fallo permanece y la siguiente ejecución lo reutiliza. Si un reporte quedó FAILED, revisar el historial y la causa: la semilla no lo reemplaza automáticamente.

Las reglas demo son globales por tipo de sensor, como el modelo actual de Alert: también pueden participar en la evaluación de otras lecturas. Ejecutar preferentemente en un entorno de demostración; no activar simulación automáticamente. La semilla no modifica volúmenes ni borra registros.

Si el administrador fue importado y su contraseña no coincide con `ADMIN_PASSWORD`, agregar al `.env` privado:

```dotenv
SEED_USERNAME=nombre-del-administrador-existente
SEED_PASSWORD=su-contrasena-actual
```

No cambiar la contraseña del usuario en la base para ejecutar la semilla. No versionar el `.env` ni publicar la salida con credenciales.

## Verificación

Abrir comunidades, sensores, lecturas, alertas, historial y reportes en Angular. Filtrar por la comunidad demo cuando corresponda. Descargar un PDF y comprobar su contenido. Para probar la lógica de reejecución sin tocar bases:

```bash
node --test scripts/seed-demo.test.mjs
```

Estas pruebas usan respuestas simuladas; no sustituyen una ejecución de integración con Docker.
