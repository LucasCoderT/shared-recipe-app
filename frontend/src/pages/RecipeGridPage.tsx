import { Link as RouterLink } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { recipeQueries } from "~/api/queries";
import { PageShell } from "~/components/PageShell";
import { RecipeCard } from "~/components/RecipeCard";
import { RecipeFilters } from "~/components/RecipeFilters";
import { useGridFilters } from "~/hooks/useGridFilters";
import { useWhoamiQuery } from "~/hooks/useWhoamiQuery";

const PAGE_SIZE = 24;

const CardSkeletons = () => (
    <>
        {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={280} />
        ))}
    </>
);

export const RecipeGridPage = () => {
    const { filters, update, clear } = useGridFilters();
    const { data: whoami } = useWhoamiQuery();

    const { data, isError, error, isPlaceholderData } = useQuery({
        ...recipeQueries.grid(filters),
        placeholderData: keepPreviousData,
    });

    const hasFilters =
        Boolean(filters.q) ||
        filters.tag.length > 0 ||
        Boolean(filters.minRating) ||
        Boolean(filters.mine);
    const pageCount = data ? Math.ceil(data.count / PAGE_SIZE) : 0;
    const currentPage = filters.page ?? 1;

    return (
        <PageShell
            title="Recipes"
            action={
                whoami?.authenticated ? (
                    <Button component={RouterLink} to="/recipes/new" variant="contained">
                        New recipe
                    </Button>
                ) : undefined
            }
        >
            <RecipeFilters
                filters={filters}
                onChange={update}
                onClear={clear}
                canFilterMine={Boolean(whoami?.authenticated)}
            />

            {isError && (
                <Alert severity="error">
                    {error instanceof Error ? error.message : "Could not load recipes."}
                </Alert>
            )}

            {!isError && (
                <Typography variant="body2" color="text.secondary">
                    {data ? `${data.count} recipe${data.count === 1 ? "" : "s"}` : "Loading…"}
                </Typography>
            )}

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "repeat(4, 1fr)",
                    },
                    opacity: isPlaceholderData ? 0.6 : 1,
                    transition: "opacity 150ms",
                }}
            >
                {data ? (
                    data.results.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
                ) : (
                    <CardSkeletons />
                )}
            </Box>

            {data?.count === 0 &&
                (hasFilters ? (
                    <Alert
                        severity="info"
                        variant="outlined"
                        action={
                            <Button color="inherit" size="small" onClick={clear}>
                                Clear filters
                            </Button>
                        }
                    >
                        No recipes match those filters.
                    </Alert>
                ) : (
                    <Alert
                        severity="info"
                        variant="outlined"
                        action={
                            whoami?.authenticated ? (
                                <Button
                                    color="inherit"
                                    size="small"
                                    component={RouterLink}
                                    to="/recipes/new"
                                >
                                    Add one
                                </Button>
                            ) : undefined
                        }
                    >
                        {whoami?.authenticated
                            ? "No recipes yet. Add the first one."
                            : "No recipes yet. Sign in to add the first one."}
                    </Alert>
                ))}

            {pageCount > 1 && (
                <Stack sx={{ alignItems: "center" }}>
                    <Pagination
                        count={pageCount}
                        page={currentPage}
                        onChange={(_event, page) => update({ page })}
                        shape="rounded"
                    />
                </Stack>
            )}
        </PageShell>
    );
};
