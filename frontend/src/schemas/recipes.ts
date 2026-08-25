import { z } from "zod";
import { nonBlankText, optionalText } from "~/schemas/common";

export const recipeSchema = z.object({
    name: nonBlankText(255, "Name"),
    description: optionalText,
});

export const recipeGridSortValues = [
    "name",
    "-name",
    "rating",
    "-rating",
    "createdAt",
    "-createdAt",
] as const;

export const recipeGridFilterSchema = z.object({
    q: z.string().trim().optional(),
    tag: z.array(z.string().trim().min(1)).default([]),
    minRating: z.number().min(0).max(5).optional(),
    sort: z.enum(recipeGridSortValues).default("name"),
    page: z.number().int().positive().optional(),
    mine: z.boolean().optional(),
});

export const normalizeGridFilters = (filters: Partial<RecipeGridFilterValues> = {}) =>
    recipeGridFilterSchema.parse(filters);

export type RecipeValues = z.output<typeof recipeSchema>;
export type RecipeInput = z.input<typeof recipeSchema>;
export type RecipeGridFilterValues = z.infer<typeof recipeGridFilterSchema>;
