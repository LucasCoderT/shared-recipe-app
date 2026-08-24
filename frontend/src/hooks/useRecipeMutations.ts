import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/api";
import { keys } from "~/api/queries";
import type { components } from "~/schema";

type FullRecipe = components["schemas"]["FullRecipe"];

type Id = number | string;

/**
 * Every recipe mutation refreshes the same key.
 *
 * FullRecipe carries ingredients, steps, tags, photos, reviews and comments in
 * one payload, so invalidating the detail query is enough to refresh any child
 * change. The grid is invalidated too, because name, rating and tags all show
 * on the card.
 */
export const useRecipeMutations = (recipeId: Id) => {
    const client = useQueryClient();

    const refresh = async () => {
        await Promise.all([
            client.invalidateQueries({ queryKey: keys.recipes.detail(recipeId) }),
            client.invalidateQueries({ queryKey: keys.recipes.all }),
        ]);
    };

    const onSuccess = () => refresh();

    return {
        updateRecipe: useMutation({
            meta: { success: 'Recipe saved.' },
            mutationFn: (body: { name?: string; description?: string; updatedAt?: string }) =>
                api.recipes.update(recipeId, body),
            onSuccess,
        }),
        deleteRecipe: useMutation({
            meta: { success: "Recipe deleted." },
            mutationFn: (updatedAt?: string) => api.recipes.destroy(recipeId, updatedAt),
            // Drop the detail query rather than invalidating it. Invalidation
            // refetches, and refetching a deleted recipe means a 404 plus
            // retries that the caller's onSuccess waits behind -- so the page
            // sits on the deleted recipe for seconds before redirecting.
            onSuccess: () => {
                client.removeQueries({ queryKey: keys.recipes.detail(recipeId) });
                // Not awaited: the caller redirects in its own onSuccess, and
                // waiting on the grid refetch first would delay it.
                void client.invalidateQueries({ queryKey: keys.recipes.all });
            },
        }),
        addIngredient: useMutation({
            meta: { success: 'Ingredient added.' },
            mutationFn: (body: { name: string; quantity: string; unit: string }) =>
                api.recipeIngredients.create(recipeId, body),
            onSuccess,
        }),
        removeIngredient: useMutation({
            meta: { success: 'Ingredient removed.' },
            mutationFn: (id: number) => api.recipeIngredients.destroy(recipeId, id),
            onSuccess,
        }),
        /**
         * Reorders optimistically: the list is rewritten in the cache before the
         * request goes out, so the dragged row stays where it was dropped. A
         * failure rolls the cache back to the snapshot taken here -- without
         * that, a rejected drag would visually snap back a moment later and
         * read as a bug.
         */
        reorderSteps: useMutation({
            meta: { success: 'Steps reordered.' },
            mutationFn: (order: number[]) => api.recipeSteps.reorder(recipeId, order),
            onMutate: async (order: number[]) => {
                const key = keys.recipes.detail(recipeId);
                await client.cancelQueries({ queryKey: key });
                const previous = client.getQueryData<FullRecipe>(key);

                if (previous) {
                    const byId = new Map(previous.steps.map((step) => [step.id, step]));
                    client.setQueryData<FullRecipe>(key, {
                        ...previous,
                        steps: order
                            .map((id) => byId.get(id))
                            .filter((step): step is FullRecipe["steps"][number] =>
                                Boolean(step)
                            ),
                    });
                }
                return { previous };
            },
            onError: (_error, _order, context) => {
                if (context?.previous) {
                    client.setQueryData(keys.recipes.detail(recipeId), context.previous);
                }
            },
            onSettled: onSuccess,
        }),
        addStep: useMutation({
            meta: { success: 'Step added.' },
            mutationFn: (body: { description: string }) => api.recipeSteps.create(recipeId, body),
            onSuccess,
        }),
        removeStep: useMutation({
            meta: { success: 'Step removed.' },
            mutationFn: (id: number) => api.recipeSteps.destroy(recipeId, id),
            onSuccess,
        }),
        addTag: useMutation({
            meta: { success: 'Tag added.' },
            mutationFn: (body: { name: string }) => api.recipeTags.create(recipeId, body),
            onSuccess,
        }),
        removeTag: useMutation({
            meta: { success: 'Tag removed.' },
            mutationFn: (id: number) => api.recipeTags.destroy(recipeId, id),
            onSuccess,
        }),
        uploadPhoto: useMutation({
            meta: { success: 'Photo uploaded.' },
            mutationFn: ({ image, description }: { image: File; description?: string }) =>
                api.recipePhotos.create(recipeId, image, description ?? ""),
            onSuccess,
        }),
        removePhoto: useMutation({
            meta: { success: 'Photo removed.' },
            mutationFn: (id: number) => api.recipePhotos.destroy(recipeId, id),
            onSuccess,
        }),
        addReview: useMutation({
            meta: { success: 'Rating saved.' },
            mutationFn: (body: { rating: number }) => api.recipeReviews.create(recipeId, body),
            onSuccess,
        }),
        updateReview: useMutation({
            meta: { success: 'Rating updated.' },
            mutationFn: ({ id, rating }: { id: number; rating: number }) =>
                api.recipeReviews.update(recipeId, id, { rating }),
            onSuccess,
        }),
        addComment: useMutation({
            meta: { success: 'Comment posted.' },
            mutationFn: (body: { content: string }) => api.recipeComments.create(recipeId, body),
            onSuccess,
        }),
        removeComment: useMutation({
            meta: { success: 'Comment deleted.' },
            mutationFn: (id: number) => api.recipeComments.destroy(recipeId, id),
            onSuccess,
        }),
    };
};

/** Cloning creates a new recipe, so it invalidates the list rather than one row. */
export const useCloneRecipe = () => {
    const client = useQueryClient();
    return useMutation({
        meta: { success: "Recipe copied to your recipes." },
        mutationFn: (recipeId: Id) => api.recipes.clone(recipeId),
        onSuccess: () => client.invalidateQueries({ queryKey: keys.recipes.all }),
    });
};

export const useCreateRecipe = () => {
    const client = useQueryClient();
    return useMutation({
        meta: { success: "Recipe created." },
        mutationFn: (body: { name: string; description?: string }) => api.recipes.create(body),
        onSuccess: () => client.invalidateQueries({ queryKey: keys.recipes.all }),
    });
};
