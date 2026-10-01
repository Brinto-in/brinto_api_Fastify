import type { FastifyInstance } from 'fastify';
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
  }, async (request) => {
    const { page, limit } = request.query;
    const offset = (page - 1) * limit;

    await connectToDatabase();

    const [users, totalUsers] = await Promise.all([
      UserModel.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    };
  });
}