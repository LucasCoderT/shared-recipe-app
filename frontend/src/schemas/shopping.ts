import { z } from "zod";
import { nonBlankText, optionalQuantity, unit } from "~/schemas/common";

export const shoppingListSchema = z.object({
    name: nonBlankText(255, "Name"),
});

export const shoppingListItemSchema = z.object({
    name: nonBlankText(255, "Item name"),
    quantity: optionalQuantity,
    unit,
    purchased: z.boolean().default(false),
});

export const copyFromRecipeSchema = z.object({
    recipe: z.number().int().positive({ error: "Choose a recipe to copy from." }),
});

export type ShoppingListValues = z.infer<typeof shoppingListSchema>;
export type ShoppingListItemValues = z.infer<typeof shoppingListItemSchema>;
export type CopyFromRecipeValues = z.infer<typeof copyFromRecipeSchema>;
