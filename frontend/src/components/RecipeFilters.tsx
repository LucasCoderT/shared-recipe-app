import { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useQuery } from "@tanstack/react-query";
import { recipeQueries } from "~/api/queries";
import { useDebouncedValue } from "~/hooks/useDebouncedValue";
import type { RecipeGridFilterValues } from "~/schemas";

const SORT_OPTIONS = [
    { value: "name", label: "Name (A–Z)" },
    { value: "-name", label: "Name (Z–A)" },
    { value: "-rating", label: "Highest rated" },
    { value: "rating", label: "Lowest rated" },
    { value: "-createdAt", label: "Newest" },
    { value: "createdAt", label: "Oldest" },
] as const;

const RATING_OPTIONS = [0, 3, 4, 4.5] as const;

export const RecipeFilters = ({
    filters,
    onChange,
    onClear,
    canFilterMine,
}: {
    filters: RecipeGridFilterValues;
    onChange: (patch: Partial<RecipeGridFilterValues>) => void;
    onClear: () => void;
    canFilterMine: boolean;
}) => {
    const { data: tagOptions = [] } = useQuery(recipeQueries.tagOptions());
    const [search, setSearch] = useState(filters.q ?? "");
    const debounced = useDebouncedValue(search);

    useEffect(() => {
        if (debounced !== (filters.q ?? "")) onChange({ q: debounced });
        // onChange identity changes with the filters, so depending on it would loop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    useEffect(() => setSearch(filters.q ?? ""), [filters.q]);

    const hasFilters =
        Boolean(filters.q) ||
        filters.tag.length > 0 ||
        Boolean(filters.minRating) ||
        Boolean(filters.mine);

    return (
        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { md: "center" } }}
        >
            <TextField
                label="Search"
                placeholder="Recipe name"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ maxWidth: { md: 260 } }}
            />

            <Autocomplete
                multiple
                freeSolo
                options={tagOptions}
                value={filters.tag}
                onChange={(_event, value) => onChange({ tag: value })}
                sx={{ minWidth: { md: 240 }, flexGrow: 1 }}
                renderInput={(params) => (
                    <TextField {...params} label="Tags" placeholder="Add a tag" />
                )}
            />

            <TextField
                select
                label="Minimum rating"
                value={filters.minRating ?? 0}
                onChange={(event) => onChange({ minRating: Number(event.target.value) })}
                sx={{ minWidth: { md: 160 } }}
            >
                {RATING_OPTIONS.map((value) => (
                    <MenuItem key={value} value={value}>
                        {value === 0 ? "Any" : `${value}+`}
                    </MenuItem>
                ))}
            </TextField>

            <TextField
                select
                label="Sort"
                value={filters.sort}
                onChange={(event) =>
                    onChange({ sort: event.target.value as RecipeGridFilterValues["sort"] })
                }
                sx={{ minWidth: { md: 180 } }}
            >
                {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </TextField>

            {canFilterMine && (
                <FormControlLabel
                    control={
                        <Switch
                            checked={Boolean(filters.mine)}
                            onChange={(event) => onChange({ mine: event.target.checked })}
                        />
                    }
                    label="Only mine"
                />
            )}

            <Button onClick={onClear} disabled={!hasFilters}>
                Clear
            </Button>
        </Stack>
    );
};
