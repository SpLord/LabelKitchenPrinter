import { useEffect, useState } from 'react';
import './styles.css';

const predefined = ['Max Mustermann', 'Lisa Beispiel', 'Besucher'];

export default function App() {
  const [input, setInput] = useState('');
  const [printerStatus, setPrinterStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [printerName, setPrinterName] = useState(null);

  // Init DYMO SDK mit HTTPS
  useEffect(() => {
    if (window?.dymo?.label?.framework?.init) {
      window.dymo.label.framework.init({
        hostAddress: "https://localhost:41951"
      });
    }

    const checkPrinter = () => {
      try {
        const printers = window?.dymo?.label?.framework?.getPrinters?.();
        if (printers && printers.length > 0) {
          setPrinterStatus('online');
          setPrinterName(printers[0].name);
        } else {
          setPrinterStatus('offline');
          setPrinterName(null);
        }
      } catch {
        setPrinterStatus('offline');
        setPrinterName(null);
      }
    };

    checkPrinter(); // Initial prüfen
    const interval = setInterval(checkPrinter, 5000);
    return () => clearInterval(interval);
  }, []);

  const printLabel = (text) => {
    if (!text) return alert('Bitte Text eingeben.');
    const labelXml = `
      <Label xmlns="http://www.dymo.com">
        <Objects>
          <TextObject>
            <Name>TEXT</Name>
            <Text>\${text}</Text>
          </TextObject>
        </Objects>
      </Label>`;

    const label = window.dymo.label.framework.openLabelXml(labelXml);
    label.setObjectText("TEXT", text);
    label.print("DYMO LabelWriter 450");
  };

  return (
    <div className="container">
      <div className="status-indicator">
        {printerStatus === 'checking' && <span>🔄 Erkennung…</span>}
        {printerStatus === 'online' && <span className="online">✅ Drucker bereit</span>}
        {printerStatus === 'offline' && <span className="offline">❌ Kein Drucker</span>}
      </div>

      <h1>Etikettendruck</h1>

      <div className="button-grid">
        {predefined.map((name, idx) => (
          <button key={idx} onClick={() => printLabel(name)}>{name}</button>
        ))}
      </div>

      <div className="input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Individueller Text"
        />
        <button onClick={() => printLabel(input)}>Drucken</button>
      </div>
    </div>
  );
}
