import Alert from "@mui/material/Alert";

/** Temporary marker so an unbuilt route is obvious in the browser. */
export const Placeholder = ({ note }: { note: string }) => (
    <Alert severity="info" variant="outlined">
        {note}
    </Alert>
);
