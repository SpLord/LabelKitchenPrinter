
import { useEffect, useRef, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import './styles.css';
import ErrorBoundary from './ErrorBoundary.jsx';
import CatSprite from './CatSprite.jsx';
import PlayOverlay from './PlayOverlay.jsx';
import LabelEditor from './LabelEditor.jsx';
import { loadGroups, saveGroups } from './labels/store.js';

export default function App() {
  const [input, setInput] = useState('');
  const [printerStatus, setPrinterStatus] = useState('checking');
  const [printerName, setPrinterName] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [play, setPlay] = useState(null); // toy target for cat
  const [laserMode, setLaserMode] = useState(false);
  const [laserDragging, setLaserDragging] = useState(false);
  const [suppressSpawn, setSuppressSpawn] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState(loadGroups);
  const [editorOpen, setEditorOpen] = useState(false);

  // Änderungen im Editor sofort persistieren
  const updateGroups = (next) => {
    setGroups(next);
    if (!saveGroups(next)) showError('Etiketten konnten nicht gespeichert werden.');
  };

  const errorTimerRef = useRef(null);
  const previewTimerRef = useRef(null);

  // Nicht-blockierende Fehlermeldung (ersetzt alert() – blockiert den Küchenbetrieb nicht)
  const showError = (msg) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 6000);
  };

  useEffect(() => () => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
  }, []);

  // Vor 5 Uhr zählt der Tag noch zur vorherigen Schicht
  const getEffectiveDate = () => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(5, 0, 0, 0);
    if (now >= cutoff) return now;
    const previous = new Date(now);
    previous.setDate(previous.getDate() - 1);
    return previous;
  };

  const [selectedDate, setSelectedDate] = useState(getEffectiveDate());
  const debugUi = (input || '').trim().toUpperCase() === 'BATCAT';

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
        const printers = framework.getPrinters();
        if (cancelled) return;
        if (printers && printers.length > 0) {
          setPrinterStatus('online');
          setPrinterName(printers[0].name);
        } else {
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

  // Global click to spawn toy when clicking on background areas
  useEffect(() => {
    const handler = (e) => {
  if (suppressSpawn) return; // placement active
  if (laserMode) return; // no spawn while laser active
      // ignore if clicking on interactive or inside main layout/status
      const interactiveTags = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A', 'IMG', 'LABEL']);
      if (interactiveTags.has(e.target.tagName)) return;
      if (
        e.target.closest('.button-group') ||
        e.target.closest('.date-section') ||
        e.target.closest('.preview-section') ||
        e.target.closest('.status-indicator') ||
        e.target.closest('.react-datepicker') ||
        e.target.closest('.custom-datepicker') ||
        e.target.closest('.react-datepicker__month-container') ||
        e.target.closest('.react-datepicker__day') ||
        e.target.closest('.react-datepicker__navigation') ||
        e.target.closest('.app-bar') ||
        e.target.closest('.editor-overlay') ||
        e.target.closest('.version-badge') ||
        e.target.closest('.cat-sprite')
      ) return;
      // viewport click position
      const x = e.clientX;
      const y = e.clientY;
      // spawn ball or mouse (50/50)
      const kind = Math.random() < 0.5 ? 'ball' : 'mouse';
      const id = Date.now();
      setPlay({ id, kind, x, y });
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [laserMode, suppressSpawn]);

  // Laserpointer: folgt nur bei gedrücktem Finger/Zeiger (Drag)
  useEffect(() => {
    if (!laserMode) return;
    const onPointerDown = (e) => {
      setLaserDragging(true);
      setPlay({ id: 'laser', kind: 'laser', x: e.clientX, y: e.clientY });
    };
    const onPointerMove = (e) => {
      if (!laserDragging) return;
      setPlay({ id: 'laser', kind: 'laser', x: e.clientX, y: e.clientY });
    };
    const endLaser = () => {
      setLaserDragging(false);
      setPlay((p) => (p && p.kind === 'laser' ? null : p));
    };
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerup', endLaser, { passive: true });
    document.addEventListener('pointercancel', endLaser, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', endLaser);
      document.removeEventListener('pointercancel', endLaser);
    };
  }, [laserMode, laserDragging]);


  const printLabel = (text) => {
    if (debugUi) {
      // BATCAT-Modus: keine Drucke
      return;
    }
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
        label.setObjectText("Datum", selectedDate.toLocaleDateString("de-DE"));
        label.print(printerName || "DYMO LabelWriter 450");
      })
      .catch(err => showError('Fehler beim Drucken: ' + err.message));
  };

  const generatePreview = (text) => {
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
        label.setObjectText("Datum", selectedDate.toLocaleDateString("de-DE"));
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
      <ErrorBoundary label="Die Katze" silent>
        <CatSprite
          play={play}
          onCatch={() => setPlay(null)}
          debugUi={debugUi}
          laserMode={laserMode}
          onToggleLaser={() => {
            setLaserMode((v) => !v);
            if (laserMode) setPlay((p) => (p && p.kind === 'laser' ? null : p));
          }}
          setSuppressSpawn={setSuppressSpawn}
        />
        <PlayOverlay play={play} setPlay={setPlay} />
      </ErrorBoundary>
      {error && (
        <div className="print-error" role="alert" onClick={() => setError(null)}>
          ⚠️ {error}
        </div>
      )}
      {editorOpen && (
        <ErrorBoundary label="Der Etiketten-Editor">
          <LabelEditor
            groups={groups}
            onChange={updateGroups}
            onClose={() => setEditorOpen(false)}
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
        <button className="edit-toggle" onClick={() => setEditorOpen(true)}>
          ✏️ Etiketten bearbeiten
        </button>
      </header>

      <div className="main-layout">
        <aside className="side-rail">
          <div className={`preview-section ${previewSrc ? '' : 'empty'}`}>
            {previewSrc
              ? <img src={previewSrc} alt="Vorschau" />
              : <span className="preview-hint">Vorschau</span>}
          </div>

          <div className="date-section">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                generatePreview(input);
              }}
              inline
              calendarClassName="custom-datepicker"
            />
            <div className="date-current">
              📅 {selectedDate.toLocaleDateString("de-DE")}
            </div>
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
                {group.entries.map((name, idx) => (
                  <button
                    key={`${group.id}-${idx}`}
                    onClick={() => {
                      printLabel(name);
                      generatePreview(name);
                    }}
                    disabled={printerStatus !== 'online'}
                  >
                    {name}
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
