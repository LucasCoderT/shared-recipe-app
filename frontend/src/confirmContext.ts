import { createContext } from "react";

export type ConfirmOptions = {
    title: string;
    message: string;
    /** Label on the destructive action. Defaults to "Delete". */
    confirmLabel?: string;
};

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

/**
 * Lives apart from the provider component so the module exporting the provider
 * exports only components, which is what Fast Refresh needs to work reliably.
 */
export const ConfirmContext = createContext<ConfirmFn | null>(null);
