/**
 * Thin fetch wrapper for Django's session-authenticated API.
 * Assumes JSON responses and adds CSRF for mutating requests.
 */

import type { operations } from "~/schema";

type JsonResponseBody<response> = response extends {
    content: { "application/json": infer body };
}
    ? body
    : never;

type SuccessResponse<responseMap> = responseMap extends { "200": infer okResponse }
    ? JsonResponseBody<okResponse>
    : responseMap extends { "201": infer createdResponse }
      ? JsonResponseBody<createdResponse>
      : never;

export type OperationResponse<key extends keyof operations> = SuccessResponse<
    operations[key]["responses"]
>;

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(status: number, body: unknown, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

/**
 * Serialise any params object into a query string.
 *
 * URLSearchParams is the built-in for this; the only thing it does not decide
 * for you is what to do with absent values and arrays. Empty and undefined are
 * dropped so an unset filter does not become "?q=", and arrays are repeated
 * (?tag=a&tag=b) because that is what DRF's ListField reads off a QueryDict.
 */
export const toQuery = (params: Record<string, unknown>): string => {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;

        if (Array.isArray(value)) {
            for (const entry of value) search.append(key, String(entry));
            continue;
        }
        search.set(key, String(value));
    }

    const query = search.toString();
    return query ? `?${query}` : "";
};

const csrfProtectedMethods = ["POST", "PUT", "PATCH", "DELETE"];

const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match?.[1] ? decodeURIComponent(match[1]) : null;
};

export const apiFetch = async <T>(
    path: string,
    options: RequestInit = {}
): Promise<T> => {
    const method = (options.method ?? "GET").toUpperCase();
    const headers = new Headers(options.headers);

    headers.set("Accept", "application/json");
    // FormData must set its own Content-Type so the multipart boundary is
    // included; anything else we send is JSON.
    if (options.body !== undefined && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }
    if (csrfProtectedMethods.includes(method)) {
        const csrfToken = getCookie("csrftoken");
        if (csrfToken) {
            headers.set("X-CSRFToken", csrfToken);
        }
    }

    const response = await fetch(`/api${path}`, {
        ...options,
        method,
        headers,
        credentials: "same-origin",
    });

    const text = await response.text();
    const body: unknown = text ? JSON.parse(text) : null;

    if (!response.ok) {
        throw new ApiError(
            response.status,
            body,
            `${method} /api${path} failed`
        );
    }
    return body as T;
};
