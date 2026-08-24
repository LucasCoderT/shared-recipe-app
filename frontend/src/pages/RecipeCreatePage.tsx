import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { applyServerErrors } from "~/api/errors";
import { PageShell } from "~/components/PageShell";
import { useCreateRecipe } from "~/hooks/useRecipeMutations";
import { recipeSchema, type RecipeInput, type RecipeValues } from "~/schemas";

/**
 * Creates the recipe itself, then hands off to the edit screen.
 *
 * Ingredients, steps, tags and photos are separate resources with their own
 * URLs and permissions, so they cannot be posted until the recipe they belong
 * to has an id. Splitting it this way keeps each request to one resource rather
 * than inventing a bulk endpoint the API does not have.
 */
export const RecipeCreatePage = () => {
    const navigate = useNavigate();
    const createRecipe = useCreateRecipe();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
        // Three generics because the schema transforms: description is
        // optional on input and always a string on output.
    } = useForm<RecipeInput, unknown, RecipeValues>({
        resolver: zodResolver(recipeSchema),
        defaultValues: { name: "", description: "" },
        mode: "onTouched",
    });

    const onSubmit = handleSubmit(async (values) => {
        try {
            const recipe = await createRecipe.mutateAsync(values);
            await navigate(`/recipes/${recipe.id}/edit`, { replace: true });
        } catch (error) {
            applyServerErrors(error, setError, ["name", "description"]);
        }
    });

    return (
        <PageShell title="New recipe">
            <Paper sx={{ p: 2.5, maxWidth: 640 }}>
                <Stack
                    component="form"
                    spacing={2}
                    onSubmit={(event) => void onSubmit(event)}
                    noValidate
                >
                    <TextField
                        label="Name"
                        error={Boolean(errors.name)}
                        helperText={errors.name?.message}
                        {...register("name")}
                    />
                    <TextField
                        label="Description (optional)"
                        multiline
                        minRows={3}
                        error={Boolean(errors.description)}
                        helperText={errors.description?.message}
                        {...register("description")}
                    />
                    <Alert severity="info" variant="outlined">
                        Ingredients, steps, tags and photos are added on the next screen.
                    </Alert>
                    <Box>
                        <Button type="submit" variant="contained" loading={isSubmitting}>
                            Create recipe
                        </Button>
                    </Box>
                </Stack>
            </Paper>
        </PageShell>
    );
};
