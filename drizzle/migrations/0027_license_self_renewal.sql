ALTER TABLE public.licencas_nacionais ADD COLUMN IF NOT EXISTS bloqueado_por_expiracao boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.sync_purchase_license() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.salons; r public.subscription_requests;
BEGIN
 IF TG_TABLE_NAME='salons' THEN s:=NEW; SELECT * INTO r FROM public.subscription_requests WHERE status='confirmado' AND (user_id=s.owner_id OR lower(email)=(SELECT lower(email) FROM public.profiles WHERE id=s.owner_id)) ORDER BY created_at DESC LIMIT 1;
 ELSE
  IF NEW.status<>'confirmado' OR (TG_OP='UPDATE' AND OLD.status='confirmado') THEN RETURN NEW; END IF;
  r:=NEW; SELECT * INTO s FROM public.salons WHERE owner_id=r.user_id OR owner_id=(SELECT id FROM public.profiles WHERE lower(email)=lower(r.email) LIMIT 1) LIMIT 1;
 END IF;
 IF s.id IS NULL OR r.id IS NULL THEN RETURN NEW; END IF;
 INSERT INTO public.licencas_nacionais(salao_id,email_cliente,data_inicio,data_expira,status,tipo_plano,ultimo_pagamento,aceitou_termos)
 VALUES(s.id,r.email,coalesce(r.confirmed_at,now()),CASE WHEN r.is_test_purchase THEN coalesce(r.trial_ends_at,now()+interval '7 days') ELSE now()+CASE WHEN r.billing='anual' THEN interval '365 days' ELSE interval '30 days' END END,'liberado',r.billing,CASE WHEN r.is_test_purchase THEN NULL ELSE now() END,r.aceitou_termos)
 ON CONFLICT(salao_id) DO UPDATE SET email_cliente=excluded.email_cliente,data_expira=excluded.data_expira,
  status=CASE WHEN licencas_nacionais.status='bloqueado' AND NOT licencas_nacionais.bloqueado_por_expiracao THEN 'bloqueado' ELSE 'liberado' END,
  bloqueado_por_expiracao=CASE WHEN licencas_nacionais.status='bloqueado' AND NOT licencas_nacionais.bloqueado_por_expiracao THEN false ELSE false END,
  tipo_plano=excluded.tipo_plano,ultimo_pagamento=excluded.ultimo_pagamento,aceitou_termos=licencas_nacionais.aceitou_termos OR excluded.aceitou_termos;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_purchase_license() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.verificar_licenca() RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid; l public.licencas_nacionais;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 IF public.has_role(auth.uid(),'super_admin') THEN RETURN jsonb_build_object('permitido',true,'master',true); END IF;
 SELECT id INTO s FROM public.salons WHERE owner_id=auth.uid() LIMIT 1;
 IF s IS NULL THEN SELECT salon_id INTO s FROM public.salon_members WHERE user_id=auth.uid() LIMIT 1; END IF;
 IF s IS NULL THEN RETURN jsonb_build_object('permitido',true,'sem_salao',true); END IF;
 UPDATE public.licencas_nacionais SET status='bloqueado',bloqueado_por_expiracao=true WHERE salao_id=s AND status IN ('liberado','pago') AND NOT public.licenca_valida(s);
 SELECT * INTO l FROM public.licencas_nacionais WHERE salao_id=s;
 RETURN jsonb_build_object('permitido',public.licenca_valida(s),'licenca',to_jsonb(l));
END $$;
REVOKE ALL ON FUNCTION public.verificar_licenca() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verificar_licenca() TO authenticated;

CREATE OR REPLACE FUNCTION public.master_licenca(_email text,_acao text) RETURNS SETOF public.licencas_nacionais LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.licencas_nacionais; previous jsonb; n integer:=0;
BEGIN
 IF NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Somente a desenvolvedora pode gerenciar licenças'; END IF;
 IF _acao NOT IN ('mensal','anual','bloquear') OR char_length(_email)>254 OR _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Dados inválidos'; END IF;
 FOR l IN SELECT * FROM public.licencas_nacionais WHERE lower(email_cliente)=lower(btrim(_email)) FOR UPDATE LOOP
  previous:=to_jsonb(l);
  UPDATE public.licencas_nacionais SET status=CASE WHEN _acao='bloquear' THEN 'bloqueado' ELSE 'liberado' END,bloqueado_por_expiracao=false,tipo_plano=CASE WHEN _acao='bloquear' THEN tipo_plano ELSE _acao END,ultimo_pagamento=CASE WHEN _acao='bloquear' THEN ultimo_pagamento ELSE now() END,data_expira=CASE WHEN _acao='bloquear' THEN data_expira ELSE now()+CASE WHEN _acao='anual' THEN interval '365 days' ELSE interval '30 days' END END WHERE id=l.id RETURNING * INTO l;
  INSERT INTO public.log_acoes_master(salon_id,action,reason,performed_by,previous_data) VALUES(l.salao_id,'licenca_'||_acao,'Controle de licença nacional pela desenvolvedora',auth.uid(),previous);
  n:=n+1; RETURN NEXT l;
 END LOOP;
 IF n=0 THEN RAISE EXCEPTION 'Nenhuma licença encontrada para este email; o salão precisa de compra confirmada'; END IF;
END $$;