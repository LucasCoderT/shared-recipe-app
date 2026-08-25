import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Credentials } from "~/api";

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
