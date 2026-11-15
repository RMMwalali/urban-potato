/** Public base URL. Set APP_URL to your domain; on Vercel it falls back to the project's production URL. */
export function appUrl() {
  const u = process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return u.replace(/\/$/, "");
}
