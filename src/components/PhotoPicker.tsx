import { Camera, Image as ImageIcon } from 'lucide-react';

/** Dois botões grandes: abrir câmera do celular na hora ou escolher da galeria/WhatsApp. */
export function PhotoPicker({ onFile, label = 'Tirar foto', facing = 'environment', busy = false }: { onFile: (f: File) => void; label?: string; facing?: 'user' | 'environment'; busy?: boolean }) {
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f); };
  const big = 'inline-flex min-h-14 flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl px-5 py-3 text-base font-semibold';
  return <div className="flex w-full flex-col gap-3 sm:flex-row" aria-busy={busy}>
    <label className={`${big} bg-gradient-gold text-primary-foreground`}><Camera className="h-7 w-7" />📷 {label}
      <input type="file" accept="image/*" capture={facing} className="sr-only" onChange={pick} /></label>
    <label className={`${big} border border-gold/50 text-gold`}><ImageIcon className="h-7 w-7" />🖼️ Escolher da Galeria / WhatsApp
      <input type="file" accept="image/*" className="sr-only" onChange={pick} /></label>
  </div>;
}
