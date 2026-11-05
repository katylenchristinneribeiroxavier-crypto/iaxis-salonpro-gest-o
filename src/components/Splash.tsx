import { useEffect, useState } from 'react';

export function Splash({ logoUrl, alt = 'iAxis' }: { logoUrl?: string; alt?: string }) {
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem('splash-seen'); } catch { return true; }
  });
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!show) return;
    const t1 = setTimeout(() => setFadeIn(true), 50);
    const t2 = setTimeout(() => {
      setShow(false);
      try { sessionStorage.setItem('splash-seen', '1'); } catch { /* ignore */ }
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show]);

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center" style={{ backgroundColor: '#0A1931' }} role="status" aria-label="Carregando">
      <img
        src={logoUrl ?? '/icons/icon-512.png'}
        alt={alt}
        width={220}
        height={220}
        className="rounded-2xl transition-opacity duration-700"
        style={{ opacity: fadeIn ? 1 : 0 }}
      />
    </div>
  );
}
