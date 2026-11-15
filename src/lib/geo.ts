import "server-only";
import { createHmac } from "crypto";
import { authSecret } from "./secrets";

export type Geo = { country?: string; region?: string; city?: string; latitude?: number; longitude?: number };

const dec = (v: string | null) => {
  if (!v) return undefined;
  try {
    return decodeURIComponent(v).trim() || undefined;
  } catch {
    return v.trim() || undefined;
  }
};
const coord = (v: string | null) => {
  const n = v == null || v === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Approximate visitor location from the network, using headers the host adds for free:
 * Vercel (x-vercel-ip-*) or Cloudflare (cf-ipcountry, plus cf-ipcity/cf-iplatitude/... when the
 * "Add visitor location headers" managed transform is on). No third-party lookup, no raw IP stored.
 */
export function geoFromHeaders(h: Headers): Geo {
  const country = dec(h.get("x-vercel-ip-country")) ?? dec(h.get("cf-ipcountry"));
  return {
    country: country && country !== "XX" && country !== "T1" ? country.toUpperCase() : undefined,
    region: dec(h.get("x-vercel-ip-country-region")) ?? dec(h.get("cf-region")),
    city: dec(h.get("x-vercel-ip-city")) ?? dec(h.get("cf-ipcity")),
    latitude: coord(h.get("x-vercel-ip-latitude")) ?? coord(h.get("cf-iplatitude")),
    longitude: coord(h.get("x-vercel-ip-longitude")) ?? coord(h.get("cf-iplongitude")),
  };
}

export function clientIp(h: Headers) {
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "").trim() || null;
}

/** One-way hash of the IP so repeat visits can be grouped without keeping the address itself. */
export function ipHash(h: Headers) {
  const ip = clientIp(h);
  return ip ? createHmac("sha256", authSecret()).update(`ip:${ip}`).digest("hex").slice(0, 32) : null;
}

/** Kenya's 47 counties with the approximate position of each county town. */
export const KENYA_COUNTIES: { name: string; lat: number; lng: number }[] = [
  { name: "Baringo", lat: 0.47, lng: 35.97 }, { name: "Bomet", lat: -0.78, lng: 35.34 }, { name: "Bungoma", lat: 0.56, lng: 34.56 },
  { name: "Busia", lat: 0.46, lng: 34.11 }, { name: "Elgeyo-Marakwet", lat: 0.67, lng: 35.51 }, { name: "Embu", lat: -0.53, lng: 37.45 },
  { name: "Garissa", lat: -0.45, lng: 39.65 }, { name: "Homa Bay", lat: -0.53, lng: 34.46 }, { name: "Isiolo", lat: 0.35, lng: 37.58 },
  { name: "Kajiado", lat: -1.85, lng: 36.78 }, { name: "Kakamega", lat: 0.28, lng: 34.75 }, { name: "Kericho", lat: -0.37, lng: 35.28 },
  { name: "Kiambu", lat: -1.17, lng: 36.83 }, { name: "Kilifi", lat: -3.63, lng: 39.85 }, { name: "Kirinyaga", lat: -0.5, lng: 37.28 },
  { name: "Kisii", lat: -0.68, lng: 34.77 }, { name: "Kisumu", lat: -0.09, lng: 34.77 }, { name: "Kitui", lat: -1.37, lng: 38.01 },
  { name: "Kwale", lat: -4.17, lng: 39.45 }, { name: "Laikipia", lat: 0.02, lng: 37.07 }, { name: "Lamu", lat: -2.27, lng: 40.9 },
  { name: "Machakos", lat: -1.52, lng: 37.26 }, { name: "Makueni", lat: -1.8, lng: 37.62 }, { name: "Mandera", lat: 3.94, lng: 41.86 },
  { name: "Marsabit", lat: 2.33, lng: 37.99 }, { name: "Meru", lat: 0.05, lng: 37.65 }, { name: "Migori", lat: -1.06, lng: 34.47 },
  { name: "Mombasa", lat: -4.04, lng: 39.67 }, { name: "Murang'a", lat: -0.72, lng: 37.15 }, { name: "Nairobi", lat: -1.29, lng: 36.82 },
  { name: "Nakuru", lat: -0.3, lng: 36.07 }, { name: "Nandi", lat: 0.2, lng: 35.1 }, { name: "Narok", lat: -1.08, lng: 35.87 },
  { name: "Nyamira", lat: -0.57, lng: 34.94 }, { name: "Nyandarua", lat: -0.18, lng: 36.52 }, { name: "Nyeri", lat: -0.42, lng: 36.95 },
  { name: "Samburu", lat: 1.1, lng: 36.7 }, { name: "Siaya", lat: 0.06, lng: 34.29 }, { name: "Taita-Taveta", lat: -3.4, lng: 38.56 },
  { name: "Tana River", lat: -1.5, lng: 40.03 }, { name: "Tharaka-Nithi", lat: -0.33, lng: 37.65 }, { name: "Trans Nzoia", lat: 1.02, lng: 35.0 },
  { name: "Turkana", lat: 3.12, lng: 35.6 }, { name: "Uasin Gishu", lat: 0.51, lng: 35.27 }, { name: "Vihiga", lat: 0.07, lng: 34.72 },
  { name: "Wajir", lat: 1.75, lng: 40.06 }, { name: "West Pokot", lat: 1.24, lng: 35.12 },
];

/** Countries offered at sign-up, with a central point used when nothing more precise is known. */
export const COUNTRIES: { code: string; name: string; lat: number; lng: number }[] = [
  { code: "KE", name: "Kenya", lat: 0.02, lng: 37.91 },
  { code: "UG", name: "Uganda", lat: 1.37, lng: 32.29 },
  { code: "TZ", name: "Tanzania", lat: -6.37, lng: 34.89 },
  { code: "RW", name: "Rwanda", lat: -1.94, lng: 29.87 },
  { code: "BI", name: "Burundi", lat: -3.37, lng: 29.92 },
  { code: "ET", name: "Ethiopia", lat: 9.15, lng: 40.49 },
  { code: "SS", name: "South Sudan", lat: 6.88, lng: 31.31 },
  { code: "SO", name: "Somalia", lat: 5.15, lng: 46.2 },
  { code: "NG", name: "Nigeria", lat: 9.08, lng: 8.68 },
  { code: "GH", name: "Ghana", lat: 7.95, lng: -1.02 },
  { code: "ZA", name: "South Africa", lat: -30.56, lng: 22.94 },
  { code: "ZM", name: "Zambia", lat: -13.13, lng: 27.85 },
  { code: "MW", name: "Malawi", lat: -13.25, lng: 34.3 },
  { code: "AE", name: "United Arab Emirates", lat: 23.42, lng: 53.85 },
  { code: "GB", name: "United Kingdom", lat: 55.38, lng: -3.44 },
  { code: "US", name: "United States", lat: 37.09, lng: -95.71 },
];

export const countryName = (code?: string | null) => COUNTRIES.find((c) => c.code === code)?.name ?? code ?? "";

/**
 * Where to pin a salon: the typed Kenyan county is the most reliable; otherwise the network location
 * at sign-up if it's in the same country; otherwise the country's centre.
 */
export function placeBusiness(input: { country?: string; region?: string }, net: Geo) {
  const county = input.country === "KE" ? KENYA_COUNTIES.find((c) => c.name === input.region) : undefined;
  if (county) return { latitude: county.lat, longitude: county.lng, locationSource: "county" };
  if (net.latitude != null && net.longitude != null && (!input.country || net.country === input.country))
    return { latitude: net.latitude, longitude: net.longitude, locationSource: "ip" };
  const c = COUNTRIES.find((x) => x.code === input.country);
  if (c) return { latitude: c.lat, longitude: c.lng, locationSource: "country" };
  return { latitude: null, longitude: null, locationSource: null };
}
