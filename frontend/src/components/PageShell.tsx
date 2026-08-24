import type { ReactNode } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/**
 * Common wrapper for every routed page: the h1 and the vertical rhythm live
 * here so individual pages only supply their content.
 */
export const PageShell = ({
    title,
    action,
    children,
}: {
    title: string;
    action?: ReactNode;
    children?: ReactNode;
}) => (
    <Stack spacing={3}>
        <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
            <Typography variant="h1">{title}</Typography>
            {action}
        </Stack>
        {children}
    </Stack>
);
