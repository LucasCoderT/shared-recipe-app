import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";

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
        options={UNIT_SUGGESTIONS}
        value={value}
        onChange={(_event, next) => onChange(next ?? "")}
        onInputChange={(_event, next) => onChange(next)}
        sx={sx}
        renderInput={(params) => (
            <TextField {...params} label="Unit (optional)" placeholder="gram, cup" />
        )}
    />
);
