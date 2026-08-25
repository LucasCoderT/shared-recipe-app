import type { ReactNode } from "react";
import { Link as RouterLink, useParams } from "react-router";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Rating from "@mui/material/Rating";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { errorMessage } from "~/api/errors";
import { AddToShoppingList } from "~/components/AddToShoppingList";
import { ConfirmButton } from "~/components/ConfirmButton";
import { PageShell } from "~/components/PageShell";
import { Placeholder } from "~/components/Placeholder";
import { formatIngredient } from "~/formatIngredient";
import { useRecipeDetail } from "~/hooks/useRecipeDetail";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" gutterBottom>
            {title}
        </Typography>
        {children}
    </Paper>
);

export const RecipeDetailPage = () => {
    const { recipeId = "" } = useParams();
    const detail = useRecipeDetail(recipeId);
    const { recipe, commentForm } = detail;

    if (detail.isPending) return <Skeleton variant="rounded" height={480} />;
    if (detail.isError || !recipe) {
        return (
            <Alert severity="error">
                {errorMessage(detail.error, "Could not load this recipe.")}
            </Alert>
        );
    }

    return (
        <PageShell
            title={recipe.name}
            action={
                <Stack direction="row" spacing={1}>
                    {detail.canWrite && !detail.isOwner && (
                        <Button
                            variant="outlined"
                            loading={detail.copying}
                            onClick={detail.copyToMine}
                        >
                            Copy to my recipes
                        </Button>
                    )}
                    {detail.canWrite && <AddToShoppingList recipeId={recipe.id} />}
                    {detail.canManage && (
                        <Button
                            component={RouterLink}
                            to={`/recipes/${recipe.id}/edit`}
                            variant="contained"
                        >
                            Edit
                        </Button>
                    )}
                    {detail.canManage && (
                        <ConfirmButton
                            label="Delete"
                            title="Delete this recipe?"
                            message={
                                detail.isOwner
                                    ? "This removes the recipe and everything attached to it. It cannot be undone."
                                    : "You are deleting someone else's recipe as an admin. This cannot be undone."
                            }
                            loading={detail.deleting}
                            onConfirm={detail.deleteRecipe}
                        />
                    )}
                </Stack>
            }
        >
            {(recipe.originalRecipe || recipe.originalAuthorName) && (
                <Alert severity="info" variant="outlined">
                    {recipe.originalRecipe ? (
                        <>
                            Copied from{" "}
                            <Link component={RouterLink} to={`/recipes/${recipe.originalRecipe}`}>
                                {recipe.originalRecipeName ?? "the original recipe"}
                            </Link>
                        </>
                    ) : (
                        "Copied from a recipe that has since been deleted"
                    )}
                    {recipe.originalAuthorName && <> by {recipe.originalAuthorName}</>}.
                </Alert>
            )}

            <Typography variant="body2" color="text.secondary">
                by {recipe.authorName}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                {detail.average === null ? (
                    <Typography variant="body2" color="text.secondary">
                        Not yet rated
                    </Typography>
                ) : (
                    <>
                        <Rating value={detail.average} precision={0.1} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">
                            {detail.average.toFixed(1)} from {detail.reviewCount} review
                            {detail.reviewCount === 1 ? "" : "s"}
                        </Typography>
                    </>
                )}
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {recipe.tags.map((tag) => (
                        <Chip key={tag.id} size="small" variant="outlined" label={tag.name} />
                    ))}
                </Box>
            </Stack>

            {recipe.description && <Typography>{recipe.description}</Typography>}

            {recipe.photos.length > 0 && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {recipe.photos.map((photo) => (
                        <Box
                            key={photo.id}
                            component="img"
                            src={photo.image}
                            alt={photo.description ?? ""}
                            sx={{ width: 220, height: 150, objectFit: "cover", borderRadius: 1 }}
                        />
                    ))}
                </Box>
            )}

            <Section title="Ingredients">
                {recipe.ingredients.length === 0 ? (
                    <Placeholder note="No ingredients yet." />
                ) : (
                    <List dense disablePadding>
                        {recipe.ingredients.map((ingredient) => (
                            <ListItem key={ingredient.id} disableGutters>
                                <ListItemText primary={formatIngredient(ingredient)} />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Section>

            <Section title="Steps">
                {recipe.steps.length === 0 ? (
                    <Placeholder note="No steps yet." />
                ) : (
                    <Stack component="ol" spacing={2} sx={{ pl: 3, m: 0 }}>
                        {recipe.steps.map((step) => (
                            <Box key={step.id} component="li">
                                <Typography>{step.description}</Typography>
                                {step.ingredientIds.length > 0 && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 0.5,
                                            flexWrap: "wrap",
                                            mt: 0.5,
                                        }}
                                    >
                                        {step.ingredientIds.map((id) => {
                                            const used = detail.ingredientsById.get(id);
                                            return used ? (
                                                <Chip
                                                    key={id}
                                                    size="small"
                                                    variant="outlined"
                                                    label={formatIngredient(used)}
                                                />
                                            ) : null;
                                        })}
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Stack>
                )}
            </Section>

            <Section title="Your rating">
                {!detail.canWrite ? (
                    <Typography variant="body2" color="text.secondary">
                        Sign in to rate this recipe.
                    </Typography>
                ) : detail.isOwner ? (
                    <Typography variant="body2" color="text.secondary">
                        You cannot review your own recipe.
                    </Typography>
                ) : (
                    <Rating
                        value={detail.myRating}
                        onChange={(_event, value) => detail.rate(value)}
                    />
                )}
            </Section>

            <Section title={`Comments (${recipe.comments.length})`}>
                <Stack spacing={2}>
                    {recipe.comments.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                            No comments yet.
                        </Typography>
                    )}

                    {recipe.comments.map((entry) => (
                        <Box key={entry.id}>
                            <Typography variant="body2">{entry.content}</Typography>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                    {entry.userName} &middot;{" "}
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                </Typography>
                                {entry.user === detail.currentUserId && (
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={detail.removeComment(entry.id)}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </Stack>
                            <Divider sx={{ mt: 1 }} />
                        </Box>
                    ))}

                    {detail.canWrite && (
                        <Stack component="form" spacing={1} onSubmit={commentForm.submit}>
                            <TextField
                                label="Add a comment"
                                multiline
                                minRows={2}
                                value={commentForm.values.content}
                                onChange={(event) =>
                                    commentForm.setField("content")(event.target.value)
                                }
                            />
                            <Box>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    loading={commentForm.pending}
                                    disabled={!commentForm.canSubmit}
                                >
                                    Post comment
                                </Button>
                            </Box>
                        </Stack>
                    )}
                </Stack>
            </Section>
        </PageShell>
    );
};
