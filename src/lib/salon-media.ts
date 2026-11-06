import { supabase } from '@/integrations/supabase/client';

/** Envia foto para a pasta do salão e devolve um endereço de longa duração para exibir (inclusive em páginas públicas). */
export async function uploadSalonPhoto(salonId: string, folder: string, file: File) {
  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const path = `${salonId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from('salon_media').upload(path, file, { contentType: file.type });
  if (up.error) throw up.error;
  const s = await supabase.storage.from('salon_media').createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (s.error || !s.data) throw s.error ?? new Error('Falha ao gerar endereço da foto');
  return s.data.signedUrl;
}
