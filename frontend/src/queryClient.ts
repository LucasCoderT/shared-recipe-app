import { MutationCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "~/api/client";
import { errorMessage } from "~/api/errors";
import { toast } from "~/toast";

/**
 * Created at module scope rather than inside a component so router middleware
 * can reach the same cache the components use. Without that the auth guard
 * would fire its own /whoami request on every navigation.
 *
 * Toasts are handled once here instead of per mutation. Every failed mutation
 * reports itself, so a silent failure is not possible; success messages are
 * opt-in through `meta.success`, because not every write is worth interrupting
 * for. Query definitions live in ~/api/queries.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            /**
             * Never retry a 4xx. The default policy retries three times, which
             * for a deleted resource means four 404s and several seconds of the
             * page sitting there before a redirect can run. A client error will
             * not become a success by asking again.
             */
            retry: (failureCount, error) => {
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                    return false;
                }
                return failureCount < 2;
            },
        },
    },
    mutationCache: new MutationCache({
        onError: (error, _variables, _context, mutation) => {
            const fallback =
                typeof mutation.meta?.errorMessage === "string"
                    ? mutation.meta.errorMessage
                    : "Something went wrong.";
            toast.error(errorMessage(error, fallback));
        },
        onSuccess: (_data, _variables, _context, mutation) => {
            if (typeof mutation.meta?.success === "string") {
                toast.success(mutation.meta.success);
            }
        },
    }),
});
