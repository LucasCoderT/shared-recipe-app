import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { toast, type Toast } from "~/toast";

export const ToastProvider = () => {
    const [current, setCurrent] = useState<Toast | null>(null);

    useEffect(() => toast.subscribe(setCurrent), []);

    return (
        <Snackbar
            key={current?.id}
            open={Boolean(current)}
            autoHideDuration={current?.severity === "error" ? 6000 : 3000}
            onClose={(_event, reason) => {
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
