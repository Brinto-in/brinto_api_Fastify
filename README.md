# Fastify API on Vercel

A small Fastify API that runs locally as a Node.js server and deploys to Vercel
as a serverless function.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```sh
npm install
cp .env.example .env
npm run dev
```

The server listens on `http://localhost:3000` by default. Set `PORT` to use a
different port. Replace the example value for `MONGODB_URI` in `.env` with your
MongoDB connection string. Optionally set `MONGODB_DB` to choose a database;
otherwise the database in the connection string is used.

## MongoDB

The shared Mongoose connection helper in `src/db.js` reuses its connection across
requests. The user model is in `model/user.js`. Connect before using a model:

```js
import { connectDb } from '../src/db.js';
import User from '../model/user.js';

await connectDb();
const users = await User.find({});
```

For Vercel, add `MONGODB_URI` and optionally `MONGODB_DB` in the project's
environment variables. Do not commit `.env` or put database credentials in
source code.

## Routes

- `GET /` returns the app name and status when running locally.
- `GET /api/health` returns `{ "status": "ok" }`.
- `GET /api/hello?name=Vercel` returns a greeting.
- `GET /api/users?page=1&limit=10` returns a paginated user list without passwords.

## Deploy to Vercel

Import this repository in Vercel or run `npx vercel` from the project
directory. Vercel discovers the catch-all function in `api/[...path].js`; the
API routes are available under `/api`. Configure the MongoDB environment
variables in Vercel before calling database-backed routes.

## Test

```sh
npm test
```
