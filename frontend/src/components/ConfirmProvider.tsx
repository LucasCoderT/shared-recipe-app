import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

type ConfirmOptions = {
    title: string;
    message: string;
    /** Label on the destructive action. Defaults to "Delete". */
    confirmLabel?: string;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * One dialog for the whole app, requested through a promise.
 *
 *   if (await confirm({ title, message })) remove.mutate(id);
 *
 * A per-button component cannot cover a Chip's delete icon or an IconButton in
 * a list row without each caller carrying its own open/close state. Handing
 * back a promise keeps the call site to a single line wherever the trigger
 * lives, and there is only ever one Dialog mounted.
 */
export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    // Held in a ref so resolving does not depend on a re-render landing first.
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

export const useConfirm = (): ConfirmFn => {
    const confirm = useContext(ConfirmContext);
    if (!confirm) {
        throw new Error("useConfirm must be used inside a ConfirmProvider");
    }
    return confirm;
};
