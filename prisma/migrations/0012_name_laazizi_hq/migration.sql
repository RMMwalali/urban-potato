-- The name is now "Laazizi HQ": update it in saved platform settings (site name, SEO titles, homepage copy).
-- Never doubles up ("Laazizi HQ" stays as it is); keys holding secrets are left alone.
UPDATE "PlatformSetting"
SET "value" = regexp_replace("value"::text, 'Laazizi(?! HQ)', 'Laazizi HQ', 'g')::jsonb
WHERE "key" <> 'vapid' AND "value"::text ~ 'Laazizi(?! HQ)';
