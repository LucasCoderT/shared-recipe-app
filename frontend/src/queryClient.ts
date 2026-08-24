import { MutationCache, QueryClient } from "@tanstack/react-query";
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
