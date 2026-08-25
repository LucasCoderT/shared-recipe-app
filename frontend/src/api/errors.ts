import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "~/api/client";

const asRecord = (error: unknown): Record<string, unknown> | null => {
    if (!(error instanceof ApiError)) return null;
    if (typeof error.body !== "object" || error.body === null) return null;
    return error.body as Record<string, unknown>;
};

const firstString = (value: unknown): string | null => {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    return null;
};

export const errorMessage = (error: unknown, fallback: string): string => {
    const body = asRecord(error);
    if (!body) return fallback;

    if (typeof body.detail === "string") return body.detail;

    for (const value of Object.values(body)) {
        const message = firstString(value);
        if (message) return message;
    }
    return fallback;
};

export const applyServerErrors = <T extends FieldValues>(
    error: unknown,
    setError: UseFormSetError<T>,
    knownFields: readonly Path<T>[]
): string | null => {
    const body = asRecord(error);
    if (!body) return null;

    if (typeof body.detail === "string") return body.detail;

    let formLevel: string | null = null;
    const known = new Set<string>(knownFields);

    for (const [field, value] of Object.entries(body)) {
        const message = firstString(value);
        if (!message) continue;

        if (known.has(field)) {
            setError(field as Path<T>, { type: "server", message });
        } else if (!formLevel) {
            formLevel = message;
        }
    }
    return formLevel;
};
