ALTER TABLE public.salons ADD COLUMN foto_dona_url text NOT NULL DEFAULT '';
CREATE OR REPLACE FUNCTION public.save_owner_photo(_salon uuid, _url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.owns_salon(_salon) AND NOT public.has_role(auth.uid(), 'super_admin') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF length(_url) > 2000 THEN RAISE EXCEPTION 'Endereço inválido'; END IF;
  UPDATE salons SET foto_dona_url = coalesce(_url, '') WHERE id = _salon;
END $$;
REVOKE ALL ON FUNCTION public.save_owner_photo(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.save_owner_photo(uuid, text) TO authenticated;