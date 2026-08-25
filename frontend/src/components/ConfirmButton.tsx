import Button from "@mui/material/Button";
import { useConfirmedAction } from "~/hooks/useConfirmedAction";

export const ConfirmButton = ({
    label,
    title,
    message,
    onConfirm,
    loading,
}: {
    label: string;
    title: string;
    message: string;
    onConfirm: () => void;
    loading?: boolean | undefined;
}) => {
    const confirmed = useConfirmedAction();

    return (
        <Button
            color="error"
            variant="outlined"
            loading={loading}
            onClick={confirmed({ title, message, confirmLabel: label }, onConfirm)}
        >
            {label}
        </Button>
    );
};
