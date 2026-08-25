import { useCallback, useRef, useState, type ReactNode } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from "~/confirmContext";

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((confirmed: boolean) => void) | null>(null);

    const confirm = useCallback<ConfirmFn>((next) => {
        setOptions(next);
        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const close = (confirmed: boolean) => {
        resolver.current?.(confirmed);
        resolver.current = null;
        setOptions(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Dialog open={Boolean(options)} onClose={() => close(false)}>
                <DialogTitle>{options?.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{options?.message}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => close(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={() => close(true)} autoFocus>
                        {options?.confirmLabel ?? "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </ConfirmContext.Provider>
    );
};
