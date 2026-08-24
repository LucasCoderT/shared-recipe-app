import { useCallback, useRef, useState, type FormEvent } from "react";

type Fields = Record<string, string>;

/**
 * The "small form that adds a thing and clears itself" pattern.
 *
 * Tags, ingredients, steps, shopping list items and new lists are all this
 * shape: hold a few strings, decide whether they are submittable, send them,
 * then reset. Without this each one grows its own useState, its own preventDefault
 * and its own onSuccess reset inside the JSX.
 *
 * Errors are deliberately swallowed. Every mutation already reports failures
 * through the toast layer in ~/queryClient, so catching here only stops an
 * unhandled rejection -- and importantly leaves the typed values in place so
 * the user can correct and retry rather than losing their input.
 */
export const useAddForm = <T extends Fields>({
    initial,
    onSubmit,
    isValid,
}: {
    initial: T;
    onSubmit: (values: T) => Promise<unknown>;
    isValid?: (values: T) => boolean;
}) => {
    // Held in a ref so an inline object literal for `initial` does not make
    // reset depend on render identity.
    const blank = useRef(initial);
    const [values, setValues] = useState<T>(initial);
    const [pending, setPending] = useState(false);

    const setField = useCallback(
        (field: keyof T) => (value: string) =>
            setValues((current) => ({ ...current, [field]: value })),
        []
    );

    const reset = useCallback(() => setValues(blank.current), []);

    const canSubmit = !pending && (isValid ? isValid(values) : true);

    const run = async () => {
        setPending(true);
        try {
            await onSubmit(values);
            reset();
        } catch {
            // Reported by the mutation cache; values stay for a retry.
        } finally {
            setPending(false);
        }
    };

    /**
     * Void-returning rather than async: an async handler on onSubmit leaves a
     * floating promise nothing can observe. preventDefault still runs
     * synchronously, because run() only suspends at its first await.
     */
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!canSubmit) return;
        void run();
    };

    return { values, setField, canSubmit, pending, submit, reset };
};
