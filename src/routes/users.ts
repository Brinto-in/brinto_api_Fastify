import type { FastifyInstance } from 'fastify';
import { performance } from 'node:perf_hooks';
import User from '../../model/user.js';
import { connectDb } from '../db.js';

interface PaginationQuery {
  page: number;
  limit: number;
}

interface UserRouteDependencies {
  UserModel?: typeof User;
  connectToDatabase?: () => Promise<unknown>;
}

async function measure<T>(operation: () => PromiseLike<T> | T) {
  const startedAt = performance.now();
  const value = await operation();

  return {
    value,
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
  };
}

export function registerUserRoutes(
  app: FastifyInstance,
  {
    UserModel = User,
    connectToDatabase = connectDb,
  }: UserRouteDependencies = {},
): void {
  app.get<{ Querystring: PaginationQuery }>('/api/users', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const startedAt = performance.now();
    const { page, limit } = request.query;
    const offset = (page - 1) * limit;

    const { durationMs: databaseConnectionMs } = await measure(connectToDatabase);

    const [userQuery, countQuery] = await Promise.all([
      measure(() => UserModel.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean()),
      measure(() => UserModel.countDocuments()),
    ]);
    const totalMs = Number((performance.now() - startedAt).toFixed(2));
    const timingsMs = {
      databaseConnection: databaseConnectionMs,
      mongoUserQuery: userQuery.durationMs,
      mongoCountQuery: countQuery.durationMs,
      total: totalMs,
    };

    reply.header('Server-Timing', [
      `db-connect;dur=${timingsMs.databaseConnection}`,
      `mongo-users;dur=${timingsMs.mongoUserQuery}`,
      `mongo-count;dur=${timingsMs.mongoCountQuery}`,
      `total;dur=${timingsMs.total}`,
    ].join(', '));

    return {
      users: userQuery.value,
      pagination: {
        page,
        limit,
        totalUsers: countQuery.value,
        totalPages: Math.ceil(countQuery.value / limit),
      },
      timingsMs,
    };
  });
}