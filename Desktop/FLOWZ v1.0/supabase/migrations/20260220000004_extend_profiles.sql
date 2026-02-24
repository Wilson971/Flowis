-- Extend profiles table with additional user fields
-- Required by ProfileGeneralSection, useUserProfile hook, and all profile sections

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{}'::jsonb;

-- Backfill first_name / last_name from full_name for existing rows
UPDATE profiles
SET
  first_name = SPLIT_PART(TRIM(full_name), ' ', 1),
  last_name   = CASE
                  WHEN POSITION(' ' IN TRIM(full_name)) > 0
                  THEN TRIM(SUBSTRING(TRIM(full_name) FROM POSITION(' ' IN TRIM(full_name)) + 1))
                  ELSE NULL
                END
WHERE full_name IS NOT NULL
  AND first_name IS NULL;
