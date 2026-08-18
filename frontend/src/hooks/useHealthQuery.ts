import { useQuery } from "@tanstack/react-query";
import { api } from "~/api";

export const useHealthQuery = () =>
    useQuery({
        queryKey: ["health"],
        queryFn: () => api.health(),
        retry: false,
        refetchOnWindowFocus: false,
    });
