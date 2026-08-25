import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { recipeQueries } from "~/api/queries";
import { useAddForm } from "~/hooks/useAddForm";
import { useConfirmedAction } from "~/hooks/useConfirmedAction";
import { useCloneRecipe, useRecipeMutations } from "~/hooks/useRecipeMutations";
import { useWhoamiQuery } from "~/hooks/useWhoamiQuery";

export const useRecipeDetail = (recipeId: string) => {
    const navigate = useNavigate();
    const confirmed = useConfirmedAction();
    const { data: whoami } = useWhoamiQuery();
    const { data: recipe, isPending, isError, error } = useQuery(recipeQueries.detail(recipeId));

    const clone = useCloneRecipe();
    const m = useRecipeMutations(recipeId);

    const isOwner = Boolean(whoami?.authenticated) && whoami?.id === recipe?.author;
    const isAdmin = Boolean(whoami?.isStaff) || Boolean(whoami?.groups?.includes("Admin"));

    const commentForm = useAddForm({
        initial: { content: "" },
        isValid: (v) => Boolean(v.content.trim()),
        onSubmit: (v) => m.addComment.mutateAsync({ content: v.content.trim() }),
    });

    const myReview = recipe?.reviews.find((review) => review.user === whoami?.id);
    const ratings = recipe?.reviews.map((review) => review.rating) ?? [];
    const average = ratings.length
        ? ratings.reduce((total, value) => total + value, 0) / ratings.length
        : null;

    return {
        recipe,
        isPending,
        isError,
        error,
        canWrite: Boolean(whoami?.authenticated),
        isOwner,
        canManage: isOwner || isAdmin,
        currentUserId: whoami?.id,
        average,
        reviewCount: ratings.length,
        myRating: myReview?.rating ?? null,
        commentForm,

        rate: (value: number | null) => {
            if (!value) return;
            if (myReview) m.updateReview.mutate({ id: myReview.id, rating: value });
            else m.addReview.mutate({ rating: value });
        },
        removeComment: (id: number) =>
            confirmed(
                {
                    title: "Delete this comment?",
                    message: "Your comment will be removed from this recipe.",
                },
                () => m.removeComment.mutate(id)
            ),
        copyToMine: () => {
            if (!recipe) return;
            clone.mutate(recipe.id, {
                onSuccess: (copy) => void navigate(`/recipes/${copy.id}/edit`),
            });
        },
        copying: clone.isPending,
        deleteRecipe: () => {
            if (!recipe) return;
            m.deleteRecipe.mutate(recipe.updatedAt, {
                onSuccess: () => void navigate("/", { replace: true }),
            });
        },
        deleting: m.deleteRecipe.isPending,
    };
};
