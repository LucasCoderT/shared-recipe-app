import { useState, type FormEvent } from "react";
import { Link as RouterLink } from "react-router";
import { useQuery } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { errorMessage } from "~/api/errors";
import { shoppingListQueries } from "~/api/queries";
import { PageShell } from "~/components/PageShell";
import { useShoppingListMutations } from "~/hooks/useShoppingMutations";

export const ShoppingListsPage = () => {
    const { data, isPending, isError, error } = useQuery(shoppingListQueries.list());
    const { create } = useShoppingListMutations();
    const [name, setName] = useState("");

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!name.trim()) return;
        create.mutate({ name: name.trim() }, { onSuccess: () => setName("") });
    };

    return (
        <PageShell title="Shopping lists">
            <Paper sx={{ p: 2.5, maxWidth: 520 }}>
                <Stack component="form" direction="row" spacing={1} onSubmit={submit}>
                    <TextField
                        label="New list"
                        placeholder="Weekly shop"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        loading={create.isPending}
                        disabled={!name.trim()}
                    >
                        Create
                    </Button>
                </Stack>
                {create.isError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {errorMessage(create.error, "Could not create that list.")}
                    </Alert>
                )}
            </Paper>

            {isError && (
                <Alert severity="error">
                    {errorMessage(error, "Could not load your shopping lists.")}
                </Alert>
            )}

            {isPending || !data ? (
                <Skeleton variant="rounded" height={200} />
            ) : data.results.length === 0 ? (
                <Alert severity="info" variant="outlined">
                    You have no shopping lists yet. Create one above, then add items directly or
                    copy the ingredients from a recipe.
                </Alert>
            ) : (
                <Paper>
                    <List disablePadding>
                        {data.results.map((list) => (
                            <ListItemButton
                                key={list.id}
                                component={RouterLink}
                                to={`/shopping-lists/${list.id}`}
                            >
                                <ListItemText
                                    primary={list.name}
                                    secondary={`Created ${new Date(list.createdAt).toLocaleDateString()}`}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </Paper>
            )}

            <Box>
                <Typography variant="body2" color="text.secondary">
                    Lists are private to your account.
                </Typography>
            </Box>
        </PageShell>
    );
};
