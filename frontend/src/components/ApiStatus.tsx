import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import { useHealthQuery } from "~/hooks/useHealthQuery";

export const ApiStatus = () => {
    const { data, isPending, isError } = useHealthQuery();

    if (isPending) {
        return <Skeleton variant="rounded" width={140} height={24} />;
    }

    if (isError) {
        return <Chip size="small" color="error" label="Backend unreachable" />;
    }

    return <Chip size="small" color="success" label={`Backend ${data.status}`} />;
};
