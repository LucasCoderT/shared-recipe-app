import { useCallback } from "react";
import { useConfirm } from "~/components/ConfirmProvider";

/**
 * Builds a click handler that asks before acting.
 *
 *   onDelete={confirmed({ title, message }, () => removeTag.mutate(id))}
 *
 * Keeps the await out of the JSX, which is the only reason these handlers were
 * inline async functions before.
 */
export const useConfirmedAction = () => {
    const confirm = useConfirm();

    return useCallback(
        (options: { title: string; message: string }, action: () => void) => async () => {
            if (await confirm(options)) action();
        },
        [confirm]
    );
};
