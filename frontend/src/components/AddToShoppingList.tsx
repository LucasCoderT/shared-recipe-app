import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { shoppingListQueries } from "~/api/queries";
import { useShoppingItemMutations } from "~/hooks/useShoppingMutations";

const CopyAction = ({
    listId,
    recipeId,
    onDone,
}: {
    listId: number;
    recipeId: number;
    onDone: () => void;
}) => {
    const { copyFromRecipe } = useShoppingItemMutations(listId);

    return (
        <Button
            variant="contained"
            loading={copyFromRecipe.isPending}
            onClick={() => copyFromRecipe.mutate(recipeId, { onSuccess: onDone })}
        >
            Add ingredients
        </Button>
    );
};

export const AddToShoppingList = ({ recipeId }: { recipeId: number }) => {
    const [open, setOpen] = useState(false);
    const [listId, setListId] = useState<number | "">("");
    const { data, isPending } = useQuery({
        ...shoppingListQueries.list(),
        enabled: open,
    });

    const lists = data ?? [];

    return (
        <>
            <Button variant="outlined" onClick={() => setOpen(true)}>
                Add to shopping list
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add ingredients to a list</DialogTitle>
                <DialogContent>
                    {!isPending && lists.length === 0 ? (
                        <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                            You have no shopping lists yet. Create one first.
                        </Alert>
                    ) : (
                        <TextField
                            select
                            label="Shopping list"
                            value={listId}
                            onChange={(event) => setListId(Number(event.target.value))}
                            sx={{ mt: 1 }}
                        >
                            {lists.map((list) => (
                                <MenuItem key={list.id} value={list.id}>
                                    {list.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    {typeof listId === "number" && (
                        <CopyAction
                            listId={listId}
                            recipeId={recipeId}
                            onDone={() => setOpen(false)}
                        />
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};
