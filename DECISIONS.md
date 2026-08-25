# Decisions

Here's a look at why I made certain choices throughout this project.

## Architecture

**One application, not a separate frontend and backend.**
Keeping everything under the same origin simplifies session authentication and CSRF handling, eliminating the need for
CORS or a token scheme. Plus, it means there's just one application to run.

**Django serves the built React bundle.**
With Vite writing assets directly to `/static/`, which is where Django already looks, production runs as a single
process.

**Any route that is not `/api/`, `/admin/`, `/static/` or `/media/` falls through to React.**
Deep links keep working on a cold page load instead of turning into 404s.

## Backend

**django-environ for settings.**
All the variables that change between different machines come from the environment, and `env.db()` conveniently pulls
the entire database configuration from a single `DATABASE_URL`.

**`ATOMIC_REQUESTS` is on.**
By running every request in a transaction, if a view fails midway, it ensures that nothing gets left half-written.

**`config/` holds project wiring, `core/` holds the application.**
This separation keeps settings and feature work distinct.

**Snake case in Python, camel case on the wire.**
Using `djangorestframework-camel-case` allows for conversion at the renderer and parser layer, so each language can
stick to its own naming conventions.

**Optimistic locking rather than locking the row while someone edits.**
Just because someone is on the edit page does not mean they are always editing the item. Not locking lets everyone open
the page, but only one person can send an update at any given time. The user with the out of date information gets a 409
back and has to reload the page to get the latest data, so their edit is refused rather than silently overwriting
someone else's.

**Ownership is checked separately from group permissions.**
Model permissions are per model, not per row. Without the ownership check, anyone in Recipe Editors could edit anyone's
recipe.

**Read scoping lives in `get_queryset`, not in the permission class.**
Recipes are meant to be public and shopping lists aren't, and one shared permission class cannot say both. So the read
scoping moved into `get_queryset` on the shopping list viewsets.

**The grid gets its rating from a subquery, not an aggregate over a join.**
The subquery keeps the rating filter in `WHERE` instead of `HAVING`, so rows are discarded before the average is
computed rather than after. Aggregating over a join is also fragile once you combine it with the tag join or add a
second aggregate, and I would rather not have that pattern in the query at all.

**Each column on the grid card is loaded a different way.**
The rating comes from the subquery above, photos and tags from `Prefetch` with `to_attr` so they are ordered in SQL
rather than in Python, and the author from `select_related`. Pages are 24 rows, so the number of queries stays flat no
matter how many recipes exist.

**A fixed unit list instead of a units library.**
The first version used pint. A recipe needs clove, pinch and can far more than it needs picoinch,
and a general units registry happily accepts the latter while rejecting the former. The unit field
is now a select over one shared list, so the server only has to check membership, and the
dependency went away.

## Frontend

**TypeScript with strict mode.**

**API types are generated from the OpenAPI schema, never written by hand.**
This means any changes made on the backend are automatically reflected on the frontend, without any extra manual effort.
The types are used in the API client, React Query hooks, and form validation.

**The API client is handwritten rather than generated.**
It's about fifty lines of code that cover CSRF, credentials, and error handling, which is simpler and more manageable
than what a generator would produce.

**Transport lives in `api/client.ts`, endpoints are named in `api/index.ts`.**
This allows for easily updating the endpoints without touching the transport layer, and vice versa.

**Using React Query for data fetching.**
This allows for caching, background refresh and optimistic updates without any additional boilerplate.

**Logic lives in hooks, components just lay things out.**
This is a personal organization preference: I like my views and components as simple as possible, without business logic
bogging them down, so I always prefer extracting the logic into hooks:
easier to read, easier to refactor, and easier to test if needed. By the time I extracted
`useAddForm`, the same add-a-thing-and-clear-the-form logic had appeared five times.

**A component library rather than hand-built components.**
I tend to prefer component libraries as they help with ramp-up time without having to build all the components manually.
For this project, I chose Material UI because it is widely used and well-documented.

**The route guard is not the security boundary.**
The react router guard is just a convenience for the user. The backend is the security boundary, and it enforces
permissions on every request.

**The client only validates what it can know on its own.**
The server is the source of truth, so the client only validates what it can know without talking to the server. For
example, the client can check that a quantity is a valid decimal, but it cannot check that the unit is valid because the
server is the source of truth for that.

## Known gaps

**Test coverage.**
The original suite was written against Django's default user model and none of it survived the
switch to the custom one. That was mostly a time constraint: I chose finishing the spec over
keeping the tests up to date. The suite that replaced it is focused on dedicated, small tests that
are easy to follow: the grid query, uniqueness rules, units, the detail payload, shopping lists and
the seed command. Permissions and the stale-write checks are what I would cover next, since those
are the claims with the least backing right now.

**The bugs that only showed up in a browser.**
The two worst bugs never appeared in any backend test. Image URLs were built from the Host header,
which the dev proxy rewrites, so under Docker every image pointed at a hostname only other
containers could resolve. CSRF trusted origins were unset, and that stayed hidden because
anonymous requests skip the CSRF check, so login worked while every authenticated write failed.
Each layer was correct on its own and both bugs lived where the layers met. Every layer added
introduces new complexities that must be considered, and the test that catches this kind is
running the assembled application the way a user does.

**Creating a recipe takes two screens.**
Ingredients, steps, tags and photos are separate resources that need the recipe's id before they
can exist, so create captures the name and description and hands off to the edit screen. Given the
time I would prefer writing a nested writable serializer that accepts the whole recipe in one
request; for now each request stays scoped to one resource rather than adding that surface late.
