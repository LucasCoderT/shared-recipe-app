import type { ReactNode } from "react";
import { useParams } from "react-router";
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
import { ConfirmButton } from "~/components/ConfirmButton";
import { PageShell } from "~/components/PageShell";
import { QuantityField } from "~/components/QuantityField";
import { SortableSteps } from "~/components/SortableSteps";
import { StaleWriteAlert } from "~/components/StaleWriteAlert";
import { UnitField } from "~/components/UnitField";
import { formatIngredient } from "~/formatIngredient";
import { MAX_TAGS, useRecipeEditor } from "~/hooks/useRecipeEditor";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" gutterBottom>
            {title}
        </Typography>
        {children}
    </Paper>
);

export const RecipeEditPage = () => {
    const { recipeId = "" } = useParams();
    const editor = useRecipeEditor(recipeId);
    const { recipe, details, tagForm, ingredientForm, stepForm } = editor;

    if (editor.isPending) return <Skeleton variant="rounded" height={480} />;
    if (editor.isError || !recipe) {
        return (
            <Alert severity="error">
                {errorMessage(editor.error, "Could not load this recipe.")}
            </Alert>
        );
    }

    return (
        <PageShell
            title="Edit recipe"
            action={
                <Stack direction="row" spacing={1}>
                    <Button onClick={editor.viewRecipe}>View</Button>
                    <ConfirmButton
                        label="Delete"
                        title="Delete this recipe?"
                        message="This removes the recipe and everything attached to it. It cannot be undone."
                        loading={editor.deletingRecipe}
                        onConfirm={editor.deleteRecipe}
                    />
                </Stack>
            }
        >
            <StaleWriteAlert error={editor.staleError.update} onReload={editor.reload} />
            <StaleWriteAlert error={editor.staleError.remove} onReload={editor.reload} />

            <Section title="Details">
                <Stack component="form" spacing={2} onSubmit={details.save}>
                    <TextField
                        label="Name"
                        value={details.name}
                        onChange={(event) => details.setName(event.target.value)}
                    />
                    <TextField
                        label="Description (optional)"
                        multiline
                        minRows={3}
                        value={details.description}
                        onChange={(event) => details.setDescription(event.target.value)}
                    />
                    <Box>
                        <Button type="submit" variant="contained" loading={details.saving}>
                            Save details
                        </Button>
                    </Box>
                </Stack>
            </Section>

            <Section title={`Tags (${recipe.tags.length} of ${MAX_TAGS})`}>
                <Stack spacing={2}>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {recipe.tags.map((tag) => (
                            <Chip
                                key={tag.id}
                                label={tag.name}
                                onDelete={editor.removeTag(tag.id, tag.name)}
                            />
                        ))}
                        {recipe.tags.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No tags yet.
                            </Typography>
                        )}
                    </Box>

                    <Stack component="form" direction="row" spacing={1} onSubmit={tagForm.submit}>
                        <TextField
                            label="Add a tag"
                            value={tagForm.values.name}
                            onChange={(event) => tagForm.setField("name")(event.target.value)}
                            disabled={editor.tagsAtLimit}
                            sx={{ maxWidth: 260 }}
                        />
                        <Button
                            type="submit"
                            loading={tagForm.pending}
                            disabled={!tagForm.canSubmit}
                        >
                            Add
                        </Button>
                    </Stack>

                    {editor.tagsAtLimit && (
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
                                        onClick={editor.removeIngredient(entry.id, entry.name)}
                                    >
                                        <DeleteOutlinedIcon fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={formatIngredient(entry)} />
                            </ListItem>
                        ))}
                    </List>

                    <Stack
                        component="form"
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        onSubmit={ingredientForm.submit}
                    >
                        <QuantityField
                            value={ingredientForm.values.quantity}
                            onChange={ingredientForm.setField("quantity")}
                            error={editor.quantityInvalid}
                            helperText={
                                editor.quantityInvalid ? "Up to 2 decimal places." : undefined
                            }
                            sx={{ maxWidth: { sm: 150 } }}
                        />
                        <UnitField
                            value={ingredientForm.values.unit}
                            onChange={ingredientForm.setField("unit")}
                            sx={{ minWidth: { sm: 170 } }}
                        />
                        <TextField
                            label="Ingredient"
                            value={ingredientForm.values.name}
                            onChange={(event) =>
                                ingredientForm.setField("name")(event.target.value)
                            }
                        />
                        <Button
                            type="submit"
                            loading={ingredientForm.pending}
                            disabled={!ingredientForm.canSubmit}
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
                        onReorder={editor.reorderSteps}
                        onRemove={editor.removeStep}
                    />

                    <Stack component="form" direction="row" spacing={1} onSubmit={stepForm.submit}>
                        <TextField
                            label="Add a step"
                            value={stepForm.values.description}
                            onChange={(event) =>
                                stepForm.setField("description")(event.target.value)
                            }
                        />
                        <Button
                            type="submit"
                            loading={stepForm.pending}
                            disabled={!stepForm.canSubmit}
                        >
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
                                    onClick={editor.removePhoto(photo.id)}
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
                        <Button
                            component="label"
                            variant="outlined"
                            loading={editor.uploadingPhoto}
                        >
                            Upload photo
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(event) => {
                                    editor.uploadPhoto(event.target.files?.[0]);
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
