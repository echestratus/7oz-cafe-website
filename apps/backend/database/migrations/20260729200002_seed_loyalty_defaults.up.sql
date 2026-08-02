INSERT INTO loyalty_settings (
    id,
    points_per_completed_reservation,
    expiration_strategy,
    expiration_months
) VALUES (
    'c3333333-3333-3333-3333-333333333301',
    50,
    'never',
    12
);

INSERT INTO loyalty_rewards (id, code, title, description, points_cost, stock, is_active, sort_order, data) VALUES
(
    'd4444444-4444-4444-4444-444444444401',
    'free_espresso',
    'Free espresso',
    'Redeem for one house espresso.',
    100,
    NULL,
    TRUE,
    10,
    '{"category":"drink"}'::jsonb
),
(
    'd4444444-4444-4444-4444-444444444402',
    'free_pastry',
    'Free pastry',
    'Redeem for one selected pastry.',
    150,
    NULL,
    TRUE,
    20,
    '{"category":"food"}'::jsonb
),
(
    'd4444444-4444-4444-4444-444444444403',
    'ten_percent_voucher',
    '10% voucher',
    'Redeem for a 10% discount on your next visit.',
    250,
    100,
    TRUE,
    30,
    '{"category":"voucher","discountPercent":10}'::jsonb
);

INSERT INTO loyalty_campaigns (
    id, code, name, description, starts_at, ends_at, point_multiplier, bonus_points, eligible_level_codes, is_active
) VALUES (
    'e5555555-5555-5555-5555-555555555501',
    'welcome_boost',
    'Welcome Boost',
    'Bonus recognition for early members completing visits.',
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '180 days',
    1.00,
    25,
    '[]'::jsonb,
    TRUE
);

UPDATE membership_levels
SET qualification_rules = qualification_rules || '{"loyaltyPointMultiplier":1.0}'::jsonb,
    updated_at = NOW()
WHERE code = 'bronze' AND deleted_at IS NULL;

UPDATE membership_levels
SET qualification_rules = qualification_rules || '{"loyaltyPointMultiplier":1.2}'::jsonb,
    updated_at = NOW()
WHERE code = 'silver' AND deleted_at IS NULL;

UPDATE membership_levels
SET qualification_rules = qualification_rules || '{"loyaltyPointMultiplier":1.5}'::jsonb,
    updated_at = NOW()
WHERE code = 'gold' AND deleted_at IS NULL;

UPDATE membership_levels
SET qualification_rules = qualification_rules || '{"loyaltyPointMultiplier":2.0}'::jsonb,
    updated_at = NOW()
WHERE code = 'platinum' AND deleted_at IS NULL;
