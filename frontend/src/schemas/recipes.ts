import { z } from "zod";
import {
    nonBlankProse,
    nonBlankText,
    optionalText,
    quantity,
    unit,
} from "~/schemas/common";

export const recipeSchema = z.object({
    name: nonBlankText(255, "Name"),
    description: optionalText,
});

export const recipeTagSchema = z.object({
    name: nonBlankText(50, "Tag name"),
});

export const recipeIngredientSchema = z.object({
    name: nonBlankText(255, "Ingredient name"),
    quantity,
    unit,
});

export const recipeStepSchema = z.object({
    description: nonBlankProse("Description"),
});

export const recipeStepIngredientSchema = z.object({
    step: z.number().int().positive(),
    ingredient: z.number().int().positive(),
});

export const recipePhotoSchema = z.object({
    image: z.instanceof(File, { error: "Choose an image to upload." }),
    description: optionalText,
});

export const recipeReviewSchema = z.object({
    rating: z
        .number({ error: "Choose a rating." })
        .int()
        .min(1, { error: "Rating must be between 1 and 5." })
        .max(5, { error: "Rating must be between 1 and 5." }),
});

export const recipeCommentSchema = z.object({
    content: nonBlankProse("Comment"),
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
export type RecipeTagValues = z.infer<typeof recipeTagSchema>;
export type RecipeIngredientValues = z.infer<typeof recipeIngredientSchema>;
export type RecipeStepValues = z.infer<typeof recipeStepSchema>;
export type RecipeStepIngredientValues = z.infer<typeof recipeStepIngredientSchema>;
export type RecipePhotoValues = z.infer<typeof recipePhotoSchema>;
export type RecipeReviewValues = z.infer<typeof recipeReviewSchema>;
export type RecipeCommentValues = z.infer<typeof recipeCommentSchema>;
export type RecipeGridFilterValues = z.infer<typeof recipeGridFilterSchema>;
