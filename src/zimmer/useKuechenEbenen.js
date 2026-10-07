import { useEffect, useState } from 'react';
import { freieBoeden, freieZone } from './kuechenkatze.js';

const rechteck = (el) => el.getBoundingClientRect();

/* Kategorie-Spalten: Gruppen mit gleichem linken Rand gehören zusammen. */
function spaltenMessen() {
  const nachLinks = new Map();
  const teile = [...document.querySelectorAll('.button-section > .button-group, .side-rail')];
  for (const el of teile) {
    const r = rechteck(el);
    if (!r.width) continue;
    const schluessel = Math.round(r.left);
    const alt = nachLinks.get(schluessel);
    nachLinks.set(schluessel, alt
      ? { left: Math.min(alt.left, r.left), right: Math.max(alt.right, r.right), top: Math.min(alt.top, r.top), bottom: Math.max(alt.bottom, r.bottom) }
      : { left: r.left, right: r.right, top: r.top, bottom: r.bottom });
  }
  return [...nachLinks.values()];
}

/* Alles, worauf sie nie stehen darf, ausser den Spalten selbst. */
const HINDERNISSE = '.version-badge, .print-error, .editor-overlay, .kuechen-karte, .toast, [role="alert"]';

function ebenenMessen() {
  const ebenen = [];
  const kopf = document.querySelector('.app-bar');
  const karte = document.querySelector('.kuechen-karte');
  if (kopf) {
    const teile = [...kopf.children].map(rechteck);
    const z = freieZone({ kopf: rechteck(kopf), teile, karte: karte ? rechteck(karte) : null });
    if (z) ebenen.push({ id: 'kopf', ...z });
  }
  const hindernisse = [...document.querySelectorAll(HINDERNISSE)].map(rechteck).filter((r) => r.width);
  // Der Kopfleiste nie zu nahe: Böden erst darunter
  const unterKopf = kopf ? rechteck(kopf).bottom : 0;
  const boeden = freieBoeden({ fenster: { breite: innerWidth, hoehe: innerHeight }, spalten: spaltenMessen(), hindernisse })
    .filter((b) => b.boden - 100 > unterKopf);
  return [...ebenen, ...boeden];
}

const gleich = (a, b) => a.length === b.length && a.every((e, i) => e.id === b[i].id
  && Math.abs(e.links - b[i].links) < 1 && Math.abs(e.rechts - b[i].rechts) < 1 && Math.abs(e.boden - b[i].boden) < 1);

/*
  Wo die Küchenkatze laufen darf, in Bildschirmkoordinaten: der freie
  Streifen der Kopfleiste und freie Böden unter kürzeren Spalten. Neu
  gemessen bei Scrollen, Grössenänderung und jeder Änderung der Seite.
*/
export default function useKuechenEbenen() {
  const [ebenen, setEbenen] = useState([]);
  useEffect(() => {
    let rahmen = 0;
    const neu = () => {
      cancelAnimationFrame(rahmen);
      rahmen = requestAnimationFrame(() => {
        const e = ebenenMessen();
        setEbenen((alt) => (gleich(alt, e) ? alt : e));
      });
    };
    neu();
    const ro = new ResizeObserver(neu);
    const beobachten = () => {
      ['.app-bar', '.main-layout', '.kuechen-karte'].forEach((s) => { const el = document.querySelector(s); if (el) ro.observe(el); });
    };
    beobachten();
    const mo = new MutationObserver(() => { beobachten(); neu(); });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', neu);
    window.addEventListener('scroll', neu, { passive: true });
    return () => {
      cancelAnimationFrame(rahmen); ro.disconnect(); mo.disconnect();
      window.removeEventListener('resize', neu); window.removeEventListener('scroll', neu);
    };
  }, []);
  return ebenen;
}
