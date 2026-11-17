-- Rebrand: Darling -> Laazizi in saved platform settings (site name, SEO, homepage copy).
-- Keys holding secrets (e.g. "vapid") are left alone.
UPDATE "PlatformSetting"
SET "value" = replace(replace("value"::text, 'Darling', 'Laazizi'), 'DARLING', 'LAAZIZI')::jsonb
WHERE "key" <> 'vapid' AND ("value"::text LIKE '%Darling%' OR "value"::text LIKE '%DARLING%');
