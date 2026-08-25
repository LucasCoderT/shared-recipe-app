import { MutationCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "~/api/client";
import { errorMessage } from "~/api/errors";
import { toast } from "~/toast";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
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
