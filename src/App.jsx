
import { useEffect, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import './styles.css';
import CatSprite from './CatSprite.jsx';
import PlayOverlay from './PlayOverlay.jsx';

const labelGroups = {
  Fleisch: ['Steak', 'Filet', 'Steak Streifen', 'Filet Streifen', 'Kalbschnitzel','Schweineschnitzel'],
  Saucen: ['Portweinsauce', 'Trüffelmajo', 'Cocktailsauce', 'Scharfe Majo'],
  Fond: ['Fleischfond', 'Gemüsefond'],
  Dressing: ['Himbeerdressing', 'Balsamicodressing'],
  Salat: ['Fregola', 'Rote Beete', 'Fregola Gemüse'],
  Menü: ['Lachs', 'Schmorjuis', 'USBeef', 'Parmesanschaum', 'Sherryschaum'],
};

const groupIcons = {
  Fleisch: '🥩',
  Fond: '🍲',
  Saucen: '🧂',
  Dressing: '🥗',
  Salat: '🥬',
  Menü: '🍽️',
};

export default function App() {
  const [input, setInput] = useState('');
  const [printerStatus, setPrinterStatus] = useState('checking');
  const [printerName, setPrinterName] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [play, setPlay] = useState(null); // toy target for cat
  const [laserMode, setLaserMode] = useState(false);

  const getEffectiveDate = () => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(5, 0, 0, 0);
    if (now < cutoff) now.setDate(now.getDate() - 1);
    return now;
  };

  const [selectedDate, setSelectedDate] = useState(getEffectiveDate());
  const debugUi = (input || '').trim().toUpperCase() === 'BATCAT';

  // Druckerstatus prüfen (DYMO)
  useEffect(() => {
    const tryInitDymo = () => {
      try {
        dymo.label.framework.init();
        const printers = dymo.label.framework.getPrinters();
        if (printers && printers.length > 0) {
          setPrinterStatus('online');
          setPrinterName(printers[0].name);
        } else {
          setPrinterStatus('offline');
          setPrinterName(null);
        }
      } catch (err) {
        if (err.message?.includes("service discovery is in progress")) {
          setTimeout(tryInitDymo, 500);
        } else {
          setPrinterStatus('offline');
          setPrinterName(null);
        }
      }
    };

    if (window?.dymo?.label?.framework) {
      tryInitDymo();
      const interval = setInterval(tryInitDymo, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  // Global click to spawn toy when clicking on background areas
  useEffect(() => {
    const handler = (e) => {
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
  }, [laserMode]);

  // Laserpointer mode: follow mouse cursor with a red dot
  useEffect(() => {
    if (!laserMode) return;
    const onMove = (e) => {
      setPlay((p) => ({ id: 'laser', kind: 'laser', x: e.clientX, y: e.clientY }));
    };
    const onLeave = () => setPlay((p) => (p && p.kind === 'laser' ? null : p));
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [laserMode]);


  const printLabel = (text) => {
    if (debugUi) {
      // BATCAT-Modus: keine Drucke
      return;
    }
    if (!text) return alert('Bitte Text eingeben.');

    fetch('/labels/Label_32x57.label')
      .then(res => res.text())
      .then(labelXml => {
        const label = dymo.label.framework.openLabelXml(labelXml);
        label.setObjectText("Name", text);
        label.setObjectText("Datum", selectedDate.toLocaleDateString("de-DE"));
        label.print(printerName || "DYMO LabelWriter 450");
      })
      .catch(err => alert("Fehler beim Drucken: " + err.message));
  };

  const generatePreview = (text) => {
    if (!text || !window.dymo?.label?.framework) {
      setPreviewSrc(null);
      return;
    }

    fetch('/labels/Label_32x57.label')
      .then(res => res.text())
      .then(labelXml => {
        const label = dymo.label.framework.openLabelXml(labelXml);
        label.setObjectText("Name", text);
        label.setObjectText("Datum", selectedDate.toLocaleDateString("de-DE"));
        const base64 = label.render();
        setPreviewSrc(`data:image/png;base64,${base64}`);
      })
      .catch(() => setPreviewSrc(null));
  };

  return (
    <>
      <CatSprite
        play={play}
        onCatch={() => setPlay(null)}
        debugUi={debugUi}
        laserMode={laserMode}
        onToggleLaser={() => {
          setLaserMode((v) => !v);
          if (laserMode) setPlay((p) => (p && p.kind === 'laser' ? null : p));
        }}
      />
      <PlayOverlay play={play} setPlay={setPlay} />
      <div className="status-indicator">
        {printerStatus === 'checking' && <span>🔄 Drucker wird erkannt…</span>}
        {printerStatus === 'online' && (
          <span className="online">✅ Drucker bereit: {printerName}</span>
        )}
        {printerStatus === 'offline' && (
          <span className="offline">❌ Kein Drucker gefunden</span>
        )}
      </div>

      <div className="main-layout">
        <div className="preview-section">
          {previewSrc && <img src={previewSrc} alt="Vorschau" />}
        </div>

        <div className="button-section">
          <div className="button-column">
            {['Fleisch', 'Fond'].map((group) => (
              <div key={group} className="button-group">
                <h3><span className="group-icon" aria-hidden="true">{groupIcons[group] || '🏷️'}</span>{group}</h3>
                {labelGroups[group].map((name, idx) => (
                  <button
                    key={idx}
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
            ))}
          </div>

          <div className="button-column">
            {['Saucen', 'Dressing'].map((group) => (
              <div key={group} className="button-group">
                <h3><span className="group-icon" aria-hidden="true">{groupIcons[group] || '🏷️'}</span>{group}</h3>
                {labelGroups[group].map((name, idx) => (
                  <button
                    key={idx}
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
            ))}
          </div>

          <div className="button-column">
            {['Menü'].map((group) => (
              <div key={group} className="button-group">
                <h3><span className="group-icon" aria-hidden="true">{groupIcons[group] || '🏷️'}</span>{group}</h3>
                {labelGroups[group].map((name, idx) => (
                  <button
                    key={idx}
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
            ))}
          </div>
        </div>

<div className="input-group full-width">
    <input
      type="text"
      value={input}
      onChange={(e) => {
        setInput(e.target.value);
        generatePreview(e.target.value);
      }}
      placeholder="Individueller Text"
    />
    <button onClick={() => printLabel(input)} disabled={printerStatus !== 'online'}>
      Drucken
    </button>
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
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            📅 Gewähltes Datum: {selectedDate.toLocaleDateString("de-DE")}
          </div>
        </div>
      </div>
    </>
  );
}
