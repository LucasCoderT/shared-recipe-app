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

type Payload<T> = Partial<T> & { updatedAt?: string };

const send = (method: string, body?: unknown): RequestInit => ({
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

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

const childResource = <T>(parent: string, segment: string) => {
    const list = (parentId: Id) => `/${parent}/${parentId}/${segment}/`;
    const url = (parentId: Id, id: Id) => `${list(parentId)}${id}/`;
    return {
        list: (parentId: Id, options?: RequestInit) =>
            apiFetch<Paginated<T>>(list(parentId), options),
        retrieve: (parentId: Id, id: Id, options?: RequestInit) =>
            apiFetch<T>(url(parentId, id), options),
        create: (parentId: Id, body: Payload<T>) => apiFetch<T>(list(parentId), send("POST", body)),
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
        grid: (filters?: Partial<RecipeGridFilterValues>, options?: RequestInit) =>
            apiFetch<Paginated<Schemas["RecipeGridCard"]>>(
                `/recipes/grid/${toQuery(normalizeGridFilters(filters))}`,
                options
            ),
        clone: (id: Id) => apiFetch<Schemas["Recipe"]>(`/recipes/${id}/clone/`, send("POST")),
        tagOptions: (options?: RequestInit) => apiFetch<string[]>("/recipes/tag-options/", options),
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
        list: (options?: RequestInit) =>
            apiFetch<Schemas["ShoppingList"][]>("/shopping-lists/", options),
        copyFromRecipe: (id: Id, recipe: number) =>
            apiFetch<Schemas["ShoppingListItem"][]>(
                `/shopping-lists/${id}/copy_from_recipe/`,
                send("POST", { recipe })
            ),
    },

    shoppingListItems: {
        ...childResource<Schemas["ShoppingListItem"]>("shopping-lists", "items"),
        list: (listId: Id, options?: RequestInit) =>
            apiFetch<Schemas["ShoppingListItem"][]>(`/shopping-lists/${listId}/items/`, options),
    },
};
