import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Paper from "@mui/material/Paper";
import { AuthPanel } from "~/components/AuthPanel";
import { PageShell } from "~/components/PageShell";
import { useWhoamiQuery } from "~/hooks/useWhoamiQuery";

/**
 * Only relative paths are honoured, so a crafted ?next=https://evil.example
 * cannot turn the login redirect into an open redirect.
 */
const safeNext = (value: string | null) =>
    value && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export const LoginPage = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { data } = useWhoamiQuery();
    const destination = safeNext(params.get("next"));

    // Covers both arriving already signed in and signing in on this page: the
    // whoami invalidation from the mutation flips this and the redirect fires.
    useEffect(() => {
        if (data?.authenticated) {
            void navigate(destination, { replace: true });
        }
    }, [data?.authenticated, destination, navigate]);

    return (
        <PageShell title="Sign in">
            <Paper sx={{ p: 2.5, maxWidth: 420 }}>
                <AuthPanel />
            </Paper>
        </PageShell>
    );
};
