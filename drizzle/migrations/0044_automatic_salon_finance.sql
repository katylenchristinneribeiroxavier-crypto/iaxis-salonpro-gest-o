ALTER TABLE public.appointments ADD COLUMN payment_received_at timestamptz;
ALTER TABLE public.stock_movements ADD COLUMN custo_total numeric NOT NULL DEFAULT 0;
ALTER TABLE public.despesas_salao ADD COLUMN professional_id uuid, ADD COLUMN arquivo_path text NOT NULL DEFAULT '', ADD COLUMN documento_hash text, ADD COLUMN item_index integer, ADD COLUMN fornecedor text NOT NULL DEFAULT '', ADD COLUMN quantidade numeric, ADD COLUMN unidade text;
ALTER TABLE public.professionals ADD CONSTRAINT professionals_id_salon_unique UNIQUE(id,salon_id);
ALTER TABLE public.despesas_salao ADD CONSTRAINT expense_professional_salon_fk FOREIGN KEY(professional_id,salon_id) REFERENCES public.professionals(id,salon_id);
CREATE UNIQUE INDEX salon_expense_document_item ON public.despesas_salao(salon_id,documento_hash,item_index) WHERE documento_hash IS NOT NULL;
CREATE TABLE public.salon_finance_ai_state(salon_id uuid PRIMARY KEY REFERENCES public.salons(id) ON DELETE CASCADE, paused_reason text NOT NULL DEFAULT '', pause_status integer, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.salon_finance_ai_state TO authenticated;
GRANT ALL ON public.salon_finance_ai_state TO service_role;
ALTER TABLE public.salon_finance_ai_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY finance_ai_read ON public.salon_finance_ai_state FOR SELECT TO authenticated USING(public.manages_salon(salon_id));
CREATE POLICY receipts_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='salon-receipts' AND public.manages_salon((storage.foldername(name))[1]::uuid));
CREATE POLICY receipts_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='salon-receipts' AND public.manages_salon((storage.foldername(name))[1]::uuid));
CREATE POLICY receipts_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='salon-receipts' AND public.manages_salon((storage.foldername(name))[1]::uuid));
CREATE FUNCTION public.stamp_appointment_payment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.payment_status='pago' THEN
   IF NOT public.manages_salon(NEW.salon_id) THEN RAISE EXCEPTION 'Somente a gestão confirma recebimentos'; END IF;
   NEW.payment_received_at:=now();
  ELSE NEW.payment_received_at:=NULL; END IF;
 ELSE
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
   IF NOT public.manages_salon(NEW.salon_id) THEN RAISE EXCEPTION 'Somente a gestão confirma recebimentos'; END IF;
   NEW.payment_received_at:=CASE WHEN NEW.payment_status='pago' THEN now() ELSE NULL END;
  ELSE NEW.payment_received_at:=OLD.payment_received_at; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER payment_stamp BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.stamp_appointment_payment();
CREATE FUNCTION public.snapshot_stock_cost() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 SELECT round(NEW.quantidade*custo_unitario,2) INTO NEW.custo_total FROM public.products WHERE id=NEW.product_id AND salon_id=NEW.salon_id;
 RETURN NEW;
END $$;
CREATE TRIGGER stock_cost_snapshot BEFORE INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.snapshot_stock_cost();
CREATE FUNCTION public.salon_financial_month(_salon uuid,_month text,_professional uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m0 timestamptz; m1 timestamptz; d0 date; d1 date; manager boolean; revenue numeric; commissions numeric; expenses numeric; advances numeric; stock numeric; products_bought numeric;
BEGIN
 IF _month !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN RAISE EXCEPTION 'Mês inválido'; END IF;
 manager:=public.manages_salon(_salon);
 IF NOT manager THEN
  IF _professional IS NULL OR NOT public.salon_access_allowed(_salon) OR NOT EXISTS(SELECT 1 FROM public.salon_members WHERE salon_id=_salon AND user_id=auth.uid() AND professional_id=_professional) THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
 END IF;
 d0:=(_month||'-01')::date; d1:=(d0+interval '1 month')::date; m0:=d0::timestamp AT TIME ZONE 'America/Sao_Paulo'; m1:=d1::timestamp AT TIME ZONE 'America/Sao_Paulo';
 SELECT coalesce(sum(price),0),coalesce(sum(commission_amount),0) INTO revenue,commissions FROM public.appointments WHERE salon_id=_salon AND status='finalizado' AND payment_status='pago' AND coalesce(payment_received_at,starts_at)>=m0 AND coalesce(payment_received_at,starts_at)<m1 AND (_professional IS NULL OR professional_id=_professional);
 SELECT coalesce(sum(valor) FILTER(WHERE categoria<>'Adiantamento de funcionários'),0),coalesce(sum(valor) FILTER(WHERE categoria='Adiantamento de funcionários'),0),coalesce(sum(valor) FILTER(WHERE categoria IN ('Produtos','Produtos e insumos','Materiais descartáveis')),0) INTO expenses,advances,products_bought FROM public.despesas_salao WHERE salon_id=_salon AND data_despesa>=d0 AND data_despesa<d1 AND (_professional IS NULL OR professional_id=_professional);
 SELECT coalesce(sum(custo_total),0) INTO stock FROM public.stock_movements WHERE salon_id=_salon AND tipo IN ('saida_uso','perda') AND created_at>=m0 AND created_at<m1;
 RETURN jsonb_build_object('month',_month,'closed',d1<=(now() AT TIME ZONE 'America/Sao_Paulo')::date,'revenue',CASE WHEN manager THEN revenue ELSE NULL END,'commissions',commissions,'expenses',CASE WHEN manager THEN expenses ELSE NULL END,'advances',advances,'receivable',greatest(commissions-advances,0),'stock_cost',CASE WHEN manager THEN stock ELSE NULL END,'cash_profit',CASE WHEN manager THEN revenue-commissions-expenses ELSE NULL END,'operating_profit',CASE WHEN manager THEN revenue-commissions-(expenses-products_bought)-stock ELSE NULL END,
 'rows',coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'starts_at',a.starts_at,'received_at',coalesce(a.payment_received_at,a.starts_at),'client_name',a.client_name,'professional_id',a.professional_id,'professional',p.name,'price',a.price,'applied_commission_pct',a.applied_commission_pct,'commission_amount',a.commission_amount,'salon_amount',CASE WHEN manager THEN a.salon_amount ELSE NULL END) ORDER BY coalesce(a.payment_received_at,a.starts_at)) FROM public.appointments a JOIN public.professionals p ON p.id=a.professional_id WHERE a.salon_id=_salon AND a.status='finalizado' AND a.payment_status='pago' AND coalesce(a.payment_received_at,a.starts_at)>=m0 AND coalesce(a.payment_received_at,a.starts_at)<m1 AND (_professional IS NULL OR a.professional_id=_professional)),'[]'::jsonb),
 'expense_rows',CASE WHEN manager THEN coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY data_despesa DESC) FROM public.despesas_salao e WHERE salon_id=_salon AND data_despesa>=d0 AND data_despesa<d1),'[]'::jsonb) ELSE '[]'::jsonb END,
 'professionals',CASE WHEN manager THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'commission',coalesce((SELECT sum(commission_amount) FROM public.appointments WHERE professional_id=p.id AND salon_id=_salon AND status='finalizado' AND payment_status='pago' AND coalesce(payment_received_at,starts_at)>=m0 AND coalesce(payment_received_at,starts_at)<m1),0),'advance',coalesce((SELECT sum(valor) FROM public.despesas_salao WHERE professional_id=p.id AND salon_id=_salon AND categoria='Adiantamento de funcionários' AND data_despesa>=d0 AND data_despesa<d1),0))) FROM public.professionals p WHERE salon_id=_salon),'[]'::jsonb) ELSE '[]'::jsonb END);
END $$;
REVOKE ALL ON FUNCTION public.salon_financial_month(uuid,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.salon_financial_month(uuid,text,uuid) TO authenticated;
CREATE FUNCTION public.staff_financial_month(_token uuid,_month text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.professionals; d0 date; d1 date; m0 timestamptz; m1 timestamptz; c numeric; ad numeric;
BEGIN
 SELECT * INTO p FROM public.professionals WHERE portal_token=_token;
 IF NOT FOUND OR NOT public.salon_access_allowed(p.salon_id) THEN RAISE EXCEPTION 'Link inválido ou salão indisponível'; END IF;
 IF _month !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN RAISE EXCEPTION 'Mês inválido'; END IF;
 d0:=(_month||'-01')::date; d1:=(d0+interval '1 month')::date; m0:=d0::timestamp AT TIME ZONE 'America/Sao_Paulo'; m1:=d1::timestamp AT TIME ZONE 'America/Sao_Paulo';
 SELECT coalesce(sum(commission_amount),0) INTO c FROM public.appointments WHERE salon_id=p.salon_id AND professional_id=p.id AND status='finalizado' AND payment_status='pago' AND coalesce(payment_received_at,starts_at)>=m0 AND coalesce(payment_received_at,starts_at)<m1;
 SELECT coalesce(sum(valor),0) INTO ad FROM public.despesas_salao WHERE salon_id=p.salon_id AND professional_id=p.id AND categoria='Adiantamento de funcionários' AND data_despesa>=d0 AND data_despesa<d1;
 RETURN jsonb_build_object('commission',c,'advances',ad,'receivable',greatest(c-ad,0),'rows',coalesce((SELECT jsonb_agg(jsonb_build_object('starts_at',a.starts_at,'received_at',coalesce(a.payment_received_at,a.starts_at),'service',s.name,'client_name',a.client_name,'commission',a.commission_amount,'percentage',a.applied_commission_pct) ORDER BY coalesce(a.payment_received_at,a.starts_at)) FROM public.appointments a LEFT JOIN public.services s ON s.id=a.service_id WHERE a.salon_id=p.salon_id AND a.professional_id=p.id AND a.status='finalizado' AND a.payment_status='pago' AND coalesce(a.payment_received_at,a.starts_at)>=m0 AND coalesce(a.payment_received_at,a.starts_at)<m1),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.staff_financial_month(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_financial_month(uuid,text) TO anon,authenticated;
CREATE FUNCTION public.record_salon_receipt(_salon uuid,_hash text,_path text,_items jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; idx integer:=0; pid uuid; r public.despesas_salao; ids uuid[]:='{}';
BEGIN
 IF NOT public.manages_salon(_salon) OR split_part(_path,'/',1)<>_salon::text THEN RAISE EXCEPTION 'Acesso restrito'; END IF;
 IF EXISTS(SELECT 1 FROM public.despesas_salao WHERE salon_id=_salon AND documento_hash=_hash) THEN RAISE EXCEPTION 'Este comprovante já foi registrado'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(_items) LOOP
  IF (item->>'valor')::numeric<=0 THEN RAISE EXCEPTION 'Valor ilegível: envie uma foto nítida'; END IF;
  pid:=NULL;
  SELECT id INTO pid FROM public.professionals WHERE salon_id=_salon AND lower(trim(name))=lower(trim(item->>'professional_name'));
  INSERT INTO public.despesas_salao(salon_id,categoria,descricao,valor,data_despesa,professional_id,arquivo_path,documento_hash,item_index,fornecedor,quantidade,unidade)
  VALUES(_salon,item->>'categoria',item->>'descricao',round((item->>'valor')::numeric,2),coalesce((item->>'data')::date,(now() AT TIME ZONE 'America/Sao_Paulo')::date),pid,_path,_hash,idx,coalesce(item->>'fornecedor',''),(item->>'quantidade')::numeric,item->>'unidade') RETURNING * INTO r;
  ids:=array_append(ids,r.id); idx:=idx+1;
 END LOOP;
 IF idx=0 THEN RAISE EXCEPTION 'Nenhuma despesa legível'; END IF;
 RETURN to_jsonb(ids);
END $$;
REVOKE ALL ON FUNCTION public.record_salon_receipt(uuid,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_salon_receipt(uuid,text,text,jsonb) TO authenticated;