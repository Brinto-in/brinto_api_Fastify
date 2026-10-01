import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';

test('GET / returns the app status', async () => {
  const app = buildApp();

  try {
    const response = await app.inject({ method: 'GET', url: '/' });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      name: 'brinto-api-fastify',
      status: 'ok',
    });
  } finally {
    await app.close();
  }
});

test('GET /api/health returns a healthy status', async () => {
  const app = buildApp();

  try {
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: 'ok' });
  } finally {
    await app.close();
  }
});

test('GET /api/hello accepts an optional name', async () => {
  const app = buildApp();

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/api/hello?name=Vercel',
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      message: 'Hello from Fastify on Vercel!',
      name: 'Vercel',
    });
  } finally {
    await app.close();
  }
});