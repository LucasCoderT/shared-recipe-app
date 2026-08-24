import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { errorMessage } from "~/api/errors";
import { keys, recipeQueries } from "~/api/queries";
import { ConfirmButton } from "~/components/ConfirmButton";
import { useConfirm } from "~/components/ConfirmProvider";
import { PageShell } from "~/components/PageShell";
import { QuantityField } from "~/components/QuantityField";
import { formatIngredient } from "~/formatIngredient";
import { SortableSteps } from "~/components/SortableSteps";
import { StaleWriteAlert } from "~/components/StaleWriteAlert";
import { UnitField } from "~/components/UnitField";
import { useRecipeMutations } from "~/hooks/useRecipeMutations";
import { QUANTITY_PATTERN } from "~/schemas";

const MAX_TAGS = 5;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" gutterBottom>
            {title}
        </Typography>
        {children}
    </Paper>
);

export const RecipeEditPage = () => {
    const { recipeId = "" } = useParams();
    const navigate = useNavigate();
    const client = useQueryClient();
    const { data: recipe, isPending, isError, error } = useQuery(recipeQueries.detail(recipeId));
    const m = useRecipeMutations(recipeId);
    const confirm = useConfirm();

    /** Every destructive action routes through the same prompt. */
    const confirmThen = (title: string, message: string, action: () => void) => async () => {
        if (await confirm({ title, message })) action();
    };

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [ingredient, setIngredient] = useState({ name: "", quantity: "", unit: "" });
    // "1." passes the typing guard but is not a submittable quantity.
    const quantityValid = QUANTITY_PATTERN.test(ingredient.quantity);
    const [step, setStep] = useState("");
    const [tag, setTag] = useState("");

    // Seed the form once the recipe arrives, and again after a reload.
    useEffect(() => {
        if (recipe) {
            setName(recipe.name);
            setDescription(recipe.description ?? "");
        }
    }, [recipe?.id, recipe?.updatedAt]);

    if (isPending) return <Skeleton variant="rounded" height={480} />;
    if (isError) {
        return <Alert severity="error">{errorMessage(error, "Could not load this recipe.")}</Alert>;
    }

    const reload = () => client.invalidateQueries({ queryKey: keys.recipes.detail(recipeId) });

    const saveDetails = (event: FormEvent) => {
        event.preventDefault();
        // updatedAt is the concurrency token: the server rejects the write with
        // a 409 if the row has changed since this page loaded it.
        m.updateRecipe.mutate({ name, description, updatedAt: recipe.updatedAt });
    };

    const submit = <T,>(value: T, action: () => void) => (event: FormEvent) => {
        event.preventDefault();
        if (value) action();
    };

    return (
        <PageShell
            title="Edit recipe"
            action={
                <Stack direction="row" spacing={1}>
                    <Button onClick={() => void navigate(`/recipes/${recipe.id}`)}>View</Button>
                    <ConfirmButton
                        label="Delete"
                        title="Delete this recipe?"
                        message="This removes the recipe and everything attached to it. It cannot be undone."
                        loading={m.deleteRecipe.isPending}
                        onConfirm={() =>
                            m.deleteRecipe.mutate(recipe.updatedAt, {
                                onSuccess: () => void navigate("/", { replace: true }),
                            })
                        }
                    />
                </Stack>
            }
        >
            <StaleWriteAlert error={m.updateRecipe.error} onReload={reload} />
            <StaleWriteAlert error={m.deleteRecipe.error} onReload={reload} />

            <Section title="Details">
                <Stack component="form" spacing={2} onSubmit={saveDetails}>
                    <TextField
                        label="Name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                    <TextField
                        label="Description"
                        multiline
                        minRows={3}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                    <Box>
                        <Button type="submit" variant="contained" loading={m.updateRecipe.isPending}>
                            Save details
                        </Button>
                    </Box>
                </Stack>
            </Section>

            <Section title={`Tags (${recipe.tags.length} of ${MAX_TAGS})`}>
                <Stack spacing={2}>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {recipe.tags.map((entry) => (
                            <Chip
                                key={entry.id}
                                label={entry.name}
                                onDelete={confirmThen(
                                    "Remove this tag?",
                                    `"${entry.name}" will be removed from this recipe.`,
                                    () => m.removeTag.mutate(entry.id)
                                )}
                            />
                        ))}
                        {recipe.tags.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No tags yet.
                            </Typography>
                        )}
                    </Box>

                    <Stack
                        component="form"
                        direction="row"
                        spacing={1}
                        onSubmit={submit(tag.trim(), () =>
                            m.addTag.mutate({ name: tag.trim() }, { onSuccess: () => setTag("") })
                        )}
                    >
                        <TextField
                            label="Add a tag"
                            value={tag}
                            onChange={(event) => setTag(event.target.value)}
                            disabled={recipe.tags.length >= MAX_TAGS}
                            sx={{ maxWidth: 260 }}
                        />
                        <Button
                            type="submit"
                            loading={m.addTag.isPending}
                            disabled={!tag.trim() || recipe.tags.length >= MAX_TAGS}
                        >
                            Add
                        </Button>
                    </Stack>

                    {/* The cap is enforced server-side by a signal; this mirrors it. */}
                    {recipe.tags.length >= MAX_TAGS && (
                        <Alert severity="info" variant="outlined">
                            A recipe can have at most {MAX_TAGS} tags.
                        </Alert>
                    )}
                </Stack>
            </Section>

            <Section title="Ingredients">
                <Stack spacing={2}>
                    <List dense disablePadding>
                        {recipe.ingredients.map((entry) => (
                            <ListItem
                                key={entry.id}
                                disableGutters
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        aria-label="Delete ingredient"
                                        onClick={confirmThen(
                                            "Remove this ingredient?",
                                            `"${entry.name}" will be removed from this recipe.`,
                                            () => m.removeIngredient.mutate(entry.id)
                                        )}
                                    >
                                        <DeleteOutlinedIcon fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={formatIngredient(entry)}
                                />
                            </ListItem>
                        ))}
                    </List>

                    <Stack
                        component="form"
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        onSubmit={submit(
                            ingredient.name && quantityValid,
                            () =>
                                m.addIngredient.mutate(ingredient, {
                                    onSuccess: () =>
                                        setIngredient({ name: "", quantity: "", unit: "" }),
                                })
                        )}
                    >
                        <QuantityField
                            value={ingredient.quantity}
                            onChange={(quantity) => setIngredient({ ...ingredient, quantity })}
                            error={Boolean(ingredient.quantity) && !quantityValid}
                            helperText={
                                ingredient.quantity && !quantityValid
                                    ? "Up to 2 decimal places."
                                    : undefined
                            }
                            sx={{ maxWidth: { sm: 150 } }}
                        />
                        <UnitField
                            value={ingredient.unit}
                            onChange={(unit) => setIngredient({ ...ingredient, unit })}
                            sx={{ minWidth: { sm: 170 } }}
                        />
                        <TextField
                            label="Ingredient"
                            value={ingredient.name}
                            onChange={(event) =>
                                setIngredient({ ...ingredient, name: event.target.value })
                            }
                        />
                        <Button
                            type="submit"
                            loading={m.addIngredient.isPending}
                            disabled={!ingredient.name.trim() || !quantityValid}
                        >
                            Add
                        </Button>
                    </Stack>

                </Stack>
            </Section>

            <Section title="Steps">
                <Stack spacing={2}>
                    <SortableSteps
                        steps={recipe.steps}
                        onReorder={(order) => m.reorderSteps.mutate(order)}
                        onRemove={(id, description) =>
                            void confirm({
                                title: "Remove this step?",
                                message: `"${description}" will be removed from this recipe.`,
                            }).then((ok) => {
                                if (ok) m.removeStep.mutate(id);
                            })
                        }
                    />

                    <Stack
                        component="form"
                        direction="row"
                        spacing={1}
                        onSubmit={submit(step.trim(), () =>
                            m.addStep.mutate(
                                { description: step.trim() },
                                { onSuccess: () => setStep("") }
                            )
                        )}
                    >
                        <TextField
                            label="Add a step"
                            value={step}
                            onChange={(event) => setStep(event.target.value)}
                        />
                        <Button type="submit" loading={m.addStep.isPending} disabled={!step.trim()}>
                            Add
                        </Button>
                    </Stack>
                </Stack>
            </Section>

            <Section title="Photos">
                <Stack spacing={2}>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {recipe.photos.map((photo) => (
                            <Box key={photo.id} sx={{ position: "relative" }}>
                                <Box
                                    component="img"
                                    src={photo.image}
                                    alt={photo.description ?? ""}
                                    sx={{
                                        width: 180,
                                        height: 120,
                                        objectFit: "cover",
                                        borderRadius: 1,
                                    }}
                                />
                                <IconButton
                                    size="small"
                                    aria-label="Delete photo"
                                    onClick={confirmThen(
                                        "Remove this photo?",
                                        "The photo will be removed from this recipe.",
                                        () => m.removePhoto.mutate(photo.id)
                                    )}
                                    sx={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        bgcolor: "background.paper",
                                    }}
                                >
                                    <DeleteOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>

                    <Box>
                        <Button component="label" variant="outlined" loading={m.uploadPhoto.isPending}>
                            Upload photo
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(event) => {
                                    const image = event.target.files?.[0];
                                    if (image) m.uploadPhoto.mutate({ image });
                                    event.target.value = "";
                                }}
                            />
                        </Button>
                    </Box>

                </Stack>
            </Section>
        </PageShell>
    );
};
