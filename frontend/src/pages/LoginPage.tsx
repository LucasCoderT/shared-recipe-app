import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Paper from "@mui/material/Paper";
import { AuthPanel } from "~/components/AuthPanel";
import { PageShell } from "~/components/PageShell";
import { useWhoamiQuery } from "~/hooks/useWhoamiQuery";

const safeNext = (value: string | null) =>
    value && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export const LoginPage = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { data } = useWhoamiQuery();
    const destination = safeNext(params.get("next"));

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
