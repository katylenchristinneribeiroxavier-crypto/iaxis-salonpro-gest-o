CREATE POLICY salon_media_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'salon_media' AND public.manages_salon(((storage.foldername(name))[1])::uuid));