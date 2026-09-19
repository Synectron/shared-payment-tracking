import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the cloud-agent browser / HMR to talk to the local next dev server.
  allowedDevOrigins: ["127.0.0.1"],
  // Keep recently visited group tabs in the client router cache so switching
  // Home ↔ Spends ↔ People doesn’t wait on a fresh RSC round-trip. Mutations
  // still call router.refresh(), which invalidates the current route.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
