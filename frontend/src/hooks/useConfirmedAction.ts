import { useCallback } from "react";
import type { ConfirmOptions } from "~/confirmContext";
import { useConfirm } from "~/hooks/useConfirm";

/**
 * Builds a click handler that asks before acting.
 *
 *   onDelete={confirmed({ title, message }, () => removeTag.mutate(id))}
 *
 * The returned handler is void-returning rather than async. Handing an async
 * function straight to onClick leaves a floating promise that nothing can
 * observe, which is what no-misused-promises objects to; discarding it here
 * once keeps every call site clean.
 */
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
