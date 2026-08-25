import { queryOptions } from "@tanstack/react-query";
import { api } from "~/api";
import { normalizeGridFilters, type RecipeGridFilterValues } from "~/schemas";

type Id = number | string;
type GridFilters = Partial<RecipeGridFilterValues>;

export const keys = {
    whoami: ["whoami"] as const,
    recipes: {
        all: ["recipes"] as const,
        grid: (filters: GridFilters = {}) => ["recipes", "grid", filters] as const,
        detail: (id: Id) => ["recipes", "detail", id] as const,
    },
    shoppingLists: {
        all: ["shopping-lists"] as const,
        detail: (id: Id) => ["shopping-lists", "detail", id] as const,
        items: (id: Id) => ["shopping-lists", "detail", id, "items"] as const,
    },
} as const;

export const WHOAMI_STALE_TIME = 30_000;

export const whoamiQuery = queryOptions({
    queryKey: keys.whoami,
    queryFn: () => api.whoami(),
    staleTime: WHOAMI_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
});

export const recipeQueries = {
    grid: (filters: GridFilters = {}) => {
        const normalized = normalizeGridFilters(filters);
        return queryOptions({
            queryKey: keys.recipes.grid(normalized),
            queryFn: () => api.recipes.grid(normalized),
        });
    },
    detail: (id: Id) =>
        queryOptions({
            queryKey: keys.recipes.detail(id),
            queryFn: () => api.recipes.retrieve(id),
        }),
    tagOptions: () =>
        queryOptions({
            queryKey: [...keys.recipes.all, "tag-options"],
            queryFn: () => api.recipes.tagOptions(),
            staleTime: 5 * 60_000,
        }),
};

export const shoppingListQueries = {
    list: () =>
        queryOptions({
            queryKey: keys.shoppingLists.all,
            queryFn: () => api.shoppingLists.list(),
        }),
    detail: (id: Id) =>
        queryOptions({
            queryKey: keys.shoppingLists.detail(id),
            queryFn: () => api.shoppingLists.retrieve(id),
        }),
    items: (id: Id) =>
        queryOptions({
            queryKey: keys.shoppingLists.items(id),
            queryFn: () => api.shoppingListItems.list(id),
        }),
};
