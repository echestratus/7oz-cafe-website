INSERT INTO reservation_settings (
    id,
    min_guests,
    max_guests,
    min_advance_minutes,
    max_advance_days,
    slot_interval_minutes,
    duration_minutes,
    buffer_minutes,
    cancel_cutoff_minutes,
    timezone,
    weekly_hours
) VALUES (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    1,
    12,
    30,
    30,
    30,
    90,
    15,
    120,
    'Asia/Jakarta',
    '{
      "monday":{"open":"08:00","close":"21:00"},
      "tuesday":{"open":"08:00","close":"21:00"},
      "wednesday":{"open":"08:00","close":"21:00"},
      "thursday":{"open":"08:00","close":"21:00"},
      "friday":{"open":"08:00","close":"22:00"},
      "saturday":{"open":"09:00","close":"22:00"},
      "sunday":{"open":"09:00","close":"20:00"}
    }'::jsonb
);

INSERT INTO cafe_tables (id, code, name, capacity, is_active, sort_order) VALUES
('ffffffff-ffff-ffff-ffff-fffffffffff1', 'T1', 'Window Two', 2, TRUE, 10),
('ffffffff-ffff-ffff-ffff-fffffffffff2', 'T2', 'Window Four', 4, TRUE, 20),
('ffffffff-ffff-ffff-ffff-fffffffffff3', 'T3', 'Garden Four', 4, TRUE, 30),
('ffffffff-ffff-ffff-ffff-fffffffffff4', 'T4', 'Garden Six', 6, TRUE, 40),
('ffffffff-ffff-ffff-ffff-fffffffffff5', 'T5', 'Communal Eight', 8, TRUE, 50);
