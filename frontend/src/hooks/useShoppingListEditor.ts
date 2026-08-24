import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { shoppingListQueries } from "~/api/queries";
import { useAddForm } from "~/hooks/useAddForm";
import { useConfirmedAction } from "~/hooks/useConfirmedAction";
import { useShoppingItemMutations, useShoppingListMutations } from "~/hooks/useShoppingMutations";
import { QUANTITY_PATTERN } from "~/schemas";

export const useShoppingListEditor = (listId: string) => {
    const navigate = useNavigate();
    const confirmed = useConfirmedAction();
    const { add, toggle, remove } = useShoppingItemMutations(listId);
    const { remove: removeList } = useShoppingListMutations();

    const list = useQuery(shoppingListQueries.detail(listId));
    const items = useQuery(shoppingListQueries.items(listId));

    const itemForm = useAddForm({
        initial: { name: "", quantity: "", unit: "" },
        // Quantity is optional here: "milk" with no amount is a legitimate
        // shopping list entry. It just has to be well formed when given.
        isValid: (v) =>
            Boolean(v.name.trim()) && (!v.quantity || QUANTITY_PATTERN.test(v.quantity)),
        onSubmit: (v) =>
            add.mutateAsync({
                name: v.name.trim(),
                unit: v.unit.trim(),
                ...(v.quantity ? { quantity: v.quantity } : {}),
            }),
    });

    const rows = items.data?.results ?? [];

    return {
        list: list.data,
        isPending: list.isPending,
        isError: list.isError,
        error: list.error,
        rows,
        rowsPending: items.isPending,
        outstanding: rows.filter((row) => !row.purchased).length,
        itemForm,
        quantityInvalid:
            Boolean(itemForm.values.quantity) && !QUANTITY_PATTERN.test(itemForm.values.quantity),
        togglePurchased: (id: number, purchased: boolean) => toggle.mutate({ id, purchased }),
        removeItem: (id: number, label: string) =>
            confirmed(
                {
                    title: "Remove this item?",
                    message: `"${label}" will be removed from this list.`,
                },
                () => remove.mutate(id)
            ),
        deleteList: () => {
            if (!list.data) return;
            removeList.mutate(list.data.id, {
                onSuccess: () => void navigate("/shopping-lists", { replace: true }),
            });
        },
        deletingList: removeList.isPending,
    };
};
