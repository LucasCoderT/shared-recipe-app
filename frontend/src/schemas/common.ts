import { z } from "zod";

export const nonBlankText = (max: number, label: string) =>
    z
        .string()
        .trim()
        .min(1, { error: `${label} must not be blank.` })
        .max(max, { error: `${label} must be ${max} characters or fewer.` });

export const nonBlankProse = (label: string) =>
    z
        .string()
        .trim()
        .min(1, { error: `${label} must not be blank.` });

export const optionalText = z.string().trim().default("");

export const QUANTITY_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

export const PARTIAL_QUANTITY_PATTERN = /^\d{0,8}(\.\d{0,2})?$/;

export const quantity = z
    .string()
    .trim()
    .min(1, { error: "Quantity is required." })
    .regex(QUANTITY_PATTERN, {
        error: "Use a number with up to 2 decimal places.",
    })
    .refine((value) => Number(value) >= 0.01, {
        error: "Quantity must be greater than 0.",
    });

export const optionalQuantity = z.union([quantity, z.literal("")]).optional();

export const unit = z
    .string()
    .trim()
    .max(50, { error: "Unit must be 50 characters or fewer." })
    .default("");

export const email = z
    .email({ error: "Enter a valid email address." })
    .trim()
    .max(150, { error: "Email must be 150 characters or fewer." })
    .transform((value) => value.toLowerCase());

export const currentPassword = z.string().min(1, { error: "Password is required." });

export const newPassword = z
    .string()
    .min(8, { error: "Password must be at least 8 characters." });

export const staleWriteToken = z.object({
    updatedAt: z.iso.datetime({ offset: true }).optional(),
});
