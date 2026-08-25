import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { ApiError } from "~/api/client";

export const StaleWriteAlert = ({ error, onReload }: { error: unknown; onReload: () => void }) => {
    if (!(error instanceof ApiError) || error.status !== 409) return null;

    return (
        <Alert
            severity="warning"
            action={
                <Button color="inherit" size="small" onClick={onReload}>
                    Reload
                </Button>
            }
        >
            This recipe was changed by someone else after you opened it. Reload to see their version
            before saving again.
        </Alert>
    );
};
