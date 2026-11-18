-- Outreach messages open as the founder. Updates templates saved from Admin → Leads → Templates
-- (defaults in code are already updated); text the admin rewrote differently is left alone.
UPDATE "PlatformSetting"
SET "value" = replace(replace(replace(replace("value"::text,
  'I''m {sender} from {brand}.', 'I''m {sender}, the founder of {brand}.'),
  '{sender} from {brand} here.', 'I''m {sender}, the founder of {brand}.'),
  '{sender} from {brand} again.', 'it''s {sender}, the founder of {brand}, again.'),
  '\n{sender}\n{brand}\n', '\n{sender}\nFounder, {brand}\n')::jsonb
WHERE "key" = 'outreach';
