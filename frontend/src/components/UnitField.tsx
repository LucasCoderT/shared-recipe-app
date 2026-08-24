import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Units the server accepts and canonicalises to themselves.
 *
 * pint's registry holds thousands of units, so offering all of them would be
 * worse than a free text box. This is the cooking-relevant subset, each one
 * checked against normalize_unit().
 *
 * Deliberately absent: "pinch" and "unit". pint reads them as SI prefixes and
 * silently stores picoinch and micronit. They validate, so nothing catches it
 * later -- keeping them out of the suggestions is the only guard the UI has.
 */
export const UNIT_SUGGESTIONS = [
    "gram",
    "kilogram",
    "milligram",
    "ounce",
    "pound",
    "milliliter",
    "liter",
    "cup",
    "tablespoon",
    "teaspoon",
    "fluid_ounce",
    "pint",
    "quart",
    "gallon",
    "count",
] as const;

/**
 * freeSolo, because the list is a convenience rather than the rule: the server
 * is still the authority and accepts anything pint knows. It just means a
 * typo like "tblsp" is now avoidable instead of costing a round trip.
 */
export const UnitField = ({
    value,
    onChange,
    sx,
}: {
    value: string;
    onChange: (value: string) => void;
    sx?: SxProps<Theme>;
}) => (
    <Autocomplete
        freeSolo
        options={UNIT_SUGGESTIONS as readonly string[]}
        value={value}
        onChange={(_event, next) => onChange(next ?? "")}
        onInputChange={(_event, next) => onChange(next)}
        sx={sx}
        renderInput={(params) => (
            <TextField {...params} label="Unit (optional)" placeholder="gram, cup" />
        )}
    />
);
