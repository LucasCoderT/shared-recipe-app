import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import {
    normalizeGridFilters,
    recipeGridSortValues,
    type RecipeGridFilterValues,
} from "~/schemas";

type Sort = RecipeGridFilterValues["sort"];

const isSort = (value: string): value is Sort =>
    (recipeGridSortValues as readonly string[]).includes(value);

/**
 * Grid filters live in the URL rather than component state.
 *
 * That makes a filtered grid shareable, survives a refresh, and gives the back
 * button the behaviour people expect. It also means the React Query cache key
 * is derived from the URL, so returning to a previous filter is a cache hit.
 */
export const useGridFilters = () => {
    const [params, setParams] = useSearchParams();

    const filters = useMemo(() => {
        // Keys are omitted rather than set to undefined: exactOptionalPropertyTypes
        // is on, and it draws a real distinction between "absent" and "undefined".
        const raw: Partial<RecipeGridFilterValues> = {};

        const q = params.get("q");
        if (q) raw.q = q;

        const tags = params.getAll("tag");
        if (tags.length > 0) raw.tag = tags;

        const minRating = Number(params.get("minRating"));
        if (minRating > 0) raw.minRating = minRating;

        const sort = params.get("sort");
        if (sort && isSort(sort)) raw.sort = sort;

        const page = Number(params.get("page"));
        if (page > 1) raw.page = page;

        return normalizeGridFilters(raw);
    }, [params]);

    const update = useCallback(
        (patch: Partial<RecipeGridFilterValues>) => {
            const next = new URLSearchParams();
            const merged = { ...filters, ...patch };

            // Any change to the filters themselves returns to page one.
            // Narrowing a search while on page 3 would otherwise ask for a page
            // that no longer exists, and DRF answers that with a 404.
            const page = "page" in patch ? patch.page : 1;

            if (merged.q) next.set("q", merged.q);
            if (merged.minRating) next.set("minRating", String(merged.minRating));
            if (merged.sort && merged.sort !== "name") next.set("sort", merged.sort);
            for (const tag of merged.tag ?? []) next.append("tag", tag);
            if (page && page > 1) next.set("page", String(page));

            setParams(next, { replace: true });
        },
        [filters, setParams]
    );

    const clear = useCallback(() => setParams(new URLSearchParams()), [setParams]);

    return { filters, update, clear };
};
