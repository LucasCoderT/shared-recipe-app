import { Link as RouterLink, useNavigate } from "react-router";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLogoutMutation } from "~/hooks/useAuthMutations";
import { useWhoamiQuery } from "~/hooks/useWhoamiQuery";

export const SessionControls = () => {
    const { data, isPending, isError } = useWhoamiQuery();
    const logout = useLogoutMutation();
    const navigate = useNavigate();

    if (isPending) {
        return <Skeleton variant="rounded" width={120} height={30} />;
    }

    if (isError || !data.authenticated) {
        return (
            <Button component={RouterLink} to="/login" variant="outlined" size="small">
                Sign in
            </Button>
        );
    }

    return (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
                {data.displayName || data.email}
            </Typography>
            <Button
                size="small"
                variant="outlined"
                onClick={() =>
                    logout.mutate(undefined, {
                        onSuccess: () => void navigate("/", { replace: true }),
                    })
                }
                loading={logout.isPending}
            >
                Sign out
            </Button>
        </Stack>
    );
};
