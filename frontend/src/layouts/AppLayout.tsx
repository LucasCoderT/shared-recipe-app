import { NavLink, Outlet } from "react-router";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { SessionControls } from "~/components/SessionControls";

const NAV = [
    { to: "/", label: "Recipes", end: true },
    { to: "/shopping-lists", label: "Shopping lists", end: false },
];

export const AppLayout = () => (
    <>
        <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar sx={{ gap: 2, flexWrap: "wrap", borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                    Shared Recipes
                </Typography>

                <Stack direction="row" spacing={1}>
                    {NAV.map((item) => (
                        <Button
                            key={item.to}
                            component={NavLink}
                            to={item.to}
                            end={item.end}
                            color="inherit"
                            sx={{
                                "&[aria-current='page']": {
                                    fontWeight: 700,
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Stack>

                <Box sx={{ flexGrow: 1 }} />
                <SessionControls />
            </Toolbar>
        </AppBar>

        <Container component="main" maxWidth="lg" sx={{ py: 5 }}>
            <Outlet />
        </Container>
    </>
);
