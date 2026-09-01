import { useCallback, useEffect, useMemo, useState } from 'react';
import { angelegtesFell, ablegen, anlegen, effekte, kaufen, putzeBesitz } from './laden.js';

const KEY_BESITZ = 'cat_besitz';
const KEY_ANGELEGT = 'cat_angelegt';

const lesen = (key, ersatz) => {
  try {
    const roh = localStorage.getItem(key);
    return roh ? JSON.parse(roh) : ersatz;
  } catch {
    return ersatz;
  }
};

const schreiben = (key, wert) => {
  try { localStorage.setItem(key, JSON.stringify(wert)); } catch { /* gesperrt */ }
};

/*
  Besitz und angelegtes Zubehör der Katze.

  Gekauftes bleibt dauerhaft; Anlegen und Ablegen kosten nichts. Der Abzug der
  Münzen läuft über den Aufrufer, damit es genau einen Kontostand gibt.
*/
export default function useKatzenladen(muenzen, setMuenzen, melde) {
  const [besitz, setBesitz] = useState(() => putzeBesitz(lesen(KEY_BESITZ, [])));
  const [angelegt, setAngelegt] = useState(() => {
    const gelesen = lesen(KEY_ANGELEGT, {});
    return gelesen && typeof gelesen === 'object' ? gelesen : {};
  });

  useEffect(() => { schreiben(KEY_BESITZ, besitz); }, [besitz]);
  useEffect(() => { schreiben(KEY_ANGELEGT, angelegt); }, [angelegt]);

  const kaufeUndLege = useCallback((id) => {
    const ergebnis = kaufen({ muenzen, besitz }, id);
    if (!ergebnis.ok) {
      melde?.(ergebnis.grund === 'zu teuer' ? 'Dafür reichen die Münzen noch nicht.' : null);
      return false;
    }
    setMuenzen(ergebnis.muenzen);
    setBesitz(ergebnis.besitz);
    // Frisch Gekauftes gleich anziehen – sonst passiert scheinbar nichts
    setAngelegt((a) => anlegen(ergebnis.besitz, a, id));
    return true;
  }, [muenzen, besitz, setMuenzen, melde]);

  const umschalten = useCallback((id) => {
    setAngelegt((a) => (
      (id === a.fell || a[id]) ? ablegen(a, id) : anlegen(besitz, a, id)
    ));
  }, [besitz]);

  // Wirkung der gekauften Ausstattung – von useCatNeeds gelesen. Eigenes
  // useMemo, damit die Kennung stabil bleibt und dort keine Effekte neu starten.
  const wirkung = useMemo(() => effekte(besitz), [besitz]);

  return useMemo(() => ({
    besitz,
    angelegt,
    wirkung,
    fellVariante: angelegtesFell(angelegt),
    kaufeUndLege,
    umschalten,
  }), [besitz, angelegt, wirkung, kaufeUndLege, umschalten]);
}
