import type { Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import "./globals.css";
import { rootMetadata } from "@/lib/seo";

export const generateMetadata = rootMetadata;
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b2026" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
