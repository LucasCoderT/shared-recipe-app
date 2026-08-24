import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Credentials } from "~/api";

/**
 * Every auth action changes who the session belongs to, so each one invalidates
 * the whoami query rather than writing the user into the cache by hand.
 */
const useAuthMutation = <TArgs>(mutationFn: (args: TArgs) => Promise<unknown>) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whoami"] }),
    });
};

export const useLoginMutation = () =>
    useAuthMutation((credentials: Credentials) => api.auth.login(credentials));
export const useRegisterMutation = () =>
    useAuthMutation((credentials: Credentials) => api.auth.register(credentials));
export const useLogoutMutation = () => useAuthMutation(() => api.auth.logout());
