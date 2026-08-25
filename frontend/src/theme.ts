import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    cssVariables: { colorSchemeSelector: "media" },
    colorSchemes: { light: true, dark: true },
    shape: { borderRadius: 10 },
    typography: {
        fontFamily: [
            "system-ui",
            "-apple-system",
            '"Segoe UI"',
            "sans-serif",
        ].join(","),
        h1: { fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.01em" },
    },
    components: {
        MuiButton: { defaultProps: { disableElevation: true } },
        MuiPaper: { defaultProps: { variant: "outlined" } },
        MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    },
});
