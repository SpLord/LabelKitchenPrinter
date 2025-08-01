import { useEffect, useState } from "react";
import "./styles.css";

export default function TextbausteinVerwaltung({ onSelect }) {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // LocalStorage laden
  useEffect(() => {
    const saved = localStorage.getItem("etikett_textbausteine");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // LocalStorage speichern bei Änderungen
  useEffect(() => {
    localStorage.setItem("etikett_textbausteine", JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    if (!newItem.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      label: newItem.trim()
    };
    setItems([...items, newEntry]);
    setNewItem("");
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
    if (id === selectedId) {
      setSelectedId(null);
      onSelect(null);
    }
  };

  const handleSelect = (item) => {
    setSelectedId(item.id);
    onSelect(item.label);
  };

  return (
    <div className="textbaustein-container">
      <h2>Textbausteine</h2>
      <div className="textbaustein-list">
        {items.map((item) => (
          <div
            key={item.id}
            className={`textbaustein-item ${item.id === selectedId ? "active" : ""}`}
            onClick={() => handleSelect(item)}
          >
            <span>{item.label}</span>
            <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>🗑</button>
          </div>
        ))}
      </div>

      <div className="textbaustein-input">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Neuer Textbaustein"
        />
        <button onClick={addItem}>➕ Hinzufügen</button>
      </div>
    </div>
  );
}
