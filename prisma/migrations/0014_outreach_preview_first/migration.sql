-- Outreach now opens with the booking page made for each lead ({preview}). Saved copies of the old pitch-style
-- messages are removed so the new defaults apply; they can be edited again in Admin → Leads → Templates.
UPDATE "PlatformSetting"
SET "value" = ("value"::jsonb - 'whatsapp' - 'instagram' - 'followUp' - 'email' - 'emailSubject')
WHERE "key" = 'outreach';
