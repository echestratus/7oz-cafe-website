UPDATE reservation_settings
SET timezone = 'Asia/Tashkent',
    weekly_hours = '{
      "monday":{"open":"08:00","close":"00:00"},
      "tuesday":{"open":"08:00","close":"00:00"},
      "wednesday":{"open":"08:00","close":"00:00"},
      "thursday":{"open":"08:00","close":"00:00"},
      "friday":{"open":"08:00","close":"00:00"},
      "saturday":{"open":"07:30","close":"23:00"},
      "sunday":{"open":"07:30","close":"23:00"}
    }'::jsonb,
    updated_at = NOW()
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';
