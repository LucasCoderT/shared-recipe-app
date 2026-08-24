import { queryOptions } from "@tanstack/react-query";
import { api } from "~/api";
import { normalizeGridFilters, type RecipeGridFilterValues } from "~/schemas";

type Id = number | string;
type GridFilters = Partial<RecipeGridFilterValues>;

/**
 * Every cache key in the app, in one place.
 *
 * Hand-written key arrays scattered across components are the usual source of
 * stale-cache bugs: a mutation invalidates ["recipe", id] while the query that
 * fetched it used ["recipes", id], and nothing refreshes. Keys are nested so a
 * broad invalidation covers the narrow ones -- invalidating keys.recipes.all
 * clears the grid, every detail, and every child collection.
 */
export const keys = {
    health: ["health"] as const,
    whoami: ["whoami"] as const,
    recipes: {
        all: ["recipes"] as const,
        grid: (filters: GridFilters = {}) => ["recipes", "grid", filters] as const,
        detail: (id: Id) => ["recipes", "detail", id] as const,
        children: (id: Id, segment: string) => ["recipes", "detail", id, segment] as const,
    },
    shoppingLists: {
        all: ["shopping-lists"] as const,
        detail: (id: Id) => ["shopping-lists", "detail", id] as const,
        items: (id: Id) => ["shopping-lists", "detail", id, "items"] as const,
    },
} as const;

/** How long the route guard will trust a cached answer. See ~/auth/requireAuth. */
export const WHOAMI_STALE_TIME = 30_000;

export const whoamiQuery = queryOptions({
    queryKey: keys.whoami,
    queryFn: () => api.whoami(),
    staleTime: WHOAMI_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
});

export const healthQuery = queryOptions({
    queryKey: keys.health,
    queryFn: () => api.health(),
    retry: false,
    refetchOnWindowFocus: false,
});

/**
 * Read queries, ready to hand straight to useQuery:
 *
 *   const { data } = useQuery(recipeQueries.detail(recipeId));
 *
 * The key and the fetcher are defined together, so they cannot drift apart.
 */
export const recipeQueries = {
    grid: (filters: GridFilters = {}) => {
        // Normalise once so the cache key and the request URL are built from
        // exactly the same object.
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
    tags: (id: Id) =>
        queryOptions({
            queryKey: keys.recipes.children(id, "tags"),
            queryFn: () => api.recipeTags.list(id),
        }),
    ingredients: (id: Id) =>
        queryOptions({
            queryKey: keys.recipes.children(id, "ingredients"),
            queryFn: () => api.recipeIngredients.list(id),
        }),
    steps: (id: Id) =>
        queryOptions({
            queryKey: keys.recipes.children(id, "steps"),
            queryFn: () => api.recipeSteps.list(id),
        }),
    photos: (id: Id) =>
        queryOptions({
            queryKey: keys.recipes.children(id, "photos"),
            queryFn: () => api.recipePhotos.list(id),
        }),
    reviews: (id: Id) =>
        queryOptions({
            queryKey: keys.recipes.children(id, "reviews"),
            queryFn: () => api.recipeReviews.list(id),
        }),
    comments: (id: Id) =>
        queryOptions({
            queryKey: keys.recipes.children(id, "comments"),
            queryFn: () => api.recipeComments.list(id),
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
