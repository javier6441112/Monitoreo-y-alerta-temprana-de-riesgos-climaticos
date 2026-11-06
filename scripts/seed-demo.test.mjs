import assert from 'node:assert/strict';
import test from 'node:test';
import { seedDemo } from './seed-demo.mjs';

function fixture() {
  const state = { users: [{ username: 'existing-admin' }], communities: [], rules: [], sensors: [], readings: [], reports: new Map() };
  let failReading = false;
  async function fetcher(url, options) {
    const { pathname: route, searchParams } = new URL(url);
    const body = options.body ? JSON.parse(options.body) : null;
    const method = options.method;
    if (route === '/ready') return new Response('Healthy', { headers: { 'Content-Type': 'text/plain' } });
    if (route === '/api/auth/login') return Response.json({ token: 'test-token' });
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    if (route === '/api/auth/me') return Response.json({ rol: 'ADMIN' });
    const collections = { '/api/usuarios': 'users', '/api/comunidades': 'communities',
      '/api/configuracionalertas': 'rules', '/api/sensores': 'sensors' };
    if (collections[route]) {
      const rows = state[collections[route]];
      if (method === 'GET') return Response.json(rows);
      const row = { ...body, id: 100 + rows.length };
      rows.push(row);
      return Response.json(row, { status: 201 });
    }
    if (route === '/api/lecturas') {
      if (method === 'GET') return Response.json(state.readings.filter(row => row.sensorId === Number(searchParams.get('sensorId'))));
      if (failReading) { failReading = false; return new Response(null, { status: 503 }); }
      state.readings.push(body);
      return Response.json(body);
    }
    if (route === '/api/alertas') return Response.json([{ id: 1 }]);
    if (route === '/api/reports') {
      assert.equal(body.filters.comunidadId, 100); // Do not assume database IDs start at one.
      const key = options.headers['Idempotency-Key'];
      if (!state.reports.has(key)) state.reports.set(key, { status: 'COMPLETED', id: key });
      return Response.json(state.reports.get(key), { status: 201 });
    }
    throw new Error(`Unexpected ${method} ${route}`);
  }
  return { state, fetcher, failNextReading() { failReading = true; } };
}
const options = { base: 'http://test', username: 'existing-admin', password: 'test-password', log() {}, sleep: async () => {} };

test('repeat execution preserves existing records and creates no duplicate demo rows', async () => {
  const { state, fetcher } = fixture();
  await seedDemo({ ...options, fetcher });
  const original = structuredClone(state);
  await seedDemo({ ...options, fetcher });
  assert.deepEqual(state, original);
  assert.equal(state.users.length, 3);
  assert.equal(state.communities.length, 1);
  assert.equal(state.rules.length, 10);
  assert.equal(state.sensors.length, 6);
  assert.equal(state.readings.length, 6);
  assert.equal(state.reports.size, 8);
});

test('a failed write can be resumed without duplicating completed steps', async () => {
  const f = fixture();
  f.failNextReading();
  await assert.rejects(seedDemo({ ...options, fetcher: f.fetcher }), /HTTP 503/);
  await seedDemo({ ...options, fetcher: f.fetcher });
  assert.equal(f.state.communities.length, 1);
  assert.equal(f.state.rules.length, 10);
  assert.equal(f.state.sensors.length, 6);
  assert.equal(f.state.readings.length, 6);
});

test('a modified demo rule is preserved and reported as a conflict', async () => {
  const f = fixture();
  await seedDemo({ ...options, fetcher: f.fetcher });
  f.state.rules[0].valorMinimo = 999;
  await assert.rejects(seedDemo({ ...options, fetcher: f.fetcher }), /fue modificada/);
  assert.equal(f.state.rules[0].valorMinimo, 999);
});
