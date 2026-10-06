
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import './styles.css';
import ErrorBoundary from './ErrorBoundary.jsx';
import LabelEditor from './LabelEditor.jsx';
import useEtiketten from './labels/useEtiketten.js';
import {
  KEY_DRUCKER, MAX_ANZAHL, MIN_ANZAHL,
  begrenzeAnzahl, drucke, druckerNamen, waehleDrucker,
} from './print/drucker.js';
import { datumsText, verwendbarBis } from './print/etikett.js';
import { meldeDruckfehler } from './fehler/bugsink.js';

/*
  Das Katzenzimmer (Design 2026-10-06) als eigener, nachgeladener Teil: Karte
  und Katze in der Kopfleiste, das Zimmer als Vollbild darüber. Das alte
  Spiel (CatSprite, Spielzeug-Overlay, Laser) ist mit Etappe 8 entfernt.
*/
const ZimmerModus = lazy(() => import('./zimmer/ZimmerModus.jsx'));
import useSchichtDatum from './print/useSchichtDatum.js';

export default function App() {
  const [input, setInput] = useState('');
  const [printerStatus, setPrinterStatus] = useState('checking');
  const [printerName, setPrinterName] = useState(null);
  const [drucker, setDrucker] = useState([]);          // alle gefundenen
  const [anzahl, setAnzahl] = useState(MIN_ANZAHL);    // Etiketten je Druck
  const [previewSrc, setPreviewSrc] = useState(null);
  const [error, setError] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const merkeDruckerRef = useRef(() => {});

  const errorTimerRef = useRef(null);
  const previewTimerRef = useRef(null);

  // Nicht-blockierende Fehlermeldung (ersetzt alert() – blockiert den Küchenbetrieb nicht)
  const showError = (msg) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 6000);
  };

  // Etiketten lokal und geteilt (src/labels/useEtiketten.js)
  const { groups, zustand: speicherZustand, aendern: updateGroups } = useEtiketten(showError);

  useEffect(() => () => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
  }, []);

  /*
    Etikettendatum. Vorher einmal beim Laden berechnet – ein Tablet, das über
    Nacht anblieb, druckte morgens das Vortagsdatum. Jetzt wird beim Druck
    frisch aus der Uhr bestimmt (src/print/schicht.js).
  */
  const etikettDatum = useSchichtDatum();
  // Zuletzt gezeigte Vorschau, damit ein Datumswechsel genau sie neu rendert
  const letzteVorschauRef = useRef({ text: '', tage: null });

  // Druckerstatus prüfen (DYMO)
  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;
    let missingFrameworkPolls = 0;
    const GRACE_POLLS = 4; // ~20 s Karenz, bevor wir 'offline' melden

    const goOffline = () => {
      setPrinterStatus('offline');
      setPrinterName(null);
    };

    const merkeDrucker = (name) => {
      try { localStorage.setItem(KEY_DRUCKER, name); } catch { /* gesperrt */ }
    };
    merkeDruckerRef.current = merkeDrucker;

    const tryInitDymo = () => {
      if (cancelled) return;

      // Das Framework wird per <script> geladen und kann später auftauchen als React.
      // Früher gab es hier kein Polling – der Status blieb dann für immer auf 'checking'.
      const framework = window?.dymo?.label?.framework;
      if (!framework) {
        missingFrameworkPolls += 1;
        if (missingFrameworkPolls > GRACE_POLLS) goOffline();
        return;
      }
      missingFrameworkPolls = 0;

      try {
        framework.init();
        const namen = druckerNamen(framework.getPrinters());
        if (cancelled) return;
        if (namen.length > 0) {
          setPrinterStatus('online');
          setDrucker(namen);
          // Die gemerkte Wahl gewinnt, solange das Gerät angeschlossen ist.
          let gemerkt = null;
          try { gemerkt = localStorage.getItem(KEY_DRUCKER); } catch { /* gesperrt */ }
          setPrinterName((bisher) => waehleDrucker(namen, bisher ?? gemerkt));
        } else {
          setDrucker([]);
          goOffline();
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.message?.includes('service discovery is in progress')) {
          retryTimer = setTimeout(tryInitDymo, 500);
        } else {
          goOffline();
        }
      }
    };

    tryInitDymo();
    const interval = setInterval(tryInitDymo, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const printLabel = (text, tage = null) => {
    if (!text) return showError('Bitte Text eingeben.');

    const framework = window?.dymo?.label?.framework;
    if (!framework) {
      setPrinterStatus('offline');
      return showError('Drucker-Framework nicht geladen – bitte Seite neu laden.');
    }

    fetch('/labels/Label_32x57.label')
      .then(res => {
        if (!res.ok) throw new Error(`Label-Vorlage nicht ladbar (HTTP ${res.status})`);
        return res.text();
      })
      .then(labelXml => {
        const label = framework.openLabelXml(labelXml);
        label.setObjectText("Name", text);
        label.setObjectText("Datum", datumsText(etikettDatum.fuerDruck(), tage));

        const ziel = printerName || "DYMO LabelWriter 450";
        // Scheitert der Kopien-Parameter, wird einzeln gedruckt statt gar nicht
        const ergebnis = drucke(label, ziel, framework, anzahl);
        if (ergebnis.rueckfall) {
          console.warn('[druck] Kopien-Parameter abgelehnt, einzeln gedruckt:', ergebnis.grund);
        }
        if (ergebnis.offen > 0) {
          // Wichtig ist die Zahl: der Rest muss nachgedruckt werden, nicht alles.
          const gesamt = ergebnis.gedruckt + ergebnis.offen;
          meldeDruckfehler(ergebnis.grund, {
            gedruckt: ergebnis.gedruckt, offen: ergebnis.offen, rueckfall: ergebnis.rueckfall, drucker: ziel,
          });
          showError(
            `Nur ${ergebnis.gedruckt} von ${gesamt} Etiketten gedruckt – ` +
            `${ergebnis.offen} fehlen noch (${ergebnis.grund}).`
          );
        }
      })
      .catch(err => {
        // Erwartbare Zustände wie "Framework nicht geladen" kommen gar nicht
        // hierher (siehe oben). Was hier landet, ist ein echter Fehlschlag.
        meldeDruckfehler(err?.message || String(err), { anzahl, drucker: printerName || null });
        showError('Fehler beim Drucken: ' + (err?.message || err));
      });
  };

  const generatePreview = (text, tage = null) => {
    letzteVorschauRef.current = { text, tage };
    const framework = window?.dymo?.label?.framework;
    if (!text || !framework) {
      setPreviewSrc(null);
      return;
    }

    fetch('/labels/Label_32x57.label')
      .then(res => {
        if (!res.ok) throw new Error('Label-Vorlage nicht ladbar');
        return res.text();
      })
      .then(labelXml => {
        const label = framework.openLabelXml(labelXml);
        label.setObjectText("Name", text);
        label.setObjectText("Datum", datumsText(etikettDatum.fuerDruck(), tage));
        const base64 = label.render();
        setPreviewSrc(`data:image/png;base64,${base64}`);
      })
      .catch(() => setPreviewSrc(null));
  };

  // Tippen erzeugte pro Zeichen einen fetch + DYMO-Render – jetzt entprellt
  const schedulePreview = (text) => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => generatePreview(text), 250);
  };

  return (
    <>
      {/* Spielerei isoliert: stürzt sie ab, druckt die App trotzdem weiter */}
      <ErrorBoundary label="Das Katzenzimmer" silent>
        <Suspense fallback={null}><ZimmerModus /></Suspense>
      </ErrorBoundary>
      {editorOpen && (
        <ErrorBoundary label="Der Etiketten-Editor">
          <LabelEditor
            groups={groups}
            onChange={updateGroups}
            onClose={() => setEditorOpen(false)}
            speicherZustand={speicherZustand}
          />
        </ErrorBoundary>
      )}

      <header className="app-bar">
        <div className="status-indicator">
          {printerStatus === 'checking' && <span>🔄 Drucker wird erkannt…</span>}
          {printerStatus === 'online' && (
            <span className="online">✅ Drucker bereit: {printerName}</span>
          )}
          {printerStatus === 'offline' && (
            <span className="offline">❌ Kein Drucker gefunden</span>
          )}
        </div>
        {drucker.length > 1 && (
          <label className="drucker-wahl">
            <span className="drucker-wahl-text">Drucker</span>
            <select
              value={printerName ?? ''}
              onChange={(e) => {
                setPrinterName(e.target.value);
                merkeDruckerRef.current(e.target.value);
              }}
            >
              {drucker.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        )}
        <button className="edit-toggle" onClick={() => setEditorOpen(true)}>
          ✏️ Etiketten bearbeiten
        </button>
      </header>
      {error && (
        <div className="print-error" role="alert" onClick={() => setError(null)}>
          ⚠️ {error}
        </div>
      )}

      <div className="main-layout">
        <aside className="side-rail">
          <div className={`preview-section ${previewSrc ? '' : 'empty'}`}>
            {previewSrc
              ? <img src={previewSrc} alt="Vorschau" />
              : <span className="preview-hint">Vorschau</span>}
          </div>

          <div className="date-section">
            <DatePicker
              selected={etikettDatum.datum}
              onChange={(date) => {
                etikettDatum.waehlen(date);
                // Genau das zuletzt gezeigte Etikett neu – samt Haltbarkeit,
                // die hier früher verloren ging
                const { text, tage } = letzteVorschauRef.current;
                generatePreview(text || input, tage);
              }}
              inline
              calendarClassName="custom-datepicker"
            />
            {/* Ein abweichendes Datum muss auffallen: es landet auf Lebensmitteln */}
            <div className={`date-current ${etikettDatum.abweichend ? 'abweichend' : ''}`}>
              📅 {etikettDatum.datum.toLocaleDateString("de-DE")}
              {etikettDatum.abweichend && (
                <>
                  <span className="date-hinweis">nicht heute</span>
                  <button
                    className="date-zurueck"
                    onClick={() => {
                      etikettDatum.zuruecksetzen();
                      const { text, tage } = letzteVorschauRef.current;
                      generatePreview(text || input, tage);
                    }}
                  >
                    auf heute
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="anzahl-wahl">
            <span className="anzahl-titel">Etiketten je Druck</span>
            <div className="anzahl-steuerung">
              <button
                className="anzahl-knopf"
                onClick={() => setAnzahl((n) => begrenzeAnzahl(n - 1))}
                disabled={anzahl <= MIN_ANZAHL}
                aria-label="Eines weniger"
              >−</button>
              <span className="anzahl-wert" aria-live="polite">{anzahl}</span>
              <button
                className="anzahl-knopf"
                onClick={() => setAnzahl((n) => begrenzeAnzahl(n + 1))}
                disabled={anzahl >= MAX_ANZAHL}
                aria-label="Eines mehr"
              >+</button>
            </div>
            {anzahl > MIN_ANZAHL && (
              <button className="anzahl-zurueck" onClick={() => setAnzahl(MIN_ANZAHL)}>
                zurück auf 1
              </button>
            )}
          </div>

          <div className="input-group">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                schedulePreview(e.target.value);
              }}
              placeholder="Individueller Text"
            />
            <button onClick={() => printLabel(input)} disabled={printerStatus !== 'online'}>
              Drucken
            </button>
          </div>
        </aside>

        <div className="button-section">
          {groups.map((group) => (
            <div key={group.id} className="button-group">
              <h3>
                <span className="group-icon" aria-hidden="true">{group.icon}</span>
                {group.name}
                <span className="group-count">{group.entries.length}</span>
              </h3>
              <div className="button-grid">
                {group.entries.map((eintrag, idx) => (
                  <button
                    key={`${group.id}-${idx}`}
                    onClick={() => {
                      printLabel(eintrag.name, eintrag.tage);
                      generatePreview(eintrag.name, eintrag.tage);
                    }}
                    disabled={printerStatus !== 'online'}
                    title={eintrag.tage
                      ? `${eintrag.tage} Tage haltbar – verwendbar bis ${verwendbarBis(etikettDatum.datum, eintrag.tage).toLocaleDateString('de-DE')}`
                      : undefined}
                  >
                    {eintrag.name}
                    {eintrag.tage ? <span className="haltbar-marke">{eintrag.tage} T</span> : null}
                    {anzahl > MIN_ANZAHL && <span className="anzahl-marke">×{anzahl}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="button-section-empty">
              Keine Etiketten angelegt – über &bdquo;Etiketten bearbeiten&quot; hinzufügen.
            </p>
          )}
        </div>

              </div>

      <div className="version-badge" title={`Build: ${__BUILD_TIME__}`}>
        v{__APP_VERSION__}
      </div>
    </>
  );
}
