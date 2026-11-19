-- The name is now "Darling HQ": update it in saved platform settings (site name, SEO titles, homepage copy).
-- Covers "Laazizi HQ", a bare "Laazizi" and the capitalised wordmark; keys holding secrets are left alone.
UPDATE "PlatformSetting"
SET "value" = regexp_replace(regexp_replace(regexp_replace("value"::text,
  'Laazizi HQ', 'Darling HQ', 'g'),
  'Laazizi', 'Darling HQ', 'g'),
  'LAAZIZI', 'DARLING', 'g')::jsonb
WHERE "key" <> 'vapid' AND "value"::text ~* 'laazizi';
