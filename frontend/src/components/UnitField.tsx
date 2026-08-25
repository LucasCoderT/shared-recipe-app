import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";

// Mirrors UNITS in core/utils/units.py; the server rejects anything else.
export const UNIT_OPTIONS = [
    "gram",
    "kilogram",
    "milligram",
    "ounce",
    "pound",
    "milliliter",
    "liter",
    "teaspoon",
    "tablespoon",
    "fluid ounce",
    "cup",
    "pint",
    "quart",
    "gallon",
    "pinch",
    "dash",
    "count",
    "clove",
    "slice",
    "can",
    "bunch",
    "package",
] as const;

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
        options={UNIT_OPTIONS}
        value={value || null}
        onChange={(_event, next) => onChange(next ?? "")}
        sx={sx}
        renderInput={(params) => <TextField {...params} label="Unit (optional)" />}
    />
);
