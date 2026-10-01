# Fastify API on Vercel

A small Fastify API that runs locally as a Node.js server and deploys to Vercel
as a serverless function.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```sh
npm install
npm run dev
```

The server listens on `http://localhost:3000` by default. Set `PORT` to use a
different port.

## Routes

- `GET /` returns the app name and status when running locally.
- `GET /api/health` returns `{ "status": "ok" }`.
- `GET /api/hello?name=Vercel` returns a greeting.

## Deploy to Vercel

Import this repository in Vercel or run `npx vercel` from the project
directory. Vercel discovers the catch-all function in `api/[...path].js`; the
API routes are available under `/api`.

## Test

```sh
npm test
```
