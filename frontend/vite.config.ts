import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const DJANGO = process.env.DJANGO_ORIGIN ?? "http://127.0.0.1:8000";
const IN_DOCKER = process.env.VITE_IN_DOCKER === "true";

export default defineConfig(({ command }) => ({
    plugins: [react()],
    resolve: {
        alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    base: command === "build" ? "/static/" : "/",
    build: {
        outDir: "dist",
        emptyOutDir: true,
        manifest: true,
    },
    server: {
        host: true,
        port: 5173,
        ...(IN_DOCKER ? { watch: { usePolling: true } } : {}),
        proxy: {
            "/api": { target: DJANGO, changeOrigin: true },
            "/admin": { target: DJANGO, changeOrigin: true },
            "/media": { target: DJANGO, changeOrigin: true },
        },
    },
}));
