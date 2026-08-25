// The API sends decimals as fixed-point strings ("3.00", "0.50"); show them
// the way a recipe would ("3", "0.5").
const formatQuantity = (quantity: string): string => {
    const value = Number(quantity);
    return Number.isFinite(value) ? String(value) : quantity;
};

export const formatIngredient = (parts: {
    quantity?: string | null;
    unit?: string | null;
    name: string;
}): string =>
    [parts.quantity ? formatQuantity(parts.quantity) : null, parts.unit, parts.name]
        .filter(Boolean)
        .join(" ");
