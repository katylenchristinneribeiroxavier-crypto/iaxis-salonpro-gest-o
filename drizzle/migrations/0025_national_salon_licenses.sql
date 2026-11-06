CREATE TABLE public.licencas_nacionais (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), salao_id uuid NOT NULL UNIQUE REFERENCES public.salons(id), email_cliente text NOT NULL,
 data_inicio timestamptz NOT NULL DEFAULT now(), data_expira timestamptz NOT NULL DEFAULT (now()+interval '7 days'),
 status text NOT NULL DEFAULT 'liberado', tipo_plano text NOT NULL DEFAULT 'mensal', ultimo_pagamento timestamptz,
 aceitou_termos boolean NOT NULL DEFAULT false, termos_aceitos_em timestamptz, termos_aceitos_por uuid
);
GRANT SELECT ON public.licencas_nacionais TO authenticated;
GRANT ALL ON public.licencas_nacionais TO service_role;
ALTER TABLE public.licencas_nacionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY license_read ON public.licencas_nacionais FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'super_admin') OR EXISTS(SELECT 1 FROM public.salons s WHERE s.id=salao_id AND s.owner_id=auth.uid()) OR EXISTS(SELECT 1 FROM public.salon_members m WHERE m.salon_id=salao_id AND m.user_id=auth.uid()));
ALTER TABLE public.subscription_requests ADD COLUMN aceitou_termos boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.licenca_valida(_salon uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.licencas_nacionais l WHERE l.salao_id=_salon AND l.status IN ('liberado','pago') AND (l.status='pago' OR l.data_expira>=now()) AND ((l.ultimo_pagamento IS NULL AND l.status='liberado' AND l.data_expira>=now()) OR (l.ultimo_pagamento IS NOT NULL AND l.ultimo_pagamento + CASE WHEN l.tipo_plano='anual' THEN interval '365 days' ELSE interval '30 days' END >=now())))
$$;
REVOKE ALL ON FUNCTION public.licenca_valida(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.licenca_valida(uuid) TO authenticated,service_role;
INSERT INTO public.licencas_nacionais(salao_id,email_cliente,data_inicio,data_expira,status,tipo_plano,ultimo_pagamento,aceitou_termos)
SELECT s.id,coalesce(r.email,p.email,''),coalesce(r.confirmed_at,s.created_at),CASE WHEN r.id IS NULL OR r.is_test_purchase THEN coalesce(r.trial_ends_at,s.created_at+interval '7 days') ELSE coalesce(r.confirmed_at,r.created_at)+CASE WHEN r.billing='anual' THEN interval '365 days' ELSE interval '30 days' END END,CASE WHEN r.id IS NOT NULL AND NOT r.is_test_purchase THEN 'pago' ELSE 'liberado' END,coalesce(r.billing,'mensal'),CASE WHEN NOT r.is_test_purchase THEN coalesce(r.confirmed_at,r.created_at) ELSE NULL END,coalesce(r.aceitou_termos,false)
FROM public.salons s LEFT JOIN public.profiles p ON p.id=s.owner_id LEFT JOIN LATERAL(SELECT * FROM public.subscription_requests q WHERE q.status='confirmado' AND (q.user_id=s.owner_id OR lower(q.email)=lower(p.email)) ORDER BY q.created_at DESC LIMIT 1) r ON true;
CREATE FUNCTION public.sync_purchase_license() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.salons; r public.subscription_requests;
BEGIN
 IF TG_TABLE_NAME='salons' THEN s:=NEW; SELECT * INTO r FROM public.subscription_requests WHERE status='confirmado' AND (user_id=s.owner_id OR lower(email)=(SELECT lower(email) FROM public.profiles WHERE id=s.owner_id)) ORDER BY created_at DESC LIMIT 1;
 ELSE
  IF NEW.status<>'confirmado' OR (TG_OP='UPDATE' AND OLD.status='confirmado') THEN RETURN NEW; END IF;
  r:=NEW; SELECT * INTO s FROM public.salons WHERE owner_id=r.user_id OR owner_id=(SELECT id FROM public.profiles WHERE lower(email)=lower(r.email) LIMIT 1) LIMIT 1;
 END IF;
 IF s.id IS NULL OR r.id IS NULL THEN RETURN NEW; END IF;
 INSERT INTO public.licencas_nacionais(salao_id,email_cliente,data_inicio,data_expira,status,tipo_plano,ultimo_pagamento,aceitou_termos)
 VALUES(s.id,r.email,coalesce(r.confirmed_at,now()),CASE WHEN r.is_test_purchase THEN coalesce(r.trial_ends_at,now()+interval '7 days') ELSE coalesce(r.confirmed_at,now())+CASE WHEN r.billing='anual' THEN interval '365 days' ELSE interval '30 days' END END,CASE WHEN r.is_test_purchase THEN 'liberado' ELSE 'pago' END,r.billing,CASE WHEN r.is_test_purchase THEN NULL ELSE coalesce(r.confirmed_at,now()) END,r.aceitou_termos)
 ON CONFLICT(salao_id) DO UPDATE SET email_cliente=excluded.email_cliente,data_expira=excluded.data_expira,status=CASE WHEN licencas_nacionais.status='bloqueado' THEN 'bloqueado' ELSE excluded.status END,tipo_plano=excluded.tipo_plano,ultimo_pagamento=excluded.ultimo_pagamento,aceitou_termos=licencas_nacionais.aceitou_termos OR excluded.aceitou_termos;
 RETURN NEW;
END $$;
CREATE TRIGGER z_license_purchase AFTER INSERT OR UPDATE ON public.subscription_requests FOR EACH ROW EXECUTE FUNCTION public.sync_purchase_license();
CREATE TRIGGER z_license_salon AFTER INSERT ON public.salons FOR EACH ROW EXECUTE FUNCTION public.sync_purchase_license();
CREATE OR REPLACE FUNCTION public.salon_access_allowed(_salon uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.has_role(auth.uid(),'super_admin') OR EXISTS(SELECT 1 FROM public.salons s WHERE s.id=_salon AND s.archived_at IS NULL AND s.status='ativo' AND (s.access_enabled OR (s.suspended_until IS NOT NULL AND s.suspended_until<=now())) AND public.licenca_valida(s.id))
$$;
CREATE FUNCTION public.verificar_licenca() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid; l public.licencas_nacionais;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 IF public.has_role(auth.uid(),'super_admin') THEN RETURN jsonb_build_object('permitido',true,'master',true); END IF;
 SELECT id INTO s FROM public.salons WHERE owner_id=auth.uid() LIMIT 1;
 IF s IS NULL THEN SELECT salon_id INTO s FROM public.salon_members WHERE user_id=auth.uid() LIMIT 1; END IF;
 IF s IS NULL THEN RETURN jsonb_build_object('permitido',true,'sem_salao',true); END IF;
 SELECT * INTO l FROM public.licencas_nacionais WHERE salao_id=s;
 RETURN jsonb_build_object('permitido',public.licenca_valida(s),'licenca',to_jsonb(l));
END $$;
CREATE FUNCTION public.master_licenca(_email text,_acao text) RETURNS SETOF public.licencas_nacionais LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.licencas_nacionais; previous jsonb; n integer:=0;
BEGIN
 IF NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Somente a desenvolvedora pode gerenciar licenças'; END IF;
 IF _acao NOT IN ('mensal','anual','bloquear') OR char_length(_email)>254 OR _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Dados inválidos'; END IF;
 FOR l IN SELECT * FROM public.licencas_nacionais WHERE lower(email_cliente)=lower(btrim(_email)) FOR UPDATE LOOP
  previous:=to_jsonb(l);
  UPDATE public.licencas_nacionais SET status=CASE WHEN _acao='bloquear' THEN 'bloqueado' ELSE 'pago' END,tipo_plano=CASE WHEN _acao='bloquear' THEN tipo_plano ELSE _acao END,ultimo_pagamento=CASE WHEN _acao='bloquear' THEN ultimo_pagamento ELSE now() END,data_expira=CASE WHEN _acao='bloquear' THEN data_expira ELSE now()+CASE WHEN _acao='anual' THEN interval '365 days' ELSE interval '30 days' END END WHERE id=l.id RETURNING * INTO l;
  INSERT INTO public.log_acoes_master(salon_id,action,reason,performed_by,previous_data) VALUES(l.salao_id,'licenca_'||_acao,'Controle de licença nacional pela desenvolvedora',auth.uid(),previous);
  n:=n+1; RETURN NEXT l;
 END LOOP;
 IF n=0 THEN RAISE EXCEPTION 'Nenhuma licença encontrada para este email; o salão precisa de compra confirmada'; END IF;
END $$;
CREATE FUNCTION public.aceitar_termos_licenca(_salon uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.salons WHERE id=_salon AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Somente a dona pode registrar o aceite'; END IF;
 UPDATE public.licencas_nacionais SET aceitou_termos=true,termos_aceitos_em=coalesce(termos_aceitos_em,now()),termos_aceitos_por=coalesce(termos_aceitos_por,auth.uid()) WHERE salao_id=_salon;
END $$;
REVOKE ALL ON FUNCTION public.verificar_licenca(),public.master_licenca(text,text),public.aceitar_termos_licenca(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.verificar_licenca(),public.master_licenca(text,text),public.aceitar_termos_licenca(uuid) TO authenticated;
COMMENT ON TABLE public.licencas_nacionais IS 'Licença nacional por salão; renovação e bloqueio exclusivos super_admin, sem criar salões fora de compra confirmada.';