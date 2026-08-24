import { useContext } from "react";
import { ConfirmContext, type ConfirmFn } from "~/confirmContext";

export const useConfirm = (): ConfirmFn => {
    const confirm = useContext(ConfirmContext);
    if (!confirm) {
        throw new Error("useConfirm must be used inside a ConfirmProvider");
    }
    return confirm;
};
