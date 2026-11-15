import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/platform";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { general } = await getSettings();
  return {
    name: general.siteName,
    short_name: general.siteName,
    description: "Bookings, clients, M-Pesa payments and notifications for your salon.",
    id: "/app",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ededed",
    theme_color: "#ededed",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
