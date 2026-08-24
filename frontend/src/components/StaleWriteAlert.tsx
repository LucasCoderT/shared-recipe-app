import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { ApiError } from "~/api/client";

/**
 * 409 means someone else saved this row after it was loaded here. The only safe
 * move is to re-read it: overwriting would silently discard their edit.
 */
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
            This recipe was changed by someone else after you opened it. Reload to see
            their version before saving again.
        </Alert>
    );
};
