import { z } from "zod";
import {
    nonBlankProse,
    nonBlankText,
    optionalText,
    quantity,
    unit,
} from "~/schemas/common";

/** RecipeSerializer. author and original_* are read-only on the server. */
export const recipeSchema = z.object({
    name: nonBlankText(255, "Name"),
    // Optional: the brief lists a description with the optional extras.
    description: optionalText,
});

/** RecipeTagSerializer. The five-per-recipe cap is enforced by a signal server-side. */
export const recipeTagSchema = z.object({
    name: nonBlankText(50, "Tag name"),
});

/** RecipeIngredientSerializer. */
export const recipeIngredientSchema = z.object({
    name: nonBlankText(255, "Ingredient name"),
    quantity,
    unit,
});

/** RecipeStepSerializer. ingredient_ids is read-only; links go through step-ingredients. */
export const recipeStepSchema = z.object({
    description: nonBlankProse("Description"),
});

/** RecipeStepIngredientSerializer. The server checks both belong to the same recipe. */
export const recipeStepIngredientSchema = z.object({
    step: z.number().int().positive(),
    ingredient: z.number().int().positive(),
});

/**
 * RecipePhotoSerializer. The file goes up as multipart, so it is a File here
 * rather than a string, and the payload is built with FormData.
 */
export const recipePhotoSchema = z.object({
    image: z.instanceof(File, { error: "Choose an image to upload." }),
    description: optionalText,
});

/**
 * RecipeReviewSerializer. The serializer requires 1-5 even though the model
 * column is nullable and allows 0, so the stricter serializer rule is the one
 * mirrored here.
 */
export const recipeReviewSchema = z.object({
    rating: z
        .number({ error: "Choose a rating." })
        .int()
        .min(1, { error: "Rating must be between 1 and 5." })
        .max(5, { error: "Rating must be between 1 and 5." }),
});

/** RecipeCommentSerializer. */
export const recipeCommentSchema = z.object({
    content: nonBlankProse("Comment"),
});

/** RecipeGridQuerySerializer. Every field is optional; sort mirrors the ChoiceField. */
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
    // Read by the paginator rather than the filter serializer, but it travels
    // with the other grid params so it belongs in the same object.
    page: z.number().int().positive().optional(),
});

/**
 * Applies defaults and drops unknown keys, so the same input always produces
 * the same object. Both the request URL and the React Query cache key are
 * built from the result, which means grid({}) and grid({ sort: "name" }) are
 * one cache entry rather than two.
 */
export const normalizeGridFilters = (filters: Partial<RecipeGridFilterValues> = {}) =>
    recipeGridFilterSchema.parse(filters);

/** Output type: what the resolver produces once defaults are applied. */
export type RecipeValues = z.output<typeof recipeSchema>;
/** Input type: what the form holds before defaults. description is optional here. */
export type RecipeInput = z.input<typeof recipeSchema>;
export type RecipeTagValues = z.infer<typeof recipeTagSchema>;
export type RecipeIngredientValues = z.infer<typeof recipeIngredientSchema>;
export type RecipeStepValues = z.infer<typeof recipeStepSchema>;
export type RecipeStepIngredientValues = z.infer<typeof recipeStepIngredientSchema>;
export type RecipePhotoValues = z.infer<typeof recipePhotoSchema>;
export type RecipeReviewValues = z.infer<typeof recipeReviewSchema>;
export type RecipeCommentValues = z.infer<typeof recipeCommentSchema>;
export type RecipeGridFilterValues = z.infer<typeof recipeGridFilterSchema>;
