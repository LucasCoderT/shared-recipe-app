export type ToastSeverity = "success" | "error";
export type Toast = { id: number; message: string; severity: ToastSeverity };

type Listener = (toast: Toast) => void;

const listeners = new Set<Listener>();
let nextId = 0;

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
