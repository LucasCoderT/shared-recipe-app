import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/api";
import { keys } from "~/api/queries";

type Id = number | string;

export const useShoppingListMutations = () => {
    const client = useQueryClient();
    const onSuccess = () => client.invalidateQueries({ queryKey: keys.shoppingLists.all });

    return {
        create: useMutation({
            meta: { success: 'List created.' },
            mutationFn: (body: { name: string }) => api.shoppingLists.create(body),
            onSuccess,
        }),
        remove: useMutation({
            meta: { success: "List deleted." },
            mutationFn: (id: Id) => api.shoppingLists.destroy(id),
            // Same reason as deleting a recipe: refetching the deleted list
            // would 404 and stall the redirect behind the retries.
            onSuccess: (_data, id) => {
                client.removeQueries({ queryKey: keys.shoppingLists.detail(id) });
                client.removeQueries({ queryKey: keys.shoppingLists.items(id) });
                void client.invalidateQueries({ queryKey: keys.shoppingLists.all });
            },
        }),
    };
};

export const useShoppingItemMutations = (listId: Id) => {
    const client = useQueryClient();
    const onSuccess = async () => {
        await Promise.all([
            client.invalidateQueries({ queryKey: keys.shoppingLists.items(listId) }),
            client.invalidateQueries({ queryKey: keys.shoppingLists.detail(listId) }),
        ]);
    };

    return {
        add: useMutation({
            meta: { success: 'Item added.' },
            mutationFn: (body: { name: string; quantity?: string; unit: string }) =>
                api.shoppingListItems.create(listId, body),
            onSuccess,
        }),
        toggle: useMutation({
            meta: { success: 'Updated.' },
            mutationFn: ({ id, purchased }: { id: number; purchased: boolean }) =>
                api.shoppingListItems.update(listId, id, { purchased }),
            onSuccess,
        }),
        remove: useMutation({
            mutationFn: (id: number) => api.shoppingListItems.destroy(listId, id),
            onSuccess,
        }),
        /** Bulk-adds every ingredient from a recipe. */
        copyFromRecipe: useMutation({
            meta: { success: 'Ingredients added to your list.' },
            mutationFn: (recipeId: number) => api.shoppingLists.copyFromRecipe(listId, recipeId),
            onSuccess,
        }),
    };
};
