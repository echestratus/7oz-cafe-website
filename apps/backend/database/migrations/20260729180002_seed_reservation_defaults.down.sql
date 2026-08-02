DELETE FROM cafe_tables
WHERE id IN (
    'ffffffff-ffff-ffff-ffff-fffffffffff1',
    'ffffffff-ffff-ffff-ffff-fffffffffff2',
    'ffffffff-ffff-ffff-ffff-fffffffffff3',
    'ffffffff-ffff-ffff-ffff-fffffffffff4',
    'ffffffff-ffff-ffff-ffff-fffffffffff5'
);

DELETE FROM reservation_settings
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';
