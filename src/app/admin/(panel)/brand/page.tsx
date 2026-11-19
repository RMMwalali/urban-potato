import { PageHeader } from "@/components/ui";

export const metadata = { title: "Brand" };

const FILES: { title: string; use: string; bg: string; files: string[] }[] = [
  { title: "Wordmark", use: "Website headers, documents, signage. The main logo.", bg: "#ededed", files: ["darling-wordmark.svg", "darling-wordmark.png"] },
  { title: "Wordmark on dark", use: "Dark backgrounds, video, night-mode screens.", bg: "#1c1f24", files: ["darling-wordmark-on-dark.svg", "darling-wordmark-on-dark.png"] },
  { title: "One colour, ink", use: "Receipts, stamps, black-and-white printing, embroidery.", bg: "#ffffff", files: ["darling-wordmark-ink.svg", "darling-wordmark-ink.png"] },
  { title: "One colour, white", use: "On photos or brand-colour backgrounds.", bg: "#d9468a", files: ["darling-wordmark-white.svg", "darling-wordmark-white.png"] },
  { title: "App icon", use: "Square uses: app stores, launchers, avatars.", bg: "#c8c8c8", files: ["darling-icon.svg", "darling-icon-1024.png"] },
  { title: "App icon, dark", use: "Dark square uses.", bg: "#c8c8c8", files: ["darling-icon-dark.svg", "darling-icon-dark-1024.png"] },
  { title: "Profile picture", use: "Instagram, TikTok, WhatsApp Business, Facebook.", bg: "#c8c8c8", files: ["darling-profile-1080.png"] },
  { title: "Share card", use: "Link previews and social banners (1200 × 630).", bg: "#c8c8c8", files: ["darling-social-1200x630.png"] },
  { title: "Email header", use: "Top of emails and newsletters (1200 × 240).", bg: "#c8c8c8", files: ["darling-email-header-1200x240.png"] },
  { title: "Favicon", use: "Browser tab icon (also installed as the site favicon).", bg: "#c8c8c8", files: ["darling-favicon.svg"] },
];

export default function BrandPage() {
  return (
    <div className="max-w-5xl space-y-10">
      <PageHeader title="Brand" label="Logo files" sub="The DARLING wordmark exactly as in the site header (Geist SemiBold, DAR blue #1f5277, LING pink #d9468a), as vector SVG and high-resolution PNG. Regenerate with scripts/brand.py." />
      <ul className="grid gap-8 sm:grid-cols-2">
        {FILES.map((f) => (
          <li key={f.title} className="border-t-2 border-ink pt-4">
            <div className="flex aspect-[2/1] items-center justify-center p-6" style={{ background: f.bg }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/brand/${f.files[0]}`} alt={`${f.title} preview`} className="max-h-full max-w-full object-contain" />
            </div>
            <p className="mt-3 text-[18px]">{f.title}</p>
            <p className="text-[13px] text-muted">{f.use}</p>
            <p className="mt-2 flex flex-wrap gap-3">
              {f.files.map((x) => <a key={x} href={`/brand/${x}`} download className="label-caps underline decoration-1 underline-offset-4 hover:opacity-60">{x.split(".").pop()!.toUpperCase()}</a>)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
