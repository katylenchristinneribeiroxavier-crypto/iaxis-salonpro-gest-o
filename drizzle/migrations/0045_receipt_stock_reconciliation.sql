CREATE FUNCTION public.apply_receipt_stock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.products; q numeric;
BEGIN
 IF NEW.categoria NOT IN ('Produtos','Materiais descartáveis') OR NEW.quantidade IS NULL OR NEW.quantidade<=0 THEN RETURN NEW; END IF;
 SELECT * INTO p FROM public.products WHERE salon_id=NEW.salon_id AND lower(trim(nome))=lower(trim(NEW.descricao));
 IF NOT FOUND OR NEW.unidade IS NULL THEN RETURN NEW; END IF;
 q:=NEW.quantidade;
 IF NEW.unidade='L' OR NEW.unidade='litro' THEN q:=q*1000; NEW.unidade:='ml'; END IF;
 IF NEW.unidade='kg' THEN q:=q*1000; NEW.unidade:='g'; END IF;
 IF p.unidade<>NEW.unidade THEN RETURN NEW; END IF;
 INSERT INTO public.stock_movements(salon_id,product_id,tipo,quantidade,motivo,created_by) VALUES(NEW.salon_id,p.id,'entrada',q,'Compra por comprovante '||NEW.id,auth.uid());
 UPDATE public.products SET quantidade_atual=quantidade_atual+q,custo_unitario=round(NEW.valor/q,6) WHERE id=p.id AND salon_id=NEW.salon_id;
 RETURN NEW;
END $$;
CREATE TRIGGER receipt_stock AFTER INSERT ON public.despesas_salao FOR EACH ROW EXECUTE FUNCTION public.apply_receipt_stock();