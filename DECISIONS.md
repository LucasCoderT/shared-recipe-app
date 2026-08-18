# Decisions

Here's a look at why I made certain choices throughout this project.

## Architecture

**One application, not a separate frontend and backend.**
Keeping everything under the same origin simplifies session authentication and CSRF handling,
eliminating the need for CORS or a token scheme. Plus, it means there's just one application to run.

**Django serves the built React bundle.**
With Vite writing assets directly to `/static/`,
which is where Django already looks, we can streamline production into a single process.

**Any route that is not `/api/`, `/admin/`, `/static/` or `/media/` falls through to React.**
This approach ensures that deep links work seamlessly on a cold page load, avoiding those frustrating 404 errors.

## Backend

**django-environ for settings.**
All the variables that change between different machines come from the environment,
and `env.db()` conveniently pulls the entire database configuration from a single `DATABASE_URL`.

**`ATOMIC_REQUESTS` is on.**
By running every request in a transaction, if a view fails midway, it ensures that nothing gets left half-written.

**`config/` holds project wiring, `core/` holds the application.**
This separation keeps settings and feature work distinct.

**Snake case in Python, camel case on the wire.**
Using `djangorestframework-camel-case` allows for conversion at the renderer
and parser layer, so each language can stick to its own naming conventions.

## Frontend

**TypeScript with strict mode.**

**API types are generated from the OpenAPI schema, never written by hand.**
This means any changes made on the backend are automatically reflected on the frontend,
without any extra manual effort. The types are utilized in the API client, React Query hooks, and form validation.

**The API client is handwritten rather than generated.**
It's about fifty lines of code that cover CSRF, credentials, and error handling,
which is simpler and more manageable than what a generator would produce.

**Transport lives in `api/client.ts`, endpoints are named in `api/index.ts`.**
This allows for easily updating the endpoints without touching the transport layer, and vice versa.

**Using React Query for data fetching.**
This allows for caching, background refresh and optimistic updates without any additional boilerplate.
