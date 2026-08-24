import { createBrowserRouter } from "react-router";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { requireAuth } from "~/auth/requireAuth";
import { AppLayout } from "~/layouts/AppLayout";
import { LoginPage } from "~/pages/LoginPage";
import { NotFoundPage } from "~/pages/NotFoundPage";
import { RecipeCreatePage } from "~/pages/RecipeCreatePage";
import { RecipeDetailPage } from "~/pages/RecipeDetailPage";
import { RecipeEditPage } from "~/pages/RecipeEditPage";
import { RecipeGridPage } from "~/pages/RecipeGridPage";
import { ShoppingListDetailPage } from "~/pages/ShoppingListDetailPage";
import { ShoppingListsPage } from "~/pages/ShoppingListsPage";

/**
 * All routing is client side. Django's catch-all in config/urls.py serves
 * index.html for any non-API path, so a deep link or a refresh on /recipes/12
 * reaches the SPA rather than a 404.
 *
 * Routes are split into two groups under the layout: public ones anybody can
 * read, and a pathless route carrying the requireAuth middleware whose children
 * are all gated. Protecting a new page means nesting it in the second group.
 *
 * No loader is needed to make the middleware run. Client middleware fires on
 * every client navigation whether or not the route has handlers; the loader
 * requirement in the docs applies to server middleware, which a library-mode
 * SPA does not have.
 */
export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        // A cold load of a guarded route has an empty query cache, so the guard
        // waits on a real /whoami round trip before anything can render.
        hydrateFallbackElement: (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
                <CircularProgress />
            </Box>
        ),
        children: [
            // Public: browsing recipes does not require an account.
            { index: true, element: <RecipeGridPage /> },
            { path: "recipes/:recipeId", element: <RecipeDetailPage /> },
            { path: "login", element: <LoginPage /> },

            // Gated: everything that writes, or that shows personal data.
            {
                middleware: [requireAuth],
                children: [
                    { path: "recipes/new", element: <RecipeCreatePage /> },
                    { path: "recipes/:recipeId/edit", element: <RecipeEditPage /> },
                    { path: "shopping-lists", element: <ShoppingListsPage /> },
                    {
                        path: "shopping-lists/:shoppingListId",
                        element: <ShoppingListDetailPage />,
                    },
                ],
            },

            { path: "*", element: <NotFoundPage /> },
        ],
    },
]);
