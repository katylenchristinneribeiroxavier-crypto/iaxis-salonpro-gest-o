CREATE TABLE public.despesas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 tipo text NOT NULL DEFAULT 'recibo',
 fornecedor text NOT NULL DEFAULT '',
 data_documento date,
 valor numeric NOT NULL DEFAULT 0,
 categoria text NOT NULL DEFAULT 'Outros',
 descricao text NOT NULL DEFAULT '',
 numero_documento text NOT NULL DEFAULT '',
 arquivo_path text NOT NULL,
 arquivo_nome text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas TO authenticated;
GRANT ALL ON public.despesas TO service_role;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY despesas_own ON public.despesas FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX despesas_user_idx ON public.despesas(user_id, created_at DESC);
CREATE POLICY comprovantes_own_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='comprovantes' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY comprovantes_own_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='comprovantes' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY comprovantes_own_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id='comprovantes' AND (storage.foldername(name))[1]=auth.uid()::text);