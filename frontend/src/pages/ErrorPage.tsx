import { Link as RouterLink, isRouteErrorResponse, useRouteError } from "react-router";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageShell } from "~/components/PageShell";

const describe = (error: unknown): string => {
    if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred.";
};

export const ErrorPage = () => {
    const error = useRouteError();

    return (
        <PageShell title="Something went wrong">
            <Alert severity="error">{describe(error)}</Alert>
            <Stack direction="row" spacing={1}>
                <Button variant="contained" component={RouterLink} to="/">
                    Back to recipes
                </Button>
                <Button onClick={() => window.location.reload()}>Reload the page</Button>
            </Stack>
            <Typography variant="body2" color="text.secondary">
                If this keeps happening, the details are in the browser console.
            </Typography>
        </PageShell>
    );
};
