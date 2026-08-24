import { useState, type ReactNode } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

/** Destructive actions ask first. Deleting a recipe is not undoable. */
export const ConfirmButton = ({
    label,
    title,
    message,
    onConfirm,
    loading,
    children,
}: {
    label: string;
    title: string;
    message: string;
    onConfirm: () => void;
    loading?: boolean;
    children?: ReactNode;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button color="error" variant="outlined" onClick={() => setOpen(true)} loading={loading}>
                {label}
            </Button>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>{title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{message}</DialogContentText>
                    {children}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => {
                            setOpen(false);
                            onConfirm();
                        }}
                    >
                        {label}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
