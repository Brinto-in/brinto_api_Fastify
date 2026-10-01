import { buildApp } from '../src/app.js';

const app = buildApp();

export default async function handler(request, response) {
  await app.ready();
  app.server.emit('request', request, response);
}