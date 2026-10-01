import assert from 'node:assert/strict';
import test from 'node:test';
import { connectDb } from '../src/db.js';

test('connectDb reports missing MongoDB configuration', async () => {
  const originalUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  try {
    await assert.rejects(connectDb(), /MONGODB_URI is not set/);
  } finally {
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
  }
});