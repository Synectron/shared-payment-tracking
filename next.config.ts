import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the cloud-agent browser / HMR to talk to the local next dev server.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
