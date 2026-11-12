REVOKE ALL ON FUNCTION public.pay_referral_amount(uuid,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_referral_amount(uuid,numeric) TO authenticated,service_role;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.referral_payout_log FROM anon,authenticated;
REVOKE SELECT ON public.referral_payout_log FROM anon;
GRANT SELECT ON public.referral_payout_log TO authenticated;
GRANT ALL ON public.referral_payout_log TO service_role;