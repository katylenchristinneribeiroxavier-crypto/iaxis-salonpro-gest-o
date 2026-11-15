CREATE OR REPLACE FUNCTION public.subscription_amount_matches_plan(_plan uuid, _billing text, _amount numeric)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
 SELECT coalesce((SELECT _amount > 0 AND _amount = CASE _billing WHEN 'mensal' THEN p.price WHEN 'anual' THEN round(p.annual_monthly_price * 12, 2) ELSE NULL END FROM public.plans p WHERE p.id = _plan), false)
$$;
REVOKE ALL ON FUNCTION public.subscription_amount_matches_plan(uuid,text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.subscription_amount_matches_plan(uuid,text,numeric) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.validate_subscription_plan_amount()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.is_test_purchase THEN
  IF NEW.amount <> 0 THEN RAISE EXCEPTION 'A compra interna de teste deve ter valor zero'; END IF;
  RETURN NEW;
 END IF;
 IF TG_OP = 'UPDATE' THEN
  IF NEW.status = 'confirmado' AND OLD.status = 'confirmado' AND NEW.plan_id IS NOT DISTINCT FROM OLD.plan_id AND NEW.billing IS NOT DISTINCT FROM OLD.billing AND NEW.amount IS NOT DISTINCT FROM OLD.amount AND NEW.is_test_purchase IS NOT DISTINCT FROM OLD.is_test_purchase THEN RETURN NEW; END IF;
 END IF;
 IF NOT public.subscription_amount_matches_plan(NEW.plan_id, NEW.billing, NEW.amount) THEN
  RAISE EXCEPTION 'Valor inválido: o pagamento deve corresponder exatamente ao plano e período escolhidos';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_subscription_plan_amount() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER validate_subscription_plan_amount BEFORE INSERT OR UPDATE OF plan_id,billing,amount,status,is_test_purchase ON public.subscription_requests FOR EACH ROW EXECUTE FUNCTION public.validate_subscription_plan_amount();