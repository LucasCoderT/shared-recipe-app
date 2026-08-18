import { useQuery } from "@tanstack/react-query";
import { api } from "~/api";

export const useWhoamiQuery = () =>
    useQuery({
        queryKey: ["whoami"],
        queryFn: () => api.whoami(),
        retry: false,
        refetchOnWindowFocus: false,
    });
