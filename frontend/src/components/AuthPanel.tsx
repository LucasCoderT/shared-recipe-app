import { useState, type SyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { applyServerErrors } from "~/api/errors";
import { useLoginMutation, useRegisterMutation } from "~/hooks/useAuthMutations";
import { loginSchema, registerSchema, type LoginValues } from "~/schemas";

type Mode = "login" | "register";

const FIELDS = ["email", "password"] as const;

export const AuthPanel = () => {
    const [mode, setMode] = useState<Mode>("login");
    const [formError, setFormError] = useState<string | null>(null);
    const isRegister = mode === "register";

    const login = useLoginMutation();
    const register = useRegisterMutation();
    const active = isRegister ? register : login;

    const {
        register: field,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(isRegister ? registerSchema : loginSchema),
        defaultValues: { email: "", password: "" },
        mode: "onTouched",
    });

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            await active.mutateAsync(values);
        } catch (error) {
            setFormError(applyServerErrors(error, setError, FIELDS));
        }
    });

    const switchTo = (_event: SyntheticEvent, next: Mode) => {
        setMode(next);
        setFormError(null);
        reset();
    };

    return (
        <Box component="form" onSubmit={(event) => void onSubmit(event)} noValidate>
            <Tabs value={mode} onChange={switchTo} sx={{ mb: 2 }}>
                <Tab value="login" label="Sign in" />
                <Tab value="register" label="Register" />
            </Tabs>

            <Stack spacing={2}>
                <TextField
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    {...field("email")}
                />

                <TextField
                    label="Password"
                    type="password"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    error={Boolean(errors.password)}
                    helperText={
                        errors.password?.message ??
                        (isRegister ? "At least 8 characters." : undefined)
                    }
                    {...field("password")}
                />

                <Button type="submit" variant="contained" loading={isSubmitting}>
                    {isRegister ? "Create account" : "Sign in"}
                </Button>

                {formError && <Alert severity="error">{formError}</Alert>}
            </Stack>
        </Box>
    );
};
