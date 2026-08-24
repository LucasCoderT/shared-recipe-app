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

/**
 * Pull something readable out of a DRF error body.
 *
 * Validation errors arrive as {field: [message]} and everything else as
 * {detail: message}, so both shapes are unwrapped to the first string found.
 */
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

/**
 * Place DRF field errors onto the matching form fields.
 *
 * The server is the authority on rules the client cannot check — whether a unit
 * exists, whether a password is too common, whether a recipe already has five
 * tags. Those come back keyed by field name, and this puts each one under the
 * input it belongs to instead of in a banner detached from the problem.
 *
 * Anything that does not match a known field is returned so the caller can show
 * it as a form-level message.
 */
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
            // non_field_errors, or a field the form does not render.
            formLevel = message;
        }
    }
    return formLevel;
};
