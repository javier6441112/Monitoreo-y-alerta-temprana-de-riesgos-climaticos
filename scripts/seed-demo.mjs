import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const marker = '[DEMO-SEED-v1]';
const reportTypes = ['COMMUNITIES', 'SENSORS', 'READINGS', 'ALERTS', 'EVENTS', 'SENSOR_STATUS', 'CLIMATE_STATISTICS', 'EXECUTIVE'];
const definitions = [
  ['TEMP', 'TEMPERATURA', '°C', -2], ['HUM', 'HUMEDAD', '%', 15],
  ['VIE', 'VIENTO', 'km/h', 85], ['LLU', 'LLUVIA', 'mm/h', 50],
  ['RIO', 'NIVEL_RIO', 'm', 5], ['HUMO', 'HUMO', 'ppm', 10]
];
const ruleDefinitions = [
  ['Río amarillo', 'NIVEL_RIO', 'INUNDACION', 2.5, 3.49, 'AMARILLO'],
  ['Río naranja', 'NIVEL_RIO', 'INUNDACION', 3.5, 4.49, 'NARANJA'],
  ['Río rojo', 'NIVEL_RIO', 'INUNDACION', 4.5, null, 'ROJO'],
  ['Viento amarillo', 'VIENTO', 'TORMENTA', 40, 59.99, 'AMARILLO'],
  ['Viento naranja', 'VIENTO', 'TORMENTA', 60, 79.99, 'NARANJA'],
  ['Viento rojo', 'VIENTO', 'TORMENTA', 80, null, 'ROJO'],
  ['Lluvia intensa', 'LLUVIA', 'TORMENTA', 40, null, 'NARANJA'],
  ['Humedad baja', 'HUMEDAD', 'SEQUIA', null, 20, 'AMARILLO'],
  ['Temperatura bajo cero', 'TEMPERATURA', 'HELADA', null, 0, 'ROJO'],
  ['Humo elevado', 'HUMO', 'INCENDIO_FORESTAL', 5, null, 'ROJO']
];

// Uses public APIs so each service owns its writes, validation and audit events.
export async function seedDemo({ base, username, password, fetcher = fetch, log = console.log,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), demoPassword } = {}) {
  if (!base || !username || !password) throw new Error('Faltan API_URL, ADMIN_USERNAME o ADMIN_PASSWORD.');
  if (demoPassword && demoPassword.length < 12) throw new Error('DEMO_PASSWORD debe tener al menos 12 caracteres.');
  let token;
  async function request(route, { method = 'GET', body, headers = {} } = {}) {
    const response = await fetcher(base.replace(/\/$/, '') + route, {
      method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000)
    });
    // Do not print response bodies: auth errors may include sensitive request data.
    if (!response.ok) throw new Error(`${method} ${route}: HTTP ${response.status}. Revisa los logs del servicio.`);
    if (response.status === 204) return null;
    return response.headers.get('content-type')?.includes('json') ? response.json() : response.text();
  }
  await request('/ready');
  token = (await request('/api/auth/login', { method: 'POST', body: { username, password } })).token;
  const me = await request('/api/auth/me');
  if (me.rol !== 'ADMIN') throw new Error('La semilla requiere una cuenta ADMIN.');

  const users = await request('/api/usuarios');
  for (const [name, role] of [['demo-operador', 'OPERADOR'], ['demo-consulta', 'CONSULTA']]) {
    if (users.some(user => user.username === name)) { log(`Se conserva el usuario ${name}.`); continue; }
    const generated = demoPassword ?? randomBytes(18).toString('hex');
    await request('/api/usuarios', { method: 'POST', body: {
      username: name, password: generated, nombre: `${marker} ${role}`, rol: role, activo: true
    } });
    log(`Usuario creado: ${name}; contraseña: ${generated} (guárdala; no se vuelve a mostrar).`);
  }

  const name = `${marker} Comunidad Central`;
  let community = (await request('/api/comunidades')).find(row => row.nombre === name);
  if (!community) community = await request('/api/comunidades', { method: 'POST', body: {
    nombre: name, municipio: 'San Salvador', departamento: 'San Salvador', pais: 'El Salvador',
    latitud: 13.6989, longitud: -89.1914, descripcion: `${marker} Datos ficticios para demostración.`, activo: true
  } });
  if (!community.activo) throw new Error('La comunidad demo existe inactiva; no se modifica.');

  const rules = await request('/api/configuracionalertas');
  for (const [label, tipoSensor, fenomeno, valorMinimo, valorMaximo, nivel] of ruleDefinitions) {
    const body = { nombre: `${marker} ${label}`, tipoSensor, fenomeno, valorMinimo, valorMaximo,
      nivel, mensaje: `${marker} ${label}. Umbral ilustrativo, no validado para uso meteorológico.`, activo: true };
    const existing = rules.find(row => row.nombre === body.nombre);
    if (existing) {
      if (Object.keys(body).some(key => existing[key] !== body[key]))
        throw new Error(`La regla ${body.nombre} fue modificada; se conserva. Revisa el conflicto antes de continuar.`);
    } else await request('/api/configuracionalertas', { method: 'POST', body });
  }

  const sensors = await request('/api/sensores');
  const ids = [];
  for (const [code, tipo, unidad, valor] of definitions) {
    const codigo = `DEMO-V1-${code}`;
    let sensor = sensors.find(row => row.codigo === codigo);
    if (!sensor) sensor = await request('/api/sensores', { method: 'POST', body: {
      codigo, nombre: `${marker} Sensor ${tipo}`, tipo, unidad, comunidadId: community.id,
      latitud: 13.6989, longitud: -89.1914, descripcion: `${marker} Datos ficticios.`, activo: true
    } });
    if (sensor.tipo !== tipo || sensor.comunidadId !== community.id || !sensor.activo)
      throw new Error(`Conflicto con ${codigo}; se conserva el sensor existente.`);
    ids.push(sensor.id);
    const readings = await request(`/api/lecturas?sensorId=${sensor.id}`);
    if (!readings.length) await request('/api/lecturas', { method: 'POST', body: { sensorId: sensor.id, valor } });
  }
  // Evaluation is asynchronous. Wait before generating reports that require alerts/events.
  for (const id of ids) {
    let evaluated = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if ((await request(`/api/alertas?sensorId=${id}`)).length) { evaluated = true; break; }
      await sleep(500);
    }
    if (!evaluated) throw new Error(`Evaluación pendiente para sensor ${id}. Puedes repetir la semilla sin borrar datos.`);
  }

  for (const type of reportTypes) {
    const report = await request('/api/reports', { method: 'POST',
      headers: { 'Idempotency-Key': `demo-v1-${community.id}-${type}` },
      body: { type, filters: { comunidadId: community.id } } });
    if (report.status !== 'COMPLETED')
      throw new Error(`El reporte ${type} tiene estado ${report.status}; revisa el historial. No se sobrescribe.`);
  }
  log('Semilla completa: comunidad demo, 6 sensores, 10 reglas, lecturas, alertas, eventos y 8 reportes PDF.');
  log('La auditoría se genera mediante las operaciones normales de las APIs. Los datos existentes se conservan.');
}

async function main() {
  let config = {};
  try {
    const content = await readFile(new URL('../.env', import.meta.url), 'utf8');
    config = Object.fromEntries(content.split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('#'))
      .map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^(['"])(.*)\1$/, '$2')]; }));
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const env = { ...config, ...process.env };
  await seedDemo({ base: env.API_URL ?? `http://127.0.0.1:${env.API_PORT ?? 5000}`,
    username: env.SEED_USERNAME ?? env.ADMIN_USERNAME ?? 'admin',
    password: env.SEED_PASSWORD || env.ADMIN_PASSWORD, demoPassword: env.DEMO_PASSWORD || undefined });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(error => { console.error(`Semilla detenida: ${error.message}`); process.exitCode = 1; });
