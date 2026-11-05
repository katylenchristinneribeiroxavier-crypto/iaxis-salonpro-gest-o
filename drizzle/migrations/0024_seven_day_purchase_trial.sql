ALTER TABLE public.subscription_requests ADD COLUMN confirmed_at timestamptz, ADD COLUMN trial_ends_at timestamptz;
CREATE FUNCTION public.stamp_purchase_trial() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF new.status='confirmado' AND (TG_OP='INSERT' OR old.status<>'confirmado') THEN new.confirmed_at:=coalesce(new.confirmed_at,now()); new.trial_ends_at:=new.confirmed_at+interval '7 days';
 ELSIF TG_OP='UPDATE' THEN new.confirmed_at:=old.confirmed_at; new.trial_ends_at:=old.trial_ends_at; END IF;
 RETURN new; END $$;
CREATE TRIGGER purchase_trial_stamp BEFORE INSERT OR UPDATE ON public.subscription_requests FOR EACH ROW EXECUTE FUNCTION public.stamp_purchase_trial();
CREATE OR REPLACE FUNCTION public.salon_access_allowed(_salon uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.has_role(auth.uid(),'super_admin') OR EXISTS(SELECT 1 FROM public.salons s WHERE s.id=_salon AND s.archived_at IS NULL AND s.status='ativo' AND (s.access_enabled OR (s.suspended_until IS NOT NULL AND s.suspended_until<=now())) AND (NOT EXISTS(SELECT 1 FROM public.platform_test_purchase t WHERE t.salon_id=s.id) OR EXISTS(SELECT 1 FROM public.platform_test_purchase t JOIN public.subscription_requests r ON r.id=t.request_id WHERE t.salon_id=s.id AND r.trial_ends_at>now()) OR EXISTS(SELECT 1 FROM public.subscription_requests r WHERE r.user_id=s.owner_id AND r.status='confirmado' AND NOT r.is_test_purchase)))
 $$;
COMMENT ON COLUMN public.subscription_requests.trial_ends_at IS 'Sete dias de teste a partir da confirmação; compras pagas continuam ativas após o prazo, compra gratuita expira sem compra paga.';