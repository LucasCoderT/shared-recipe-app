import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

export const RouteSpinner = () => (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "40vh" }}>
        <CircularProgress />
    </Box>
);
