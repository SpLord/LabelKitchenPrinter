import { useEffect, useState } from 'react';

const K = { fill: 'none', stroke: '#2f2a26', strokeWidth: 3.2, strokeLinecap: 'round', strokeLinejoin: 'round' };

/*
  Echtes Vollbild per Fullscreen-API: blendet Adress- und Tableisten aus.
  Nur sichtbar, wo der Browser es kann (auf iPhones etwa nicht). Mit Esc oder
  dem Knopf wieder zurück.
*/
export default function Vollbild() {
  const kann = typeof document !== 'undefined' && document.fullscreenEnabled;
  const [an, setAn] = useState(() => Boolean(document.fullscreenElement));
  useEffect(() => {
    const wechsel = () => setAn(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', wechsel);
    return () => document.removeEventListener('fullscreenchange', wechsel);
  }, []);
  if (!kann) return null;
  const umschalten = () => {
    const p = an ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    // Abgelehnt (z. B. ohne Nutzergeste) ist kein Fehler – es bleibt einfach, wie es ist
    p?.catch?.(() => {});
  };
  return (
    <button className="zimmer-knopf zimmer-vollbild" onClick={umschalten} aria-pressed={an}
            aria-label={an ? 'Vollbild beenden' : 'Vollbild'}>
      <svg viewBox="-12 -12 24 24" aria-hidden="true">
        {an
          ? <g {...K}><path d="M-9 -4 h5 v-5 M9 -4 h-5 v-5 M-9 4 h5 v5 M9 4 h-5 v5" /></g>
          : <g {...K}><path d="M-9 -4 v-5 h5 M9 -4 v-5 h-5 M-9 4 v5 h5 M9 4 v5 h-5" /></g>}
      </svg>
    </button>
  );
}
