import { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
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
}: {
    filters: RecipeGridFilterValues;
    onChange: (patch: Partial<RecipeGridFilterValues>) => void;
    onClear: () => void;
}) => {
    const [search, setSearch] = useState(filters.q ?? "");
    const debounced = useDebouncedValue(search);

    useEffect(() => {
        if (debounced !== (filters.q ?? "")) onChange({ q: debounced });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    useEffect(() => setSearch(filters.q ?? ""), [filters.q]);

    const hasFilters =
        Boolean(filters.q) || filters.tag.length > 0 || Boolean(filters.minRating);

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
                options={[] as string[]}
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

            <Button onClick={onClear} disabled={!hasFilters}>
                Clear
            </Button>
        </Stack>
    );
};
