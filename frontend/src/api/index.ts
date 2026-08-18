import { apiFetch, type OperationResponse } from "~/api/client";

export const api = {
    health: (options?: RequestInit) => {
        return apiFetch<OperationResponse<"health">>("/health/", options);
    },
    whoami: (options?: RequestInit) => {
        return apiFetch<OperationResponse<"whoami">>("/whoami/", options);
    },
};
