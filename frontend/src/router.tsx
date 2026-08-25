import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router";
import { requireAuth } from "~/auth/requireAuth";
import { RouteSpinner } from "~/components/RouteSpinner";
import { AppLayout } from "~/layouts/AppLayout";
import { ErrorPage } from "~/pages/ErrorPage";
import { NotFoundPage } from "~/pages/NotFoundPage";
import { RecipeGridPage } from "~/pages/RecipeGridPage";

const RecipeDetailPage = lazy(() =>
    import("~/pages/RecipeDetailPage").then((m) => ({ default: m.RecipeDetailPage }))
);
const RecipeCreatePage = lazy(() =>
    import("~/pages/RecipeCreatePage").then((m) => ({ default: m.RecipeCreatePage }))
);
const RecipeEditPage = lazy(() =>
    import("~/pages/RecipeEditPage").then((m) => ({ default: m.RecipeEditPage }))
);
const ShoppingListsPage = lazy(() =>
    import("~/pages/ShoppingListsPage").then((m) => ({ default: m.ShoppingListsPage }))
);
const ShoppingListDetailPage = lazy(() =>
    import("~/pages/ShoppingListDetailPage").then((m) => ({ default: m.ShoppingListDetailPage }))
);
const LoginPage = lazy(() =>
    import("~/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);

const withSuspense = (element: ReactNode) => <Suspense fallback={<RouteSpinner />}>{element}</Suspense>;

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        errorElement: <ErrorPage />,
        hydrateFallbackElement: <RouteSpinner />,
        children: [
            { index: true, element: <RecipeGridPage /> },
            { path: "recipes/:recipeId", element: withSuspense(<RecipeDetailPage />) },
            { path: "login", element: withSuspense(<LoginPage />) },
            {
                middleware: [requireAuth],
                children: [
                    { path: "recipes/new", element: withSuspense(<RecipeCreatePage />) },
                    { path: "recipes/:recipeId/edit", element: withSuspense(<RecipeEditPage />) },
                    { path: "shopping-lists", element: withSuspense(<ShoppingListsPage />) },
                    {
                        path: "shopping-lists/:shoppingListId",
                        element: withSuspense(<ShoppingListDetailPage />),
                    },
                ],
            },
            { path: "*", element: <NotFoundPage /> },
        ],
    },
]);
