import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
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
import { recipeQueries } from "~/api/queries";
import { AddToShoppingList } from "~/components/AddToShoppingList";
import { PageShell } from "~/components/PageShell";
import { formatIngredient } from "~/formatIngredient";
import { Placeholder } from "~/components/Placeholder";
import { useCloneRecipe, useRecipeMutations } from "~/hooks/useRecipeMutations";
import { useWhoamiQuery } from "~/hooks/useWhoamiQuery";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" gutterBottom>
            {title}
        </Typography>
        {children}
    </Paper>
);

export const RecipeDetailPage = () => {
    const { recipeId = "" } = useParams();
    const navigate = useNavigate();
    const { data: whoami } = useWhoamiQuery();
    const { data: recipe, isPending, isError, error } = useQuery(recipeQueries.detail(recipeId));

    const clone = useCloneRecipe();
    const { addReview, updateReview, addComment, removeComment } = useRecipeMutations(recipeId);

    const [comment, setComment] = useState("");

    if (isPending) return <Skeleton variant="rounded" height={480} />;
    if (isError) {
        return <Alert severity="error">{errorMessage(error, "Could not load this recipe.")}</Alert>;
    }

    const isOwner = whoami?.authenticated && whoami.id === recipe.author;
    const canWrite = Boolean(whoami?.authenticated);
    const myReview = recipe.reviews.find((review) => review.user === whoami?.id);
    const ratings = recipe.reviews.map((review) => review.rating);
    const average = ratings.length
        ? ratings.reduce((total, value) => total + value, 0) / ratings.length
        : null;

    return (
        <PageShell
            title={recipe.name}
            action={
                <Stack direction="row" spacing={1}>
                    {canWrite && !isOwner && (
                        <Button
                            variant="outlined"
                            loading={clone.isPending}
                            onClick={() =>
                                clone.mutate(recipe.id, {
                                    onSuccess: (copy) => void navigate(`/recipes/${copy.id}/edit`),
                                })
                            }
                        >
                            Copy to my recipes
                        </Button>
                    )}
                    {canWrite && <AddToShoppingList recipeId={recipe.id} />}
                    {isOwner && (
                        <Button
                            component={RouterLink}
                            to={`/recipes/${recipe.id}/edit`}
                            variant="contained"
                        >
                            Edit
                        </Button>
                    )}
                </Stack>
            }
        >
            {recipe.originalRecipe && (
                <Alert severity="info" variant="outlined">
                    Copied from{" "}
                    <RouterLink to={`/recipes/${recipe.originalRecipe}`}>
                        the original recipe
                    </RouterLink>
                    .
                </Alert>
            )}

            <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                {average === null ? (
                    <Typography variant="body2" color="text.secondary">
                        Not yet rated
                    </Typography>
                ) : (
                    <>
                        <Rating value={average} precision={0.1} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">
                            {average.toFixed(1)} from {ratings.length} review
                            {ratings.length === 1 ? "" : "s"}
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
                                <ListItemText
                                    primary={formatIngredient(ingredient)}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Section>

            <Section title="Steps">
                {recipe.steps.length === 0 ? (
                    <Placeholder note="No steps yet." />
                ) : (
                    <Stack component="ol" spacing={1} sx={{ pl: 3, m: 0 }}>
                        {recipe.steps.map((step) => (
                            <Typography key={step.id} component="li">
                                {step.description}
                            </Typography>
                        ))}
                    </Stack>
                )}
            </Section>

            <Section title="Your rating">
                {!canWrite ? (
                    <Typography variant="body2" color="text.secondary">
                        Sign in to rate this recipe.
                    </Typography>
                ) : isOwner ? (
                    <Typography variant="body2" color="text.secondary">
                        You cannot review your own recipe.
                    </Typography>
                ) : (
                    <Stack spacing={1}>
                        <Rating
                            value={myReview?.rating ?? null}
                            // One review per user is a database constraint, so an
                            // existing review is updated rather than added again.
                            onChange={(_event, value) => {
                                if (!value) return;
                                if (myReview) {
                                    updateReview.mutate({ id: myReview.id, rating: value });
                                } else {
                                    addReview.mutate({ rating: value });
                                }
                            }}
                        />
                        {(addReview.isError || updateReview.isError) && (
                            <Alert severity="error">
                                {errorMessage(
                                    addReview.error ?? updateReview.error,
                                    "Could not save your rating."
                                )}
                            </Alert>
                        )}
                    </Stack>
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
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                </Typography>
                                {entry.user === whoami?.id && (
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() => removeComment.mutate(entry.id)}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </Stack>
                            <Divider sx={{ mt: 1 }} />
                        </Box>
                    ))}

                    {canWrite && (
                        <Stack
                            component="form"
                            spacing={1}
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (!comment.trim()) return;
                                addComment.mutate(
                                    { content: comment.trim() },
                                    { onSuccess: () => setComment("") }
                                );
                            }}
                        >
                            <TextField
                                label="Add a comment"
                                multiline
                                minRows={2}
                                value={comment}
                                onChange={(event) => setComment(event.target.value)}
                            />
                            <Box>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    loading={addComment.isPending}
                                    disabled={!comment.trim()}
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
