import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts:["1bd6-2401-4900-8f71-1a71-80a8-322b-64df-769e.ngrok-free.app"],
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/webhooks": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:4000",
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", (err: any) => {
            if (err?.code === "ECONNABORTED" || err?.code === "ECONNRESET" || err?.code === "EPIPE") {
              return; // Benign connection lifecycle event during client reloads/tab closures
            }
            console.error("[vite ws proxy error]", err);
          });
          proxy.on("proxyReqWs", (_proxyReq, _req, socket: any) => {
            socket.on("error", (err: any) => {
              if (err?.code === "ECONNABORTED" || err?.code === "ECONNRESET" || err?.code === "EPIPE") {
                return;
              }
              console.error("[vite ws socket error]", err);
            });
          });
        },
      },
    },
  },
});
