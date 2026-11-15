import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only Darling itself may frame its pages (the admin reel studio films real screens in an iframe).
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }, { key: "Content-Security-Policy", value: "frame-ancestors 'self'" }] }];
  },
};
export default nextConfig;
