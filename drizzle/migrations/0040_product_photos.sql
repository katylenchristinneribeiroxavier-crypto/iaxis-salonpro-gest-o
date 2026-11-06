ALTER TABLE public.products ADD COLUMN foto_path text NOT NULL DEFAULT '';
CREATE POLICY product_photos_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product_photos' AND public.manages_salon(((storage.foldername(name))[1])::uuid));
CREATE POLICY product_photos_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product_photos' AND public.manages_salon(((storage.foldername(name))[1])::uuid));
CREATE POLICY product_photos_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product_photos' AND public.manages_salon(((storage.foldername(name))[1])::uuid));
CREATE POLICY product_photos_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product_photos' AND public.manages_salon(((storage.foldername(name))[1])::uuid));