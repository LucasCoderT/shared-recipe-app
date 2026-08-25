import { useCallback, useRef, useState, type FormEvent } from "react";

type Fields = Record<string, string>;

export const useAddForm = <T extends Fields>({
    initial,
    onSubmit,
    isValid,
}: {
    initial: T;
    onSubmit: (values: T) => Promise<unknown>;
    isValid?: (values: T) => boolean;
}) => {
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
        const succeeded = await onSubmit(values).then(
            () => true,
            () => false
        );
        if (succeeded) reset();
        setPending(false);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!canSubmit) return;
        void run();
    };

    return { values, setField, canSubmit, pending, submit, reset };
};
