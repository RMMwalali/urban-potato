import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SpaDesk", template: "%s · SpaDesk" },
  description: "Bookings, client records, payments and reminders for salons and spas.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#a83269" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
