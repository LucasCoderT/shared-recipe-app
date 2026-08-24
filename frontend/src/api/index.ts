import { apiFetch, toQuery } from "~/api/client";
import type { components } from "~/schema";
import { normalizeGridFilters, type RecipeGridFilterValues } from "~/schemas";

type Schemas = components["schemas"];

export type Credentials = { email: string; password: string };
export type Paginated<T> = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: T[];
};

type Id = number | string;

/**
 * Request bodies are Partial<T> of the response type. The generated types mark
 * server-owned fields readonly, but filtering those out in the type system
 * costs more readability than it buys — the zod schemas in ~/schemas are what
 * actually constrain what a form sends.
 *
 * updatedAt is the optimistic-locking token: include it to opt into the
 * concurrency check, omit it to skip. The camel-case parser maps it to the
 * updated_at the view reads.
 */
type Payload<T> = Partial<T> & { updatedAt?: string };

const send = (method: string, body?: unknown): RequestInit => ({
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

/** A top-level collection: /recipes/, /shopping-lists/. */
const rootResource = <T>(segment: string) => {
    const url = (id: Id) => `/${segment}/${id}/`;
    return {
        list: (options?: RequestInit) => apiFetch<Paginated<T>>(`/${segment}/`, options),
        retrieve: (id: Id, options?: RequestInit) => apiFetch<T>(url(id), options),
        create: (body: Payload<T>) => apiFetch<T>(`/${segment}/`, send("POST", body)),
        update: (id: Id, body: Payload<T>) => apiFetch<T>(url(id), send("PATCH", body)),
        replace: (id: Id, body: Payload<T>) => apiFetch<T>(url(id), send("PUT", body)),
        destroy: (id: Id, updatedAt?: string) =>
            apiFetch<void>(url(id), send("DELETE", updatedAt ? { updatedAt } : undefined)),
    };
};

/** A collection nested under a parent: /recipes/{id}/tags/ and friends. */
const childResource = <T>(parent: string, segment: string) => {
    const list = (parentId: Id) => `/${parent}/${parentId}/${segment}/`;
    const url = (parentId: Id, id: Id) => `${list(parentId)}${id}/`;
    return {
        list: (parentId: Id, options?: RequestInit) =>
            apiFetch<Paginated<T>>(list(parentId), options),
        retrieve: (parentId: Id, id: Id, options?: RequestInit) =>
            apiFetch<T>(url(parentId, id), options),
        create: (parentId: Id, body: Payload<T>) =>
            apiFetch<T>(list(parentId), send("POST", body)),
        update: (parentId: Id, id: Id, body: Payload<T>) =>
            apiFetch<T>(url(parentId, id), send("PATCH", body)),
        replace: (parentId: Id, id: Id, body: Payload<T>) =>
            apiFetch<T>(url(parentId, id), send("PUT", body)),
        destroy: (parentId: Id, id: Id, updatedAt?: string) =>
            apiFetch<void>(
                url(parentId, id),
                send("DELETE", updatedAt ? { updatedAt } : undefined)
            ),
    };
};

export const api = {
    health: (options?: RequestInit) => apiFetch<Schemas["Health"]>("/health/", options),
    whoami: (options?: RequestInit) => apiFetch<Schemas["WhoAmI"]>("/whoami/", options),

    auth: {
        register: (credentials: Credentials) =>
            apiFetch<Schemas["WhoAmI"]>("/auth/register/", send("POST", credentials)),
        login: (credentials: Credentials) =>
            apiFetch<Schemas["WhoAmI"]>("/auth/login/", send("POST", credentials)),
        logout: () => apiFetch<void>("/auth/logout/", send("POST")),
    },

    recipes: {
        ...rootResource<Schemas["FullRecipe"]>("recipes"),
        /** Card view: image, name, rating, three tags. Sortable and filterable. */
        grid: (filters?: Partial<RecipeGridFilterValues>, options?: RequestInit) =>
            apiFetch<Paginated<Schemas["RecipeGridCard"]>>(
                `/recipes/grid/${toQuery(normalizeGridFilters(filters))}`,
                options
            ),
        /** Copies name, tags, steps, ingredients and photos to the caller. */
        clone: (id: Id) => apiFetch<Schemas["Recipe"]>(`/recipes/${id}/clone/`, send("POST")),
    },

    recipeTags: childResource<Schemas["RecipeTag"]>("recipes", "tags"),
    recipeIngredients: {
        ...childResource<Schemas["RecipeIngredient"]>("recipes", "ingredients"),
        reorder: (recipeId: Id, order: number[]) =>
            apiFetch<Schemas["RecipeIngredient"][]>(
                `/recipes/${recipeId}/ingredients/reorder/`,
                send("POST", { order })
            ),
    },
    recipeSteps: {
        ...childResource<Schemas["RecipeStep"]>("recipes", "steps"),
        /** Send every step id exactly once, in the new order. */
        reorder: (recipeId: Id, order: number[]) =>
            apiFetch<Schemas["RecipeStep"][]>(
                `/recipes/${recipeId}/steps/reorder/`,
                send("POST", { order })
            ),
    },
    recipeStepIngredients: childResource<Schemas["RecipeStepIngredient"]>(
        "recipes",
        "step-ingredients"
    ),
    recipeReviews: childResource<Schemas["RecipeReview"]>("recipes", "reviews"),
    recipeComments: childResource<Schemas["RecipeComment"]>("recipes", "comments"),

    recipePhotos: {
        ...childResource<Schemas["RecipePhoto"]>("recipes", "photos"),
        /** An image is a file, so this goes up as multipart rather than JSON. */
        create: (recipeId: Id, image: File, description = "") => {
            const form = new FormData();
            form.append("image", image);
            form.append("description", description);
            return apiFetch<Schemas["RecipePhoto"]>(`/recipes/${recipeId}/photos/`, {
                method: "POST",
                body: form,
            });
        },
    },

    shoppingLists: {
        ...rootResource<Schemas["ShoppingList"]>("shopping-lists"),
        /** Bulk-adds every ingredient from a recipe. Returns the created items. */
        copyFromRecipe: (id: Id, recipe: number) =>
            apiFetch<Schemas["ShoppingListItem"][]>(
                `/shopping-lists/${id}/copy_from_recipe/`,
                send("POST", { recipe })
            ),
    },

    shoppingListItems: childResource<Schemas["ShoppingListItem"]>("shopping-lists", "items"),
};
