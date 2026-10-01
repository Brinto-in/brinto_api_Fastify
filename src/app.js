import Fastify from 'fastify';
import { registerUserRoutes } from './routes/users.js';

export function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  app.get('/', async () => ({
    name: 'brinto-api-fastify',
    status: 'ok',
  }));

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.get('/api/hello', async (request) => ({
    message: 'Hello from Fastify on Vercel!',
    name: request.query.name ?? 'world',
  }));

  registerUserRoutes(app);

  return app;
}