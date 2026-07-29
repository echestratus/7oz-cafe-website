INSERT INTO membership_levels (id, code, name, description, rank, qualification_rules, is_active, sort_order) VALUES
(
    'a1111111-1111-1111-1111-111111111101',
    'bronze',
    'Bronze',
    'Welcome tier for every registered customer.',
    1,
    '{"minCompletedReservations":0,"minLifetimeLoyaltyPoints":0}'::jsonb,
    TRUE,
    10
),
(
    'a1111111-1111-1111-1111-111111111102',
    'silver',
    'Silver',
    'For guests who visit regularly.',
    2,
    '{"minCompletedReservations":3,"minLifetimeLoyaltyPoints":0}'::jsonb,
    TRUE,
    20
),
(
    'a1111111-1111-1111-1111-111111111103',
    'gold',
    'Gold',
    'For dedicated 7Oz regulars.',
    3,
    '{"minCompletedReservations":8,"minLifetimeLoyaltyPoints":0}'::jsonb,
    TRUE,
    30
),
(
    'a1111111-1111-1111-1111-111111111104',
    'platinum',
    'Platinum',
    'Our highest recognition for loyal guests.',
    4,
    '{"minCompletedReservations":20,"minLifetimeLoyaltyPoints":0}'::jsonb,
    TRUE,
    40
);

INSERT INTO membership_benefits (id, level_id, code, title, description, data, is_active, sort_order) VALUES
(
    'b2222222-2222-2222-2222-222222222201',
    NULL,
    'member_welcome',
    'Member recognition',
    'Every member receives a digital membership card and status tracking.',
    '{"category":"general"}'::jsonb,
    TRUE,
    10
),
(
    'b2222222-2222-2222-2222-222222222202',
    'a1111111-1111-1111-1111-111111111101',
    'bronze_birthday',
    'Birthday greeting',
    'Receive a birthday greeting from the cafe.',
    '{"category":"birthday"}'::jsonb,
    TRUE,
    20
),
(
    'b2222222-2222-2222-2222-222222222203',
    'a1111111-1111-1111-1111-111111111102',
    'silver_priority',
    'Reservation priority',
    'Priority consideration during peak seating windows.',
    '{"category":"reservation","priority":true}'::jsonb,
    TRUE,
    30
),
(
    'b2222222-2222-2222-2222-222222222204',
    'a1111111-1111-1111-1111-111111111103',
    'gold_multiplier',
    'Loyalty multiplier',
    'Earn points with a Gold tier multiplier once loyalty launches.',
    '{"category":"loyalty","pointMultiplier":1.25}'::jsonb,
    TRUE,
    40
),
(
    'b2222222-2222-2222-2222-222222222205',
    'a1111111-1111-1111-1111-111111111104',
    'platinum_early_access',
    'Seasonal early access',
    'Early notice for seasonal menus and member gatherings.',
    '{"category":"menu","earlyAccess":true}'::jsonb,
    TRUE,
    50
);
