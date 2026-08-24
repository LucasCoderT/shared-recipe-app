import { z } from "zod";
import { currentPassword, email, newPassword } from "~/schemas/common";

export const loginSchema = z.object({
    email,
    password: currentPassword,
});

export const registerSchema = z.object({
    email,
    password: newPassword,
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
