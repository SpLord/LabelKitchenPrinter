
import { useEffect, useState } from 'react';
import './styles.css';

const predefined = ['Max Mustermann', 'Lisa Beispiel', 'Besucher'];

export default function App() {
  const [input, setInput] = useState('');
  const [printerStatus, setPrinterStatus] = useState('checking');
  const [printerName, setPrinterName] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);

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
          console.log("Warte auf DYMO-Service… erneut versuchen in 500ms");
          setTimeout(tryInitDymo, 500);
        } else {
          console.error("DYMO Init-Fehler:", err);
          setPrinterStatus('offline');
          setPrinterName(null);
        }
      }
    };

    if (window?.dymo?.label?.framework) {
      tryInitDymo();
      const interval = setInterval(tryInitDymo, 5000);
      return () => clearInterval(interval);
    } else {
      setPrinterStatus('offline');
      setPrinterName(null);
    }
  }, []);

  const printLabel = (text) => {
    if (!text) return alert('Bitte Text eingeben.');

    fetch('/labels/Label_32x57.label')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} – ${res.statusText}`);
        return res.text();
      })
      .then(labelXml => {
        const label = dymo.label.framework.openLabelXml(labelXml);
        label.setObjectText("Name", text);
        label.print(printerName || "DYMO LabelWriter 450");
      })
      .catch(err => {
        alert("Fehler beim Drucken: " + err.message);
      });
  };

const generatePreview = (text) => {
  if (!text || !window.dymo?.label?.framework) {
    setPreviewSrc(null);
    return;
  }

fetch('/labels/Label_32x57.label')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status} – ${res.statusText}`);
      return res.text();
    })
    .then(labelXml => {
      const label = dymo.label.framework.openLabelXml(labelXml);

      // prüfen, ob Objektname existiert
      const objects = label.getObjectNames();
      console.log("Objekte:", label.getObjectNames());
      if (!objects.includes("Name")) throw new Error("Label enthält kein Objekt namens 'Name'");

      label.setObjectText("Name", text);
      const base64 = label.render();

      const preview = `data:image/png;base64,${base64}`;
      setPreviewSrc(preview);

      console.log("Render-Vorschau:", preview);

      if (!preview.startsWith("data:image/png;base64,")) {
        throw new Error("Ungültige Vorschau-Daten");
      }

      setPreviewSrc(preview);
    })
    .catch(err => {
      console.error("Vorschaufehler:", err);
      setPreviewSrc(null);
    });
};


  return (
    <div className="container">
      <div className="status-indicator">
        {printerStatus === 'checking' && <span>🔄 Erkennung…</span>}
        {printerStatus === 'online' && (
          <span className="online">✅ Drucker bereit: {printerName}</span>
        )}
        {printerStatus === 'offline' && (
          <span className="offline">❌ Kein Drucker gefunden</span>
        )}
      </div>

      <h1>Etikettendruck</h1>

      <div className="button-grid">
        {predefined.map((name, idx) => (
          <button
            key={idx}
            disabled={printerStatus !== 'online'}
            onClick={() => {
              printLabel(name);
              generatePreview(name);
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            generatePreview(e.target.value);
          }}
          placeholder="Individueller Text"
        />
        <button
          disabled={printerStatus !== 'online'}
          onClick={() => printLabel(input)}
        >
          Drucken
        </button>
      </div>

      {previewSrc && (
        <div className="preview">
          <h3>Vorschau:</h3>
          <img src={previewSrc} alt="Etikettenvorschau" />
        </div>
      )}
    </div>
  );
}
