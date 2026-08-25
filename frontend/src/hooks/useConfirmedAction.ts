import { useCallback } from "react";
import type { ConfirmOptions } from "~/confirmContext";
import { useConfirm } from "~/hooks/useConfirm";

export const useConfirmedAction = () => {
    const confirm = useConfirm();

    return useCallback(
        (options: ConfirmOptions, action: () => void) => {
            const run = async () => {
                if (await confirm(options)) action();
            };
            return () => {
                void run();
            };
        },
        [confirm]
    );
};
