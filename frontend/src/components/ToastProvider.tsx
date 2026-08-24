import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { toast, type Toast } from "~/toast";

/**
 * Renders one toast at a time. A queue would stack notifications over the
 * content during a burst of edits; the most recent message is the one that
 * matters, so a newer toast replaces the one on screen.
 */
export const ToastProvider = () => {
    const [current, setCurrent] = useState<Toast | null>(null);

    useEffect(() => toast.subscribe(setCurrent), []);

    return (
        <Snackbar
            // Keying on id restarts the auto-hide timer when a new toast
            // replaces one that is still showing.
            key={current?.id}
            open={Boolean(current)}
            autoHideDuration={current?.severity === "error" ? 6000 : 3000}
            onClose={(_event, reason) => {
                // Ignore click-away so a toast cannot be dismissed by accident
                // while the user is still working.
                if (reason !== "clickaway") setCurrent(null);
            }}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            <Alert
                severity={current?.severity ?? "success"}
                variant="filled"
                onClose={() => setCurrent(null)}
                sx={{ width: "100%" }}
            >
                {current?.message}
            </Alert>
        </Snackbar>
    );
};
