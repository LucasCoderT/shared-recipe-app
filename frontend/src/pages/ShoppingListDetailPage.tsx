import { useParams } from "react-router";
import Alert from "@mui/material/Alert";
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
import { ConfirmButton } from "~/components/ConfirmButton";
import { PageShell } from "~/components/PageShell";
import { QuantityField } from "~/components/QuantityField";
import { UnitField } from "~/components/UnitField";
import { formatIngredient } from "~/formatIngredient";
import { useShoppingListEditor } from "~/hooks/useShoppingListEditor";

export const ShoppingListDetailPage = () => {
    const { shoppingListId = "" } = useParams();
    const editor = useShoppingListEditor(shoppingListId);
    const { itemForm, rows } = editor;

    if (editor.isPending) return <Skeleton variant="rounded" height={400} />;
    if (editor.isError || !editor.list) {
        return (
            <Alert severity="error">
                {errorMessage(editor.error, "Could not load this list.")}
            </Alert>
        );
    }

    return (
        <PageShell
            title={editor.list.name}
            action={
                <ConfirmButton
                    label="Delete list"
                    title="Delete this list?"
                    message="This removes the list and every item on it."
                    loading={editor.deletingList}
                    onConfirm={editor.deleteList}
                />
            }
        >
            <Typography variant="body2" color="text.secondary">
                {rows.length} item{rows.length === 1 ? "" : "s"}, {editor.outstanding} still to buy
            </Typography>

            <Paper sx={{ p: 2.5 }}>
                <Stack
                    component="form"
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    onSubmit={itemForm.submit}
                >
                    <QuantityField
                        label="Quantity (optional)"
                        value={itemForm.values.quantity}
                        onChange={itemForm.setField("quantity")}
                        error={editor.quantityInvalid}
                        helperText={editor.quantityInvalid ? "Up to 2 decimal places." : undefined}
                        sx={{ minWidth: { sm: 170 } }}
                    />
                    <UnitField
                        value={itemForm.values.unit}
                        onChange={itemForm.setField("unit")}
                        sx={{ minWidth: { sm: 170 } }}
                    />
                    <TextField
                        label="Item"
                        value={itemForm.values.name}
                        onChange={(event) => itemForm.setField("name")(event.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        loading={itemForm.pending}
                        disabled={!itemForm.canSubmit}
                    >
                        Add
                    </Button>
                </Stack>
            </Paper>

            {editor.rowsPending ? (
                <Skeleton variant="rounded" height={200} />
            ) : rows.length === 0 ? (
                <Alert severity="info" variant="outlined">
                    Nothing on this list yet. Add an item above, or open a recipe and use &ldquo;Add
                    to shopping list&rdquo;.
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
                                        onClick={editor.removeItem(row.id, row.name)}
                                    >
                                        <DeleteOutlinedIcon fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <Checkbox
                                    checked={Boolean(row.purchased)}
                                    onChange={(event) =>
                                        editor.togglePurchased(row.id, event.target.checked)
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
        </PageShell>
    );
};
