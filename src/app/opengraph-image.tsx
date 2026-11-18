import { ImageResponse } from "next/og";

// Text-only social preview card in the brand style (no photos).
export const alt = "Laazizi HQ: not a website, a booking engine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ededed", color: "#1c1f24", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
          <span style={{ color: "#1f5277" }}>DAR</span>
          <span style={{ color: "#d9468a" }}>LING</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 104, lineHeight: 0.9, textTransform: "uppercase", letterSpacing: -2 }}>
          <span>Not a website.</span>
          <span>A booking engine.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "3px solid #1c1f24", paddingTop: 20, fontSize: 26, textTransform: "uppercase", letterSpacing: 1 }}>
          <span>Salon &amp; spa software · M-Pesa</span>
          <span>14-day free trial</span>
        </div>
      </div>
    ),
    size,
  );
}
