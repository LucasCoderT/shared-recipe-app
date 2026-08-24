import Button from "@mui/material/Button";
import { useConfirm } from "~/components/ConfirmProvider";

/** A destructive button that asks first. Thin wrapper over useConfirm. */
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
    const confirm = useConfirm();

    return (
        <Button
            color="error"
            variant="outlined"
            loading={loading}
            onClick={async () => {
                if (await confirm({ title, message, confirmLabel: label })) onConfirm();
            }}
        >
            {label}
        </Button>
    );
};
