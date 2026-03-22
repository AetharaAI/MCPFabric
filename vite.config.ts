import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_APP_BASE_PATH || env.APP_BASE_PATH || "/";

  return {
    base,
    plugins: [
      ...(command === "serve" ? [inspectAttr()] : []),
      react(),
    ],
    define: {
      __PASSPORT_DISCOVERY_URL__: JSON.stringify(
        env.VITE_PASSPORT_DISCOVERY_URL || env.PASSPORT_DISCOVERY_URL || "",
      ),
      __PASSPORT_CLIENT_ID__: JSON.stringify(
        env.VITE_PASSPORT_CLIENT_ID || env.PASSPORT_CLIENT_ID || "",
      ),
      __PASSPORT_REDIRECT_URI__: JSON.stringify(
        env.VITE_PASSPORT_REDIRECT_URI || env.PASSPORT_REDIRECT_URI || "",
      ),
      __PASSPORT_POST_LOGOUT_REDIRECT_URI__: JSON.stringify(
        env.VITE_PASSPORT_POST_LOGOUT_REDIRECT_URI || env.PASSPORT_POST_LOGOUT_REDIRECT_URI || "",
      ),
      __APP_BASE_URL__: JSON.stringify(
        env.VITE_APP_BASE_URL || env.APP_BASE_URL || "",
      ),
      __PASSPORT_SCOPE__: JSON.stringify(
        env.VITE_PASSPORT_SCOPE || env.PASSPORT_SCOPE || "openid profile email",
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
