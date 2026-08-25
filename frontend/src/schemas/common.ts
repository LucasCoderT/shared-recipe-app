import { z } from "zod";

export const nonBlankText = (max: number, label: string) =>
    z
        .string()
        .trim()
        .min(1, { error: `${label} must not be blank.` })
        .max(max, { error: `${label} must be ${max} characters or fewer.` });

export const optionalText = z.string().trim().default("");

export const QUANTITY_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

export const PARTIAL_QUANTITY_PATTERN = /^\d{0,8}(\.\d{0,2})?$/;

export const email = z
    .email({ error: "Enter a valid email address." })
    .trim()
    .max(150, { error: "Email must be 150 characters or fewer." })
    .transform((value) => value.toLowerCase());

export const currentPassword = z.string().min(1, { error: "Password is required." });

export const newPassword = z.string().min(8, { error: "Password must be at least 8 characters." });
