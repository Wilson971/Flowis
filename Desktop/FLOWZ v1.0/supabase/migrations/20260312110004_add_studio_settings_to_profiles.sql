ALTER TABLE profiles ADD COLUMN IF NOT EXISTS studio_settings JSONB DEFAULT '{
  "quality": "high",
  "temperature": 0.7,
  "variants": 3,
  "autoClassify": true,
  "presetAutoSelect": true,
  "confidenceThreshold": 0.6,
  "monthlyQuota": 100,
  "alertThreshold": 0.8,
  "exportFormat": "png",
  "exportResolution": 2048,
  "includeMetadata": true
}'::jsonb;
