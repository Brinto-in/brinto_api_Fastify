import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import test from 'node:test';
import User from '../model/user.js';

test('user model applies defaults and validates required fields', async () => {
  const user = new User({
    user_name: 'sample-user',
    phone: '5550100',
    password: 'password',
    user_id: 'user-1',
  });

  assert.deepEqual(user.role, ['USER']);
  assert.equal(user.login_platform, 'web');
  assert.equal(user.status, 1);
  await assert.doesNotReject(user.validate());
});

test('comparePassword checks a hashed password', async () => {
  const password = 'correct-password';
  const user = new User({
    user_name: 'sample-user',
    phone: '5550100',
    password: await bcrypt.hash(password, 10),
    user_id: 'user-1',
  });

  assert.equal(await user.comparePassword(password), true);
  assert.equal(await user.comparePassword('wrong-password'), false);
});