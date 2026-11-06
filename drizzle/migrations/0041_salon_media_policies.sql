CREATE POLICY salon_media_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'salon_media' AND public.manages_salon(((storage.foldername(name))[1])::uuid));
CREATE POLICY salon_media_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'salon_media' AND public.manages_salon(((storage.foldername(name))[1])::uuid));
CREATE POLICY salon_media_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'salon_media' AND public.manages_salon(((storage.foldername(name))[1])::uuid));