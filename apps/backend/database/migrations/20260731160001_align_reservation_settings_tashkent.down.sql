UPDATE reservation_settings
SET timezone = 'Asia/Jakarta',
    weekly_hours = '{
      "monday":{"open":"08:00","close":"21:00"},
      "tuesday":{"open":"08:00","close":"21:00"},
      "wednesday":{"open":"08:00","close":"21:00"},
      "thursday":{"open":"08:00","close":"21:00"},
      "friday":{"open":"08:00","close":"22:00"},
      "saturday":{"open":"09:00","close":"22:00"},
      "sunday":{"open":"09:00","close":"20:00"}
    }'::jsonb,
    updated_at = NOW()
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';
