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

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        hydrateFallbackElement: (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
                <CircularProgress />
            </Box>
        ),
        children: [
            { index: true, element: <RecipeGridPage /> },
            { path: "recipes/:recipeId", element: <RecipeDetailPage /> },
            { path: "login", element: <LoginPage /> },

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
