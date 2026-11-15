import Link from "next/link";
import { getSettings } from "@/lib/platform";
import { Logo } from "@/components/Logo";

export async function SiteFooter() {
  const { general } = await getSettings();
  const name = general.siteName;
  const hasContact = !!(general.supportWhatsApp || general.supportEmail || general.supportPhone);
  return (
    <footer className="mt-32 border-t-2 border-ink px-5 pt-12 pb-8 sm:px-8 md:mt-48">
      <div className="grid gap-10 text-[13px] uppercase tracking-[0.06em] sm:grid-cols-4">
        <ul className="space-y-2">
          <li className="text-muted">Product</li>
          <li><Link href="/#features" className="hover:opacity-50">Features</Link></li>
          <li><Link href="/#pricing" className="hover:opacity-50">Pricing</Link></li>
          <li><Link href="/signup" className="hover:opacity-50">Start free trial</Link></li>
        </ul>
        <ul className="space-y-2">
          <li className="text-muted">Guides</li>
          <li><Link href="/guides" className="hover:opacity-50">All guides</Link></li>
          <li><Link href="/guides/do-salons-need-a-website" className="hover:opacity-50">Do salons need a website?</Link></li>
          <li><Link href="/guides/reduce-salon-no-shows" className="hover:opacity-50">Reduce no-shows</Link></li>
        </ul>
        <ul className="space-y-2">
          <li className="text-muted">Account</li>
          <li><Link href="/login" className="hover:opacity-50">Log in</Link></li>
          <li><Link href="/signup" className="hover:opacity-50">Create a salon</Link></li>
        </ul>
        {hasContact && (
          <ul className="space-y-2">
            <li className="text-muted">Contact</li>
            {general.supportWhatsApp && <li><a href={`https://wa.me/${general.supportWhatsApp}`} className="hover:opacity-50">WhatsApp</a></li>}
            {general.supportEmail && <li><a href={`mailto:${general.supportEmail}`} className="normal-case hover:opacity-50">{general.supportEmail}</a></li>}
            {general.supportPhone && <li><a href={`tel:${general.supportPhone}`} className="hover:opacity-50">{general.supportPhone}</a></li>}
          </ul>
        )}
      </div>
      <p className="mt-20"><Logo name={name} className="block text-[clamp(64px,19vw,300px)] leading-[0.8] tracking-[-0.04em]" /></p>
      <p className="mt-6 text-[12px] uppercase tracking-[0.06em] text-muted">© {new Date().getFullYear()} {name}</p>
    </footer>
  );
}
