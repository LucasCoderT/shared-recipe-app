import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { RouterProvider } from "react-router";
import { queryClient } from "~/queryClient";
import { router } from "~/router";
import { theme } from "~/theme";

const container = document.getElementById("root");
if (!container) {
    throw new Error("Root element #root is missing from index.html");
}

createRoot(container).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            {/* Normalises browser defaults and applies the theme background. */}
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </ThemeProvider>
    </StrictMode>
);
