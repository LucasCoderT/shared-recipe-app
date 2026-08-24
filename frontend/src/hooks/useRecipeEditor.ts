import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { keys, recipeQueries } from "~/api/queries";
import { useAddForm } from "~/hooks/useAddForm";
import { useConfirmedAction } from "~/hooks/useConfirmedAction";
import { useRecipeMutations } from "~/hooks/useRecipeMutations";
import { QUANTITY_PATTERN } from "~/schemas";

export const MAX_TAGS = 5;

/**
 * Everything the edit screen does, so the screen itself only lays it out.
 *
 * One hook rather than five because the sections are not independent: they all
 * read the same recipe, they all invalidate the same query, and the tag form
 * needs to know how many tags exist. Splitting them would mean passing the
 * recipe back down to each one anyway.
 */
export const useRecipeEditor = (recipeId: string) => {
    const navigate = useNavigate();
    const client = useQueryClient();
    const confirmed = useConfirmedAction();
    const m = useRecipeMutations(recipeId);

    const { data: recipe, isPending, isError, error } = useQuery(recipeQueries.detail(recipeId));

    // ---- details -------------------------------------------------------
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    // Seeded when the recipe arrives and again after a reload, so an outside
    // change is picked up rather than overwritten by a stale form.
    useEffect(() => {
        if (recipe) {
            setName(recipe.name);
            setDescription(recipe.description ?? "");
        }
        // Keyed on identity and version rather than the object: depending on
        // `recipe` would reseed the form on every refetch and discard edits in
        // progress.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recipe?.id, recipe?.updatedAt]);

    const saveDetails = (event: FormEvent) => {
        event.preventDefault();
        if (!recipe) return;
        // updatedAt is the concurrency token: the server answers 409 if the row
        // moved on since this page loaded it.
        m.updateRecipe.mutate({ name, description, updatedAt: recipe.updatedAt });
    };

    const reload = useCallback(() => {
        void client.invalidateQueries({ queryKey: keys.recipes.detail(recipeId) });
    }, [client, recipeId]);

    // ---- add forms -----------------------------------------------------
    const tagForm = useAddForm({
        initial: { name: "" },
        isValid: (v) => Boolean(v.name.trim()) && (recipe?.tags.length ?? 0) < MAX_TAGS,
        onSubmit: (v) => m.addTag.mutateAsync({ name: v.name.trim() }),
    });

    const ingredientForm = useAddForm({
        initial: { name: "", quantity: "", unit: "" },
        isValid: (v) => Boolean(v.name.trim()) && QUANTITY_PATTERN.test(v.quantity),
        onSubmit: (v) =>
            m.addIngredient.mutateAsync({
                name: v.name.trim(),
                quantity: v.quantity,
                unit: v.unit.trim(),
            }),
    });

    const stepForm = useAddForm({
        initial: { description: "" },
        isValid: (v) => Boolean(v.description.trim()),
        onSubmit: (v) => m.addStep.mutateAsync({ description: v.description.trim() }),
    });

    const uploadPhoto = (file: File | undefined) => {
        if (file) m.uploadPhoto.mutate({ image: file });
    };

    // ---- destructive ---------------------------------------------------
    const removeTag = (id: number, label: string) =>
        confirmed(
            { title: "Remove this tag?", message: `"${label}" will be removed from this recipe.` },
            () => m.removeTag.mutate(id)
        );

    const removeIngredient = (id: number, label: string) =>
        confirmed(
            {
                title: "Remove this ingredient?",
                message: `"${label}" will be removed from this recipe.`,
            },
            () => m.removeIngredient.mutate(id)
        );

    const removeStep = (id: number, label: string) =>
        confirmed(
            { title: "Remove this step?", message: `"${label}" will be removed from this recipe.` },
            () => m.removeStep.mutate(id)
        )();

    const removePhoto = (id: number) =>
        confirmed(
            { title: "Remove this photo?", message: "The photo will be removed from this recipe." },
            () => m.removePhoto.mutate(id)
        );

    const deleteRecipe = () => {
        if (!recipe) return;
        m.deleteRecipe.mutate(recipe.updatedAt, {
            onSuccess: () => void navigate("/", { replace: true }),
        });
    };

    const quantityInvalid =
        Boolean(ingredientForm.values.quantity) &&
        !QUANTITY_PATTERN.test(ingredientForm.values.quantity);

    return {
        recipe,
        isPending,
        isError,
        error,
        reload,
        details: { name, setName, description, setDescription, save: saveDetails, saving: m.updateRecipe.isPending },
        staleError: { update: m.updateRecipe.error, remove: m.deleteRecipe.error },
        tagForm,
        ingredientForm,
        stepForm,
        quantityInvalid,
        tagsAtLimit: (recipe?.tags.length ?? 0) >= MAX_TAGS,
        uploadPhoto,
        uploadingPhoto: m.uploadPhoto.isPending,
        reorderSteps: (order: number[]) => m.reorderSteps.mutate(order),
        removeTag,
        removeIngredient,
        removeStep,
        removePhoto,
        deleteRecipe,
        deletingRecipe: m.deleteRecipe.isPending,
        viewRecipe: () => void navigate(`/recipes/${recipeId}`),
    };
};
