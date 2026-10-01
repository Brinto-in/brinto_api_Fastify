import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from '../src/app.js';

const app = buildApp();

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  await app.ready();
  app.server.emit('request', request, response);
}