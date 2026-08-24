import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/api";
import { keys } from "~/api/queries";

type Id = number | string;

export const useShoppingListMutations = () => {
    const client = useQueryClient();
    const onSuccess = () => client.invalidateQueries({ queryKey: keys.shoppingLists.all });

    return {
        create: useMutation({
            mutationFn: (body: { name: string }) => api.shoppingLists.create(body),
            onSuccess,
        }),
        remove: useMutation({
            mutationFn: (id: Id) => api.shoppingLists.destroy(id),
            onSuccess,
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
            mutationFn: (body: { name: string; quantity?: string; unit: string }) =>
                api.shoppingListItems.create(listId, body),
            onSuccess,
        }),
        toggle: useMutation({
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
            mutationFn: (recipeId: number) => api.shoppingLists.copyFromRecipe(listId, recipeId),
            onSuccess,
        }),
    };
};
