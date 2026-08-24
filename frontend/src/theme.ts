import { createTheme } from "@mui/material/styles";

/**
 * One theme for the whole app.
 *
 * `colorSchemeSelector: "media"` keeps the light/dark switch tied to the
 * operating system, which is what the app did before MUI. Using CSS variables
 * means both schemes ship in one stylesheet and switching does not re-render
 * the React tree.
 */
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
        // The app is flat by design; elevation on every button fights that.
        MuiButton: { defaultProps: { disableElevation: true } },
        MuiPaper: { defaultProps: { variant: "outlined" } },
        MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    },
});
