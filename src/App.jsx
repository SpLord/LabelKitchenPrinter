
import { useEffect, useState } from 'react';
import './styles.css';

const predefined = ['Max Mustermann', 'Lisa Beispiel', 'Besucher'];

export default function App() {
  const [input, setInput] = useState('');
  const [printerStatus, setPrinterStatus] = useState('checking');
  const [printerName, setPrinterName] = useState(null);

  useEffect(() => {
    const tryInitDymo = () => {
      try {
        dymo.label.framework.init();
        const printers = dymo.label.framework.getPrinters();
        console.log("Drucker:", printers);
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
      console.log("Fetch-Status:", res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status} – ${res.statusText}`);
      return res.text();
    })
    .then(labelXml => {
        if (labelXml.includes('<html')) {
          throw new Error("Label-Datei nicht gefunden – HTML statt Label geladen!");
        }
      const label = dymo.label.framework.openLabelXml(labelXml);
      label.setObjectText("Name", text);
      label.print(printerName || "DYMO LabelWriter 450");
    })
    .catch(err => {
      alert("Fehler beim Drucken: " + err.message);
      console.error("DRUCKFEHLER:", err);
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
            onClick={() => printLabel(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Individueller Text"
        />
        <button
          disabled={printerStatus !== 'online'}
          onClick={() => printLabel(input)}
        >
          Drucken
        </button>
      </div>
    </div>
  );
}
