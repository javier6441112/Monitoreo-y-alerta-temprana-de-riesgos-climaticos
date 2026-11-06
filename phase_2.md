# Fase 2 — Administración, autenticación y gestión avanzada

## 1. Descripción

La segunda fase consiste en continuar con el desarrollo del sistema de monitoreo y alerta temprana para riesgos climáticos desarrollado durante la primera fase.

En esta fase se incorporarán nuevas funcionalidades orientadas a la administración de comunidades, sensores, usuarios, reglas de alerta, lecturas, alertas e historial de eventos.

Las nuevas funcionalidades deberán integrarse con el dashboard existente, de manera que la información registrada y administrada mediante el panel administrativo alimente dinámicamente los indicadores, gráficos, alertas e historial del sistema.

Las funcionalidades administrativas estarán disponibles únicamente para usuarios autenticados y autorizados.

A partir de esta fase, la aplicación deberá desplegarse en un servidor VPS con GNU/Linux, utilizando Docker y Docker Compose. La aplicación deberá ser accesible mediante un nombre de dominio y utilizar HTTPS.

---

## 2. Objetivos

Los objetivos principales de esta fase son:

1. Implementar autenticación y autorización de usuarios.
2. Proteger la API mediante JWT.
3. Implementar roles y permisos.
4. Crear un panel administrativo.
5. Administrar comunidades.
6. Administrar sensores.
7. Administrar lecturas de sensores.
8. Administrar reglas de alerta.
9. Administrar alertas.
10. Administrar el historial de eventos.
11. Administrar usuarios.
12. Implementar una bitácora de auditoría.
13. Integrar toda la información con el dashboard.
14. Desplegar la aplicación en un VPS.
15. Configurar un dominio y HTTPS.
16. Mantener la aplicación preparada para su futura evolución hacia microservicios.

---

## 3. Tecnologías

### Frontend
- Angular 22+
- TypeScript
- RxJS
- Angular Material y/o Tailwind CSS

### Backend
- C#
- .NET 10
- ASP.NET Core Web API
- Entity Framework Core
- JWT

### Base de datos
- SQL Server 2022+

### Infraestructura
- GNU/Linux
- Docker
- Docker Compose
- Nginx
- HTTPS
- Let's Encrypt

---

## 4. Autenticación y autorización

### RF-ADM-01 — Inicio de sesión
El sistema debe permitir el inicio de sesión seguro de usuarios registrados.

### RF-ADM-02 — Protección del panel
Solo los usuarios autenticados podrán acceder al panel administrativo.

### RF-ADM-03 — Cierre de sesión
El sistema debe permitir al usuario cerrar su sesión.

### RF-ADM-04 — Expiración
El sistema debe gestionar la expiración de las sesiones y tokens de autenticación.

### RF-ADM-05 — JWT
La API deberá estar protegida mediante JSON Web Tokens (JWT).

### RF-ADM-06 — Roles
El sistema deberá implementar como mínimo los siguientes roles:
- Administrador.
- Operador.
- Usuario de consulta.

### RF-ADM-07 — Autorización
El sistema deberá restringir las operaciones de acuerdo con el rol del usuario.

Por ejemplo:
- **Administrador:** acceso completo.
- **Operador:** administración operativa de sensores y alertas.
- **Usuario de consulta:** únicamente visualización.

---

## 5. Gestión de comunidades

### RF-ADM-08 — Crear comunidades
El administrador podrá registrar nuevas comunidades.

Los datos mínimos serán:
- Nombre.
- Municipio.
- Departamento.
- País.
- Coordenadas geográficas.
- Descripción.
- Estado.

### RF-ADM-09 — Editar comunidades
El administrador podrá modificar la información de una comunidad.

### RF-ADM-10 — Activar/desactivar
El administrador podrá activar o desactivar comunidades.

### RF-ADM-11 — Listado
El sistema deberá mostrar un listado de comunidades.

### RF-ADM-12 — Búsqueda y filtrado
El listado deberá permitir:
- Búsqueda.
- Filtrado por estado.
- Filtrado por municipio.
- Filtrado por departamento.

### RF-ADM-13 — Sensores por comunidad
El sistema deberá mostrar la cantidad de sensores asociados a cada comunidad.

### RF-ADM-14 — Dashboard por comunidad
El dashboard deberá permitir consultar información filtrada por comunidad.

---

## 6. Gestión de sensores

### RF-ADM-15 — Crear sensores
El administrador podrá registrar sensores.

Cada sensor deberá contener como mínimo:
- Nombre.
- Código.
- Tipo.
- Comunidad.
- Ubicación.
- Unidad de medida.
- Estado.
- Fecha de instalación.
- Descripción.

Tipos de sensores:
- Temperatura.
- Humedad.
- Velocidad del viento.
- Lluvia.
- Nivel de río.
- Nivel de reservorio.
- Humo/incendio.
- Otros sensores ambientales.

### RF-ADM-16 — Editar sensores
El administrador podrá modificar la información de los sensores.

### RF-ADM-17 — Activar/desactivar sensores
El administrador podrá activar o desactivar sensores.

### RF-ADM-18 — Sensores desactivados
Los sensores desactivados no deberán generar nuevas lecturas ni alertas automáticas.

### RF-ADM-19 — Sensores por comunidad
El sistema deberá permitir consultar los sensores pertenecientes a una comunidad.

### RF-ADM-20 — Búsqueda y filtros
Los sensores podrán filtrarse por:
- Comunidad.
- Tipo.
- Estado.
- Código.

### RF-ADM-21 — Simulación
El administrador podrá modificar los valores de los sensores simulados.

### RF-ADM-22 — Auditoría
Toda modificación importante sobre un sensor deberá registrarse en la bitácora.

---

## 7. Gestión de lecturas

### RF-ADM-23 — Almacenamiento
El sistema deberá almacenar las lecturas generadas por cada sensor.

### RF-ADM-24 — Información de lectura
Cada lectura deberá registrar:
- Sensor.
- Fecha.
- Hora.
- Valor.
- Unidad.
- Estado del sensor.

### RF-ADM-25 — Historial
El sistema deberá permitir consultar las lecturas históricas de un sensor.

### RF-ADM-26 — Filtro por fechas
El sistema deberá permitir filtrar lecturas por rango de fechas.

### RF-ADM-27 — Lecturas por comunidad
El sistema deberá permitir consultar las lecturas de una comunidad.

### RF-ADM-28 — Dashboard
Las lecturas almacenadas deberán alimentar los gráficos del dashboard.

---

## 8. Gestión de reglas de alerta

### RF-ADM-29 — Crear reglas
El administrador podrá crear reglas de alerta.

### RF-ADM-30 — Parámetros
Cada regla deberá permitir definir:
- Nombre.
- Tipo de sensor.
- Valor mínimo.
- Valor máximo.
- Nivel de peligro.
- Tipo de fenómeno.
- Mensaje.
- Estado.

### RF-ADM-31 — Niveles
Se deberán manejar los siguientes niveles:
- **Verde:** Normal.
- **Amarillo:** Precaución.
- **Naranja:** Alerta.
- **Rojo:** Emergencia.

### RF-ADM-32 — Evaluación automática
El sistema deberá comparar automáticamente las lecturas con las reglas configuradas.

### RF-ADM-33 — Generación automática
Cuando una lectura incumpla una regla deberá generarse automáticamente una alerta.

### RF-ADM-34 — Información de alerta
La alerta deberá identificar:
- Sensor.
- Comunidad.
- Regla.
- Valor detectado.
- Nivel de peligro.
- Fenómeno.

### RF-ADM-35 — Administración
El administrador podrá editar, activar y desactivar reglas.

### RF-ADM-36 — Trazabilidad
Cada alerta deberá identificar la regla que provocó su generación.

---

## 9. Gestión de alertas

### RF-ADM-37 — Listado
El sistema deberá mostrar las alertas generadas.

### RF-ADM-38 — Información
Cada alerta deberá mostrar:
- Fecha.
- Hora.
- Comunidad.
- Sensor.
- Fenómeno.
- Nivel.
- Valor detectado.
- Umbral.
- Mensaje.
- Estado.

### RF-ADM-39 — Filtros
Las alertas deberán poder filtrarse por:
- Fecha.
- Comunidad.
- Sensor.
- Fenómeno.
- Nivel.
- Estado.

### RF-ADM-40 — Detalle
El usuario autorizado podrá consultar el detalle de una alerta.

### RF-ADM-41 — Estados
Las alertas podrán tener los estados:
- Activa.
- Atendida.
- Cerrada.

### RF-ADM-42 — Responsable
El sistema deberá registrar el usuario que atendió o cerró una alerta.

### RF-ADM-43 — Dashboard
Las alertas activas deberán reflejarse en el dashboard.

---

## 10. Historial de eventos

### RF-ADM-44 — Registro
El sistema deberá registrar todos los eventos de riesgo detectados.

### RF-ADM-45 — Información
Cada evento deberá contener:
- Fecha.
- Hora.
- Comunidad.
- Sensor.
- Fenómeno.
- Nivel.
- Valor.
- Descripción.
- Estado.
- Usuario responsable cuando corresponda.

### RF-ADM-46 — Consulta
El usuario autorizado podrá consultar el historial.

### RF-ADM-47 — Filtros
Se podrá filtrar por:
- Fecha.
- Comunidad.
- Fenómeno.
- Nivel.

Fenómenos:
- Inundación.
- Sequía.
- Tormenta.
- Helada.
- Incendio forestal.

### RF-ADM-48 — Estadísticas
El sistema deberá mostrar estadísticas sobre los eventos registrados.

---

## 11. Gestión de usuarios

### RF-ADM-49 — Crear usuarios
El administrador podrá crear usuarios.

### RF-ADM-50 — Editar usuarios
El administrador podrá modificar usuarios.

### RF-ADM-51 — Activar/desactivar
El administrador podrá activar o desactivar usuarios.

### RF-ADM-52 — Roles
El administrador podrá asignar roles.

### RF-ADM-53 — Listado
El sistema deberá mostrar un listado de usuarios.

### RF-ADM-54 — Filtros
El listado deberá permitir búsqueda y filtrado.

### RF-ADM-55 — Información adicional
Se deberá registrar:
- Fecha de creación.
- Último acceso.
- Estado.
- Rol.

---

## 12. Bitácora de auditoría

### RF-ADM-56 — Registro
El sistema deberá registrar las operaciones importantes realizadas por los usuarios.

Como mínimo:
- Login.
- Logout.
- Creación.
- Modificación.
- Eliminación.
- Activación/desactivación.
- Modificación de reglas.
- Atención de alertas.
- Cierre de alertas.

### RF-ADM-57 — Información
Cada registro deberá contener:
- Usuario.
- Acción.
- Fecha.
- Hora.
- Entidad.
- Identificador.
- Descripción.

### RF-ADM-58 — Consulta
Los administradores podrán consultar la bitácora.

### RF-ADM-59 — Filtros
La bitácora podrá filtrarse por:
- Usuario.
- Acción.
- Fecha.
- Entidad.

---

## 13. Dashboard

- **RF-ADM-60:** Mostrar cantidad de comunidades.
- **RF-ADM-61:** Mostrar cantidad de sensores activos.
- **RF-ADM-62:** Mostrar cantidad de sensores inactivos.
- **RF-ADM-63:** Mostrar alertas activas.
- **RF-ADM-64:** Mostrar distribución de alertas por nivel.
- **RF-ADM-65:** Mostrar evolución de lecturas.
- **RF-ADM-66:** Permitir filtrar por comunidad.
- **RF-ADM-67:** Mostrar eventos climáticos.
- **RF-ADM-68:** Actualizar información dinámicamente.

---

## 14. Requerimientos no funcionales (Seguridad)

- **RNF-ADM-01:** Las contraseñas deberán almacenarse mediante un algoritmo seguro de hashing.
- **RNF-ADM-02:** La API deberá estar protegida mediante JWT.
- **RNF-ADM-03:** Los endpoints administrativos deberán requerir autenticación.
- **RNF-ADM-04:** Los endpoints deberán validar roles y permisos.
- **RNF-ADM-05:** Los JWT deberán tener expiración configurable.
- **RNF-ADM-06:** Los tokens expirados deberán ser rechazados.
- **RNF-ADM-07:** Las credenciales no deberán almacenarse en el código fuente.
- **RNF-ADM-08:** Las operaciones administrativas deberán registrarse en la bitácora.

---

## 15. VPS y despliegue

A partir de esta fase, la aplicación deberá ejecutarse en un VPS con GNU/Linux.

La arquitectura inicial será:

```text
Internet
   |
   v
  DNS
   |
   v
 Nginx
   |
   +--> Angular
   |
   +--> .NET API
            |
            +--> SQL Server
```

Todos los componentes deberán ejecutarse mediante Docker. Se deberá utilizar Docker Compose para la orquestación inicial.

---

## 16. Dominio y HTTPS

La aplicación deberá ser accesible mediante un dominio (Ejemplo: `https://sistema-climatico.example`).

- La aplicación deberá utilizar HTTPS.
- El certificado podrá ser obtenido mediante Let's Encrypt.
- La base de datos no deberá estar expuesta directamente a Internet.

---

## 17. Infraestructura

El VPS deberá contar como mínimo con:
- GNU/Linux.
- Docker.
- Docker Compose.
- Nginx.
- Firewall.
- HTTPS.
- Sistema de logs.
- Sistema de respaldos.

---

## 18. Persistencia

La base de datos SQL Server deberá almacenar:
- Usuarios.
- Roles.
- Comunidades.
- Sensores.
- Lecturas.
- Reglas.
- Alertas.
- Eventos.
- Bitácora.

---

## 19. Preparación para futuras fases

- La arquitectura deberá diseñarse considerando una futura migración hacia microservicios.
- Se deberán evitar dependencias innecesarias entre módulos.
- Los componentes deberán utilizar interfaces y servicios claramente definidos.
- La autenticación deberá estar desacoplada de la lógica principal de negocio.
- Los servicios HTTP deberán diseñarse preferentemente como componentes stateless.

---

## 20. Resultado esperado

Al finalizar la Fase 2, el sistema deberá permitir:
1. Iniciar sesión.
2. Administrar usuarios.
3. Administrar comunidades.
4. Administrar sensores.
5. Administrar lecturas.
6. Configurar reglas de alerta.
7. Administrar alertas.
8. Consultar eventos históricos.
9. Consultar bitácora.
10. Visualizar información en el dashboard.
11. Ejecutarse mediante Docker.
12. Ejecutarse en un VPS GNU/Linux.
13. Ser accesible mediante dominio.
14. Utilizar HTTPS.
15. Mantener una arquitectura preparada para evolucionar hacia microservicios.