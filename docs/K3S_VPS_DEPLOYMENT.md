# Despliegue en la VPS con K3s

Este procedimiento instala un clúster K3s de un solo nodo y despliega una instalación **nueva** de Weather Risk en `desawebproyectoclimatico.dpdns.org`.

La VPS seleccionada (4 vCPU, 8 GB RAM, 160 GB SSD) es el mínimo práctico para este perfil. No agregar réplicas ni HPA por ahora: Sensor ejecuta simulación y SignalR sin coordinación distribuida.

## Alcance y condiciones importantes

- Cloudflare puede permanecer en modo **Full**. Traefik de K3s atenderá 80/443 y Cloudflare terminará el TLS público. El certificado de origen inicial de Traefik puede ser autofirmado; Cloudflare Full lo acepta. No poner Cloudflare en `Flexible`.
- La nube de Cloudflare para el registro `A` de `desawebproyectoclimatico.dpdns.org` debe permanecer naranja/proxy y debe apuntar a la IP pública de la VPS.
- El firewall del proveedor y el firewall del sistema deben permitir TCP 80 y 443. El puerto SSH debe conservarse abierto antes de modificar UFW.
- Este despliegue crea PVCs y bases de datos nuevas. **No migra los datos de los volúmenes de Docker Compose.** Este procedimiento elimina explícitamente los contenedores y volúmenes administrados por Compose; los datos actuales de Docker no podrán recuperarse desde la VPS después del corte.
- Las credenciales compartidas anteriormente deben rotarse. Crear un archivo `.env.k8s` nuevo en la VPS, con permisos solo para el administrador; no usar valores publicados en chats, Git o capturas.

## 1. Preparación en la VPS

Conectarse por SSH, ir al directorio clonado del repositorio y actualizarlo:

```bash
git pull --ff-only
free -h
df -h /
docker compose ps
```

No continuar si la memoria disponible total es menor de 7.5 GiB o el espacio libre es menor de 80 GiB.

Crear `.env.k8s` manualmente con un editor como `nano .env.k8s`, con los mismos nombres de `.env.example`, pero valores nuevos, aleatorios y privados. Usar claves de al menos 32 bytes y contraseñas distintas para cada finalidad. Incluir además los valores de `ADMIN_USERNAME` y `ADMIN_PASSWORD` para inicializar únicamente la base Auth nueva.

Comprobar que el archivo no queda expuesto:

```bash
chmod 600 .env.k8s
git status --ignored --short | grep .env.k8s
```

El segundo comando debe mostrar que está ignorado; nunca ejecutar `git add .env.k8s`.

## 2. Destrucción de Docker Compose y corte

Esta etapa destruye la aplicación Docker actual y sus volúmenes de Compose para liberar almacenamiento antes de instalar K3s. Es una acción irreversible si no existe un respaldo externo. Confirmar que se está dentro del repositorio correcto y que se acepta perder usuarios, lecturas, reportes, bases y demás datos actuales de Docker.

```bash
docker compose ps
docker volume ls --format '{{.Name}}'
docker compose down -v --remove-orphans
docker volume ls --format '{{.Name}}'
```

El último listado permite comprobar que los volúmenes de `climate-phase3` ya no existen. No usar comandos globales como `docker system prune --volumes`, porque pueden eliminar datos ajenos al proyecto.

Si existe un Nginx del host ocupando 80/443, detenerlo después de confirmar su configuración y certificados:

```bash
sudo systemctl status nginx
sudo systemctl stop nginx
sudo systemctl disable nginx
sudo ss -ltnp '( sport = :80 or sport = :443 )'
```

El último comando no debe mostrar otro proceso en 80 o 443 antes de instalar K3s.

Después de este paso no existe reversión a Docker Compose con los datos anteriores. La alternativa será eliminar el namespace de Kubernetes y desplegar de nuevo desde cero.

## 3. Firewall e instalación de K3s

Si se usa UFW, abrir primero SSH, HTTP y HTTPS. No ejecutar `ufw enable` remotamente si SSH no está permitido.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

Instalar K3s con Traefik incluido:

```bash
curl -sfL https://get.k3s.io | sudo sh -s - server --write-kubeconfig-mode 600
sudo k3s kubectl get nodes
sudo k3s kubectl get pods -A
```

K3s instala `kubectl`, `crictl` y `ctr`; el kubeconfig queda en `/etc/rancher/k3s/k3s.yaml`. Usar `sudo k3s kubectl` en los comandos de este manual.

## 4. Construir e importar las imágenes locales

No se usa un registry externo en este primer despliegue. Las imágenes se construyen desde el repositorio actualizado y se importan al runtime de K3s. Cada actualización deberá repetir este paso con una etiqueta nueva.

```bash
docker compose build

for service in auth community sensor alert report audit gateway; do
  docker tag "weather-risk-${service}:phase3" "weather-risk-${service}:phase4"
done

docker build -t weather-risk-frontend:phase4 -f Frontend/Dockerfile Frontend

docker save \
  weather-risk-auth:phase4 \
  weather-risk-community:phase4 \
  weather-risk-sensor:phase4 \
  weather-risk-alert:phase4 \
  weather-risk-report:phase4 \
  weather-risk-audit:phase4 \
  weather-risk-gateway:phase4 \
  weather-risk-frontend:phase4 \
  | sudo k3s ctr images import -

sudo k3s ctr images list | grep weather-risk
```

Los manifiestos usan `imagePullPolicy: Never` deliberadamente: un Pod no descargará imágenes desde Internet ni usará una versión diferente a la importada.

## 5. Crear namespace, configuración y secretos

Aplicar primero los recursos sin secretos:

```bash
sudo k3s kubectl apply -f infra/k8s/namespace.yaml
sudo k3s kubectl apply -f infra/k8s/configmap.yaml
sudo k3s kubectl apply -f infra/k8s/mongo-init-configmap.yaml
```

Cargar el archivo privado en la sesión actual y crear el Secret sin escribir sus valores en un YAML versionado:

```bash
set -a
. ./.env.k8s
set +a

sudo k3s kubectl -n climate create secret generic climate-secrets \
  --from-literal=JWT_KEY="$JWT_KEY" \
  --from-literal=SERVICE_KEY="$SERVICE_KEY" \
  --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  --from-literal=MSSQL_SA_PASSWORD="$MSSQL_SA_PASSWORD" \
  --from-literal=MONGO_ROOT_PASSWORD="$MONGO_ROOT_PASSWORD" \
  --from-literal=MONGO_REPORT_PASSWORD="$MONGO_REPORT_PASSWORD" \
  --from-literal=MONGO_AUDIT_PASSWORD="$MONGO_AUDIT_PASSWORD" \
  --from-literal=ADMIN_USERNAME="$ADMIN_USERNAME" \
  --from-literal=ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  --from-literal=AUTH_DATABASE_URL="postgresql://auth:${POSTGRES_PASSWORD}@auth-postgres:5432/auth" \
  --from-literal=COMMUNITY_DATABASE_URL="Host=community-postgres;Database=community;Username=community;Password=${POSTGRES_PASSWORD}" \
  --from-literal=SENSOR_DATABASE_URL="Server=sensor-db,1433;Database=WeatherRiskSensors;User Id=sa;Password=${MSSQL_SA_PASSWORD};TrustServerCertificate=True;Encrypt=True" \
  --from-literal=ALERT_DATABASE_URL="jdbc:postgresql://alert-postgres:5432/alert" \
  --from-literal=REPORT_MONGO_URL="mongodb://report:${MONGO_REPORT_PASSWORD}@mongo:27017/report?authSource=report" \
  --from-literal=AUDIT_MONGO_URL="mongodb://audit:${MONGO_AUDIT_PASSWORD}@mongo:27017/audit?authSource=audit"

sudo k3s kubectl -n climate get secret climate-secrets
unset JWT_KEY SERVICE_KEY POSTGRES_PASSWORD MSSQL_SA_PASSWORD MONGO_ROOT_PASSWORD MONGO_REPORT_PASSWORD MONGO_AUDIT_PASSWORD ADMIN_PASSWORD
```

No ejecutar `kubectl get secret ... -o yaml`: el resultado contiene secretos codificados en Base64, no cifrados de forma legible.

## 6. Desplegar y verificar

```bash
sudo k3s kubectl apply -f infra/k8s/databases.yaml
sudo k3s kubectl -n climate get pods -w
```

Esperar a que las cinco bases estén `Running` y listas. Salir del seguimiento con `Ctrl+C`; luego desplegar aplicaciones e Ingress:

```bash
sudo k3s kubectl apply -f infra/k8s/apps.yaml
sudo k3s kubectl apply -f infra/k8s/ingress.yaml

sudo k3s kubectl -n climate rollout status statefulset/auth-postgres --timeout=5m
sudo k3s kubectl -n climate rollout status statefulset/community-postgres --timeout=5m
sudo k3s kubectl -n climate rollout status statefulset/alert-postgres --timeout=5m
sudo k3s kubectl -n climate rollout status statefulset/sensor-db --timeout=8m
sudo k3s kubectl -n climate rollout status statefulset/mongo --timeout=5m

for app in auth community sensor alert report audit gateway frontend; do
  sudo k3s kubectl -n climate rollout status "deployment/${app}" --timeout=8m
done

sudo k3s kubectl -n climate get pods,svc,ingress,pvc
sudo k3s kubectl -n climate get events --sort-by=.lastTimestamp
```

Verificar localmente la ruta HTTPS de Traefik. `-k` es esperado mientras Cloudflare esté en modo Full y Traefik use su certificado inicial:

```bash
curl -kI --resolve desawebproyectoclimatico.dpdns.org:443:127.0.0.1 https://desawebproyectoclimatico.dpdns.org/
```

En una segunda sesión SSH, comprobar directamente la disponibilidad del Gateway:

```bash
sudo k3s kubectl -n climate port-forward service/gateway 8080:8080
```

Mientras ese comando sigue activo, ejecutar en la primera sesión:

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/ready
```

Después comprobar desde un navegador externo `https://desawebproyectoclimatico.dpdns.org/`. Cloudflare debe mostrar su certificado universal al visitante.

## Operación y actualización

Para ver logs:

```bash
sudo k3s kubectl -n climate logs deployment/gateway --tail=100
sudo k3s kubectl -n climate logs statefulset/sensor-db --tail=100
sudo k3s kubectl -n climate top pods
```

Para actualizar código: hacer `git pull --ff-only`, construir imágenes con una etiqueta nueva, importarlas y actualizar `infra/k8s/apps.yaml` con esa etiqueta antes de ejecutar `kubectl apply -f infra/k8s/apps.yaml`. No reutilizar `phase4` para una imagen distinta; mantener etiquetas trazables, por ejemplo un hash corto del commit.

No escalar Sensor, Gateway ni las bases con `kubectl scale` sin implementar primero coordinación de SignalR/simulación y una arquitectura de datos de alta disponibilidad.

## Reinicio limpio de Kubernetes

Si el primer despliegue falla y se acepta perder también los datos creados en Kubernetes, eliminar primero los PVC y después el namespace permite volver a iniciar las bases vacías:

```bash
sudo k3s kubectl delete pvc -n climate --all
sudo k3s kubectl delete namespace climate
```

Después reaplicar desde el paso 5. No ejecutar estos comandos si hay datos de Kubernetes que se deban conservar.

## Diagnóstico rápido

- `ImagePullBackOff` o `ErrImageNeverPull`: la imagen no se importó; repetir el paso 4.
- `Pending`: revisar `sudo k3s kubectl -n climate describe pod NOMBRE`; normalmente indica falta de RAM, disco o PVC.
- `CrashLoopBackOff`: revisar logs del Deployment y que el Secret exista con todas las claves.
- Error 522/521 de Cloudflare: confirmar que 80/443 están abiertos y que `sudo k3s kubectl -n kube-system get pods` muestra Traefik en ejecución.
- Error 502: revisar primero `frontend`, después `gateway` y el Service `gateway`.
