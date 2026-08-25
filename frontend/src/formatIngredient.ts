export const formatIngredient = (parts: {
    quantity?: string | null;
    unit?: string | null;
    name: string;
}): string => [parts.quantity, parts.unit, parts.name].filter(Boolean).join(" ");
