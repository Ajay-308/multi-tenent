# TaskFlow API

TaskFlow is a multi-tenant project and task management API built with Express, PostgreSQL, Redis, and BullMQ.

## Environment Variables

Create a `.env` file in the project root. For local development outside Docker, use:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5433/taskflow
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-refresh-secret

# Optional: set to true to simulate an email delivery failure in tests
SIMULATE_EMAIL_FAILURE=false
```

Required variables are `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, and
`JWT_REFRESH_SECRET`. `NODE_ENV` defaults to `development` and `PORT` defaults
to `4000`.

When running with Docker Compose, use the service names instead of `localhost`:

```env
DATABASE_URL=postgres://postgres:postgres@postgres:5432/taskflow
REDIS_URL=redis://redis:6379
```

For integration tests, set `TEST_DATABASE_URL` to a separate database, for example:

```env
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5433/taskflow_test
```

## Run Locally

```bash
npm install
npm run migrate:up
npm run seed
npm run dev
```

The API runs at `http://localhost:4000`. Swagger UI is available at `http://localhost:4000/docs`.

Start the background worker in a second terminal:

```bash
npm run worker
```

## Docker Compose

```bash
docker compose up --build
```

Compose starts PostgreSQL, Redis, the API, and the worker.

## Tests

Unit tests cover authentication logic, task assignment validation and notification enqueueing, and pagination.

```bash
npm test
npm run test:watch
```

Integration tests use a dedicated PostgreSQL database configured with `TEST_DATABASE_URL`. Apply migrations to that database before running them:

```bash
$env:TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5433/taskflow_test"
$env:DATABASE_URL=$env:TEST_DATABASE_URL
npm run migrate:up
npm run test:integration
```

The integration suite truncates application tables before each test run and never uses the development database when `TEST_DATABASE_URL` is configured.

## API Documentation

- Swagger UI: `GET /docs`
- OpenAPI source: `src/docs/openapi.ts`
- Postman collection: `docs/TaskFlow.postman_collection.json`

## Verified Route Coverage

The integration suite verifies the most important multi-tenant route flows, including:

- `POST /auth/register` and `POST /auth/login`
- `GET /organizations/:orgId/members` and `POST /organizations/:orgId/members`
- `POST /organizations/:orgId/projects` and `GET /organizations/:orgId/projects/:projectId`
- `GET /organizations/:orgId/projects/:projectId/dashboard`
- `PATCH /organizations/:orgId/projects/:projectId/tasks/bulk-status`
- `GET /organizations/:orgId/projects/:projectId/tasks/search`
- `POST /organizations/:orgId/projects/:projectId/tasks/:taskId/assign`
- `GET /jobs` and related job endpoints

These are tested against the real PostgreSQL-backed Express app, not mocked handlers.

## Consistency Strategy

Task assignment and notification intent are written in one PostgreSQL transaction. The API commits the assignment before attempting to enqueue the BullMQ job. If Redis or BullMQ is unavailable, the outbox row remains pending and the worker dispatcher retries it. Duplicate assignments do not create duplicate notification intents.

## Troubleshooting

- **`node.exe not found` / Windows binaries in container**: Make sure a
  `.dockerignore` file excludes `node_modules` so your host's Windows
  `node_modules` doesn't get copied into the Linux image.

- **`ERR_CONNECTION_REFUSED` on port 4000/5433 etc.**: `docker compose run`
  does not publish ports by default. Use `docker compose up` (or
  `docker compose up -d`) to start services normally, or add
  `--service-ports` if you need `run`.

- **`relation "notification_outbox" does not exist`**: Migrations haven't
  been applied yet. Run:

  ```bash
  docker compose exec api npm run migrate:up
  ```

- **`service "api" is not running`**: The compose stack isn't up. Run
  `docker compose ps` to check status, then `docker compose up -d`.

## Demo Video

[Drive link](https://drive.google.com/file/d/1dfQ6OzneKtgWq_q4EbAKFMeCP5Hjln6f/view?usp=sharing)

Please watch this on your phone because the computer voice has a glitch.
