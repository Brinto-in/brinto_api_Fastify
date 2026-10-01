import assert from 'node:assert/strict';
import Fastify from 'fastify';
import test from 'node:test';
import User from '../model/user.js';
import { registerUserRoutes } from '../src/routes/users.js';

function createUserQuery(users: { user_id: string }[]) {
  let offset = 0;
  let limit = 10;

  const query = {
    select(fields: string) {
      assert.equal(fields, '-password');
      return query;
    },
    sort(fields: { createdAt: number }) {
      assert.deepEqual(fields, { createdAt: -1 });
      return query;
    },
    skip(value: number) {
      offset = value;
      return query;
    },
    limit(value: number) {
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

  const userModel = {
    find: () => createUserQuery(users),
    countDocuments: async () => users.length,
  } as unknown as typeof User;

  registerUserRoutes(app, {
    UserModel: userModel,
    connectToDatabase: async () => {
      connected = true;
      return undefined;
    },
  });

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users?page=2&limit=2',
    });

    assert.equal(response.statusCode, 200);
    const body = response.json() as {
      users: { user_id: string }[];
      pagination: {
        page: number;
        limit: number;
        totalUsers: number;
        totalPages: number;
      };
      timingsMs: Record<string, number>;
    };
    assert.deepEqual(body.users, [{ user_id: 'user-3' }, { user_id: 'user-4' }]);
    assert.deepEqual(body.pagination, {
      page: 2,
      limit: 2,
      totalUsers: 5,
      totalPages: 3,
    });
    assert.deepEqual(Object.keys(body.timingsMs).sort(), [
      'databaseConnection',
      'mongoCountQuery',
      'mongoUserQuery',
      'total',
    ]);
    for (const duration of Object.values(body.timingsMs)) {
      assert.equal(typeof duration, 'number');
      assert.ok(duration >= 0);
    }
    assert.match(String(response.headers['server-timing'] ?? ''), /mongo-users;dur=/);
    assert.equal(connected, true);
  } finally {
    await app.close();
  }
});

test('GET /api/users rejects invalid pagination parameters', async () => {
  const app = Fastify();
  let connected = false;

  registerUserRoutes(app, {
    UserModel: {} as typeof User,
    connectToDatabase: async () => {
      connected = true;
      return undefined;
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