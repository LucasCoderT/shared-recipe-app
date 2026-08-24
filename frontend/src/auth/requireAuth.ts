import { redirect, type MiddlewareFunction } from "react-router";
import { whoamiQuery } from "~/api/queries";
import { queryClient } from "~/queryClient";

/**
 * Route middleware that gates a whole branch of the route tree.
 *
 * Attached to a pathless layout route, so every child inherits the check and no
 * individual page has to remember to guard itself. Adding a protected route is
 * a matter of nesting it, not of wiring anything up.
 *
 * `fetchQuery` honours the query's staleTime: inside that window it returns the
 * cached whoami and costs nothing, and outside it waits on a fresh request. It
 * resolves against the same QueryClient the components read, which is why that
 * client lives at module scope in ~/queryClient.
 *
 * This is a UX affordance, not the security boundary. Every API endpoint
 * enforces its own permissions, so the worst a stale guard can do is render a
 * page whose requests then come back 403.
 *
 * Throwing a redirect is how React Router short-circuits a navigation: the
 * protected component never mounts, so there is no flash of gated content.
 */
export const requireAuth: MiddlewareFunction = async ({ request }, next) => {
    const whoami = await queryClient.fetchQuery(whoamiQuery).catch(() => null);

    if (!whoami?.authenticated) {
        // Preserve where they were going so login can send them back.
        const target = new URL(request.url);
        const next = `${target.pathname}${target.search}`;
        // React Router signals a redirect by throwing a Response; this is the
        // documented contract for middleware, not an error being thrown.
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw redirect(`/login?next=${encodeURIComponent(next)}`);
    }

    return next();
};
