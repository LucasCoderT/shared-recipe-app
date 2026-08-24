/**
 * "250.00 gram flour", or "3 eggs" when there is no unit.
 *
 * The unit is optional, so joining on spaces blindly would leave a double gap
 * for countable ingredients.
 */
export const formatIngredient = (parts: {
    quantity?: string | null;
    unit?: string | null;
    name: string;
}): string => [parts.quantity, parts.unit, parts.name].filter(Boolean).join(" ");
