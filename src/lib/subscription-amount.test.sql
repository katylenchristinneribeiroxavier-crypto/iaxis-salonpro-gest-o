-- Read-only checks against the deployed payment validation function.
SELECT p.name, v.billing, v.expected,
 public.subscription_amount_matches_plan(p.id, v.billing, v.expected) AS accepts_exact,
 NOT public.subscription_amount_matches_plan(p.id, v.billing, v.expected - 0.01) AS rejects_short,
 NOT public.subscription_amount_matches_plan(p.id, v.billing, v.expected + 0.01) AS rejects_excess,
 NOT public.subscription_amount_matches_plan(p.id, v.billing, 0) AS rejects_zero
FROM public.plans p
JOIN (VALUES
 ('Básico', 'mensal', 59.90::numeric), ('Básico', 'anual', 478.80::numeric),
 ('Pro', 'mensal', 99.90::numeric), ('Pro', 'anual', 958.80::numeric),
 ('Premium', 'mensal', 149.90::numeric), ('Premium', 'anual', 1438.80::numeric)
) AS v(name, billing, expected) ON p.name = v.name;

SELECT NOT public.subscription_amount_matches_plan(p.id, 'mensal', 99.90) AS rejects_other_plan,
 NOT public.subscription_amount_matches_plan(p.id, 'anual', 39.90) AS rejects_annual_installment,
 NOT public.subscription_amount_matches_plan(p.id, 'invalid', 59.90) AS rejects_unknown_cycle,
 NOT public.subscription_amount_matches_plan(p.id, 'mensal', NULL) AS rejects_missing_amount,
 EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.subscription_requests'::regclass AND tgname='validate_subscription_plan_amount' AND tgenabled='O') AS trigger_active
FROM public.plans p WHERE p.name='Básico';