import { redirect, type MiddlewareFunction } from "react-router";
import { whoamiQuery } from "~/api/queries";
import { queryClient } from "~/queryClient";

export const requireAuth: MiddlewareFunction = async ({ request }, next) => {
    const whoami = await queryClient.fetchQuery(whoamiQuery).catch(() => null);

    if (!whoami?.authenticated) {
        const target = new URL(request.url);
        const next = `${target.pathname}${target.search}`;
        // Throwing a Response is how react-router middleware signals a redirect.
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw redirect(`/login?next=${encodeURIComponent(next)}`);
    }

    return next();
};
