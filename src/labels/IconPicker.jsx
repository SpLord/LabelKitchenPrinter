import { useEffect, useRef, useState } from 'react';
import { ICON_CHOICES } from './icons.js';

/*
  Symbolauswahl für eine Gruppe.
  - props:
    - value: string        aktuelles Symbol
    - label: string        Gruppenname, nur für die Vorlesehilfe
    - onChange(icon): void
*/
export default function IconPicker({ value, label, onChange }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const wrapRef = useRef(null);

  // Klick daneben oder Escape schließt die Auswahl
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (icon) => {
    onChange(icon);
    setOpen(false);
  };

  return (
    <div className="icon-picker" ref={wrapRef}>
      <button
        type="button"
        className="icon-picker-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Symbol für ${label} ändern, aktuell ${value}`}
        title="Symbol ändern"
      >
        {value}
      </button>

      {open && (
        <div className="icon-picker-popover" role="dialog" aria-label="Symbol auswählen">
          <div className="icon-picker-grid">
            {ICON_CHOICES.map((icon, i) => (
              <button
                type="button"
                key={`${icon}-${i}`}
                className={`icon-picker-choice ${icon === value ? 'active' : ''}`}
                onClick={() => choose(icon)}
                aria-label={`Symbol ${icon}`}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="icon-picker-custom">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && custom.trim()) choose(custom.trim()); }}
              placeholder="Eigenes Zeichen"
              maxLength={4}
              aria-label="Eigenes Symbol eingeben"
            />
            <button
              type="button"
              className="editor-btn"
              onClick={() => custom.trim() && choose(custom.trim())}
              disabled={!custom.trim()}
            >
              Übernehmen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
