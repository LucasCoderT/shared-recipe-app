import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
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
import { shoppingListQueries } from "~/api/queries";
import { ConfirmButton } from "~/components/ConfirmButton";
import { useConfirm } from "~/components/ConfirmProvider";
import { PageShell } from "~/components/PageShell";
import { QuantityField } from "~/components/QuantityField";
import { formatIngredient } from "~/formatIngredient";
import { UnitField } from "~/components/UnitField";
import { useShoppingItemMutations, useShoppingListMutations } from "~/hooks/useShoppingMutations";
import { QUANTITY_PATTERN } from "~/schemas";

export const ShoppingListDetailPage = () => {
    const { shoppingListId = "" } = useParams();
    const navigate = useNavigate();

    const list = useQuery(shoppingListQueries.detail(shoppingListId));
    const items = useQuery(shoppingListQueries.items(shoppingListId));
    const { add, toggle, remove } = useShoppingItemMutations(shoppingListId);
    const { remove: removeList } = useShoppingListMutations();

    const [entry, setEntry] = useState({ name: "", quantity: "", unit: "" });
    const confirm = useConfirm();
    // Blank is allowed here; anything else has to be a well formed decimal.
    const quantityValid = !entry.quantity || QUANTITY_PATTERN.test(entry.quantity);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!entry.name.trim() || !quantityValid) return;
        add.mutate(
            {
                name: entry.name.trim(),
                unit: entry.unit.trim(),
                // Quantity is optional here: "milk" with no amount is a
                // legitimate shopping list entry.
                ...(entry.quantity.trim() ? { quantity: entry.quantity.trim() } : {}),
            },
            { onSuccess: () => setEntry({ name: "", quantity: "", unit: "" }) }
        );
    };

    if (list.isPending) return <Skeleton variant="rounded" height={400} />;
    if (list.isError) {
        return <Alert severity="error">{errorMessage(list.error, "Could not load this list.")}</Alert>;
    }

    const rows = items.data?.results ?? [];
    const outstanding = rows.filter((row) => !row.purchased).length;

    return (
        <PageShell
            title={list.data.name}
            action={
                <ConfirmButton
                    label="Delete list"
                    title="Delete this list?"
                    message="This removes the list and every item on it."
                    loading={removeList.isPending}
                    onConfirm={() =>
                        removeList.mutate(list.data.id, {
                            onSuccess: () => void navigate("/shopping-lists", { replace: true }),
                        })
                    }
                />
            }
        >
            <Typography variant="body2" color="text.secondary">
                {rows.length} item{rows.length === 1 ? "" : "s"}, {outstanding} still to buy
            </Typography>

            <Paper sx={{ p: 2.5 }}>
                <Stack
                    component="form"
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    onSubmit={submit}
                >
                    <QuantityField
                        label="Quantity (optional)"
                        value={entry.quantity}
                        onChange={(quantity) => setEntry({ ...entry, quantity })}
                        error={Boolean(entry.quantity) && !quantityValid}
                        helperText={
                            entry.quantity && !quantityValid ? "Up to 2 decimal places." : undefined
                        }
                        sx={{ minWidth: { sm: 170 } }}
                    />
                    <UnitField
                        value={entry.unit}
                        onChange={(unit) => setEntry({ ...entry, unit })}
                        sx={{ minWidth: { sm: 170 } }}
                    />
                    <TextField
                        label="Item"
                        value={entry.name}
                        onChange={(event) => setEntry({ ...entry, name: event.target.value })}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        loading={add.isPending}
                        disabled={!entry.name.trim() || !quantityValid}
                    >
                        Add
                    </Button>
                </Stack>
                {add.isError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {errorMessage(add.error, "Could not add that item.")}
                    </Alert>
                )}
            </Paper>

            {items.isPending ? (
                <Skeleton variant="rounded" height={200} />
            ) : rows.length === 0 ? (
                <Alert severity="info" variant="outlined">
                    Nothing on this list yet. Add an item above, or open a recipe and use
                    &ldquo;Add to shopping list&rdquo;.
                </Alert>
            ) : (
                <Paper>
                    <List disablePadding>
                        {rows.map((row) => (
                            <ListItem
                                key={row.id}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        aria-label="Delete item"
                                        onClick={async () => {
                                            const ok = await confirm({
                                                title: "Remove this item?",
                                                message: `"${row.name}" will be removed from this list.`,
                                            });
                                            if (ok) remove.mutate(row.id);
                                        }}
                                    >
                                        <DeleteOutlinedIcon fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <Checkbox
                                    checked={Boolean(row.purchased)}
                                    onChange={(event) =>
                                        toggle.mutate({
                                            id: row.id,
                                            purchased: event.target.checked,
                                        })
                                    }
                                />
                                <ListItemText
                                    primary={formatIngredient(row)}
                                    sx={{
                                        textDecoration: row.purchased ? "line-through" : "none",
                                        color: row.purchased ? "text.disabled" : "inherit",
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            <Box />
        </PageShell>
    );
};
