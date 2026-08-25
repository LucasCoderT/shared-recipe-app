import Alert from "@mui/material/Alert";

export const Placeholder = ({ note }: { note: string }) => (
    <Alert severity="info" variant="outlined">
        {note}
    </Alert>
);
