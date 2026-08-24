export type ToastSeverity = "success" | "error";
export type Toast = { id: number; message: string; severity: ToastSeverity };

type Listener = (toast: Toast) => void;

const listeners = new Set<Listener>();
let nextId = 0;

/**
 * A module-level emitter rather than a React context.
 *
 * The QueryClient is created outside the component tree, so its global
 * mutation handlers cannot call a hook. Publishing through a plain emitter
 * lets both the cache handlers and ordinary components raise a toast, with the
 * provider as the single subscriber that renders them.
 */
export const toast = {
    push(message: string, severity: ToastSeverity) {
        const entry: Toast = { id: (nextId += 1), message, severity };
        for (const listener of listeners) listener(entry);
    },
    success(message: string) {
        this.push(message, "success");
    },
    error(message: string) {
        this.push(message, "error");
    },
    subscribe(listener: Listener) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
};
