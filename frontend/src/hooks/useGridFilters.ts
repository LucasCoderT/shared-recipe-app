import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { normalizeGridFilters, recipeGridSortValues, type RecipeGridFilterValues } from "~/schemas";

type Sort = RecipeGridFilterValues["sort"];

const isSort = (value: string): value is Sort =>
    (recipeGridSortValues as readonly string[]).includes(value);

export const useGridFilters = () => {
    const [params, setParams] = useSearchParams();

    const filters = useMemo(() => {
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

        if (params.get("mine") === "true") raw.mine = true;

        return normalizeGridFilters(raw);
    }, [params]);

    const update = useCallback(
        (patch: Partial<RecipeGridFilterValues>) => {
            const next = new URLSearchParams();
            const merged = { ...filters, ...patch };

            const page = "page" in patch ? patch.page : 1;

            if (merged.q) next.set("q", merged.q);
            if (merged.minRating) next.set("minRating", String(merged.minRating));
            if (merged.sort && merged.sort !== "name") next.set("sort", merged.sort);
            for (const tag of merged.tag ?? []) next.append("tag", tag);
            if (page && page > 1) next.set("page", String(page));
            if (merged.mine) next.set("mine", "true");

            setParams(next, { replace: true });
        },
        [filters, setParams]
    );

    const clear = useCallback(() => setParams(new URLSearchParams()), [setParams]);

    return { filters, update, clear };
};
