import type { Viewport } from "next";
import "@fontsource-variable/geist";
import "./globals.css";
import { rootMetadata } from "@/lib/seo";

export const generateMetadata = rootMetadata;
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ededed" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
