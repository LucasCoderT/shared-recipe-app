import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";
import { PARTIAL_QUANTITY_PATTERN } from "~/schemas";

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
            if (PARTIAL_QUANTITY_PATTERN.test(next)) onChange(next);
        }}
        sx={sx}
        slotProps={{
            htmlInput: {
                inputMode: "decimal",
                autoComplete: "off",
            },
        }}
    />
);
