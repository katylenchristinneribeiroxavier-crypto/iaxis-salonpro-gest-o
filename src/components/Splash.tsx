import { useEffect, useState } from 'react';

export function Splash({ logoUrl, alt = 'iAxis' }: { logoUrl?: string; alt?: string }) {
  const [show, setShow] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    try { if (sessionStorage.getItem('splash-seen')) return; } catch { /* unavailable storage still permits dismissal */ }
    setShow(true);
    const t1 = setTimeout(() => setFadeIn(true), 50);
    const t2 = setTimeout(() => {
      setShow(false);
      try { sessionStorage.setItem('splash-seen', '1'); } catch { /* ignore */ }
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy" role="status" aria-label="Carregando">
      <img
        src={logoUrl ?? '/icons/icon-512.png'}
        alt={alt}
        width={220}
        height={220}
        className={`rounded-2xl transition-opacity duration-700 motion-reduce:transition-none ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
