import type { Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import { rootMetadata } from "@/lib/seo";

export const generateMetadata = rootMetadata;
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1c1023" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
