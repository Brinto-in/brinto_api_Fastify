import assert from 'node:assert/strict';
import Fastify from 'fastify';
import test from 'node:test';
import { registerUserRoutes } from '../src/routes/users.js';

function createUserQuery(users) {
  let offset = 0;
  let limit = 10;

  const query = {
    select(fields) {
      assert.equal(fields, '-password');
      return query;
    },
    sort(fields) {
      assert.deepEqual(fields, { createdAt: -1 });
      return query;
    },
    skip(value) {
      offset = value;
      return query;
    },
    limit(value) {
      limit = value;
      return query;
    },
    lean() {
      return Promise.resolve(users.slice(offset, offset + limit));
    },
  };

  return query;
}

test('GET /api/users returns a requested page and pagination metadata', async () => {
  const app = Fastify();
  const users = [
    { user_id: 'user-1' },
    { user_id: 'user-2' },
    { user_id: 'user-3' },
    { user_id: 'user-4' },
    { user_id: 'user-5' },
  ];
  let connected = false;

  registerUserRoutes(app, {
    UserModel: {
      find: () => createUserQuery(users),
      countDocuments: async () => users.length,
    },
    connectToDatabase: async () => {
      connected = true;
    },
  });

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users?page=2&limit=2',
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      users: [{ user_id: 'user-3' }, { user_id: 'user-4' }],
      pagination: {
        page: 2,
        limit: 2,
        totalUsers: 5,
        totalPages: 3,
      },
    });
    assert.equal(connected, true);
  } finally {
    await app.close();
  }
});

test('GET /api/users rejects invalid pagination parameters', async () => {
  const app = Fastify();
  let connected = false;

  registerUserRoutes(app, {
    UserModel: {},
    connectToDatabase: async () => {
      connected = true;
    },
  });

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users?page=0&limit=101',
    });

    assert.equal(response.statusCode, 400);
    assert.equal(connected, false);
  } finally {
    await app.close();
  }
});