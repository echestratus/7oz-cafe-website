DELETE FROM loyalty_campaigns WHERE id = 'e5555555-5555-5555-5555-555555555501';
DELETE FROM loyalty_rewards WHERE id IN (
    'd4444444-4444-4444-4444-444444444401',
    'd4444444-4444-4444-4444-444444444402',
    'd4444444-4444-4444-4444-444444444403'
);
DELETE FROM loyalty_settings WHERE id = 'c3333333-3333-3333-3333-333333333301';

UPDATE membership_levels
SET qualification_rules = qualification_rules - 'loyaltyPointMultiplier',
    updated_at = NOW()
WHERE code IN ('bronze', 'silver', 'gold', 'platinum')
  AND deleted_at IS NULL;
