import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";
import { PARTIAL_QUANTITY_PATTERN } from "~/schemas";

/**
 * A numeric input that still hands back a string.
 *
 * MUI has no number field of its own -- its docs compose Base UI's, which would
 * mean a second component library for one input.
 *
 * type="text" rather than "number" on purpose: with type="number" the browser
 * reports an unparseable entry as an empty string, so "abc" and "" are
 * indistinguishable and a keystroke guard cannot tell them apart. Text plus
 * inputMode="decimal" still raises the numeric keypad on mobile and leaves the
 * regex as the single authority on what may be typed.
 *
 * Keystrokes that cannot lead to a valid quantity are refused outright, so a
 * third decimal place or a letter never reaches the field. The value stays a
 * string the whole way, which is what keeps the Decimal(10,2) column off a JS
 * float.
 */
export const QuantityField = ({
    value,
    onChange,
    label = "Quantity",
    required,
    error,
    helperText,
    sx,
}: {
    value: string;
    onChange: (value: string) => void;
    label?: string | undefined;
    required?: boolean | undefined;
    error?: boolean | undefined;
    helperText?: string | undefined;
    sx?: SxProps<Theme> | undefined;
}) => (
    <TextField
        label={label}
        type="text"
        required={required}
        error={error}
        helperText={helperText}
        value={value}
        onChange={(event) => {
            const next = event.target.value;
            // Refuse the keystroke rather than accept and flag it later.
            if (PARTIAL_QUANTITY_PATTERN.test(next)) onChange(next);
        }}
        sx={sx}
        slotProps={{
            htmlInput: {
                // decimal rather than numeric: numeric hides the separator key.
                inputMode: "decimal",
                autoComplete: "off",
            },
        }}
    />
);
