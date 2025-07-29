import { useState } from 'react';

const predefined = ['Max Mustermann', 'Lisa Beispiel', 'Besucher'];

export default function App() {
  const [input, setInput] = useState('');

  const printLabel = (text) => {
    if (!text) return alert('Bitte Text eingeben.');

    const labelXml = `
      <Label xmlns="http://www.dymo.com">
        <Objects>
          <TextObject>
            <Name>TEXT</Name>
            <Text>${text}</Text>
          </TextObject>
        </Objects>
      </Label>`;

    const label = window.dymo.label.framework.openLabelXml(labelXml);
    label.setObjectText("TEXT", text);
    label.print("DYMO LabelWriter 450");
  };

  return (
    <div className="container">
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