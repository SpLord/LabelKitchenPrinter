import { useState } from 'react';
import {
  addEntry, addGroup, moveEntry, moveGroup, removeEntry, removeGroup,
  renameEntry, renameGroup, resetGroups, setGroupIcon,
} from './labels/store.js';

/*
  Editor für die Etiketten-Buttons.
  - props:
    - groups: Group[]
    - onChange(nextGroups): void   (Aufrufer persistiert)
    - onClose(): void
*/
export default function LabelEditor({ groups, onChange, onClose }) {
  const [newEntry, setNewEntry] = useState({});   // { [groupId]: string }
  const [newGroupName, setNewGroupName] = useState('');
  const [confirming, setConfirming] = useState(null); // { type, groupId, index }

  const draftFor = (groupId) => newEntry[groupId] ?? '';
  const setDraft = (groupId, value) => setNewEntry((prev) => ({ ...prev, [groupId]: value }));

  const commitEntry = (groupId) => {
    const value = draftFor(groupId).trim();
    if (!value) return;
    onChange(addEntry(groups, groupId, value));
    setDraft(groupId, '');
  };

  const commitGroup = () => {
    const value = newGroupName.trim();
    if (!value) return;
    onChange(addGroup(groups, value));
    setNewGroupName('');
  };

  const isConfirming = (type, groupId, index) =>
    confirming?.type === type && confirming?.groupId === groupId && confirming?.index === index;

  return (
    <div className="editor-overlay" role="dialog" aria-modal="true" aria-label="Etiketten bearbeiten">
      <div className="editor-panel">
        <header className="editor-header">
          <h2>🏷️ Etiketten bearbeiten</h2>
          <div className="editor-header-actions">
            <button
              className="editor-btn ghost"
              onClick={() => setConfirming(isConfirming('reset') ? null : { type: 'reset' })}
            >
              {isConfirming('reset') ? 'Wirklich?' : 'Zurücksetzen'}
            </button>
            {isConfirming('reset') && (
              <button
                className="editor-btn danger"
                onClick={() => { onChange(resetGroups()); setConfirming(null); }}
              >
                Ja, Standard laden
              </button>
            )}
            <button className="editor-btn primary" onClick={onClose}>Fertig</button>
          </div>
        </header>

        <div className="editor-groups">
          {groups.map((group, groupIndex) => (
            <section key={group.id} className="editor-group">
              <div className="editor-group-head">
                <input
                  className="editor-icon-input"
                  value={group.icon}
                  onChange={(e) => onChange(setGroupIcon(groups, group.id, e.target.value))}
                  aria-label={`Symbol für ${group.name}`}
                  maxLength={4}
                />
                <input
                  className="editor-group-name"
                  value={group.name}
                  onChange={(e) => onChange(renameGroup(groups, group.id, e.target.value))}
                  aria-label="Gruppenname"
                />
                <div className="editor-group-tools">
                  <button
                    className="editor-btn icon" onClick={() => onChange(moveGroup(groups, group.id, -1))}
                    disabled={groupIndex === 0} aria-label="Gruppe nach oben"
                  >↑</button>
                  <button
                    className="editor-btn icon" onClick={() => onChange(moveGroup(groups, group.id, 1))}
                    disabled={groupIndex === groups.length - 1} aria-label="Gruppe nach unten"
                  >↓</button>
                  <button
                    className={`editor-btn icon ${isConfirming('group', group.id) ? 'danger' : ''}`}
                    onClick={() => {
                      if (isConfirming('group', group.id)) {
                        onChange(removeGroup(groups, group.id));
                        setConfirming(null);
                      } else {
                        setConfirming({ type: 'group', groupId: group.id });
                      }
                    }}
                    aria-label={`Gruppe ${group.name} löschen`}
                    title={`Gruppe ${group.name} löschen`}
                  >{isConfirming('group', group.id) ? '✓' : '🗑'}</button>
                </div>
              </div>

              <ul className="editor-entries">
                {group.entries.map((entry, index) => (
                  <li key={`${group.id}-${index}`} className="editor-entry">
                    <input
                      value={entry}
                      onChange={(e) => onChange(renameEntry(groups, group.id, index, e.target.value))}
                      aria-label={`Etikett ${index + 1} in ${group.name}`}
                    />
                    <button
                      className="editor-btn icon" onClick={() => onChange(moveEntry(groups, group.id, index, -1))}
                      disabled={index === 0} aria-label="Nach oben"
                    >↑</button>
                    <button
                      className="editor-btn icon" onClick={() => onChange(moveEntry(groups, group.id, index, 1))}
                      disabled={index === group.entries.length - 1} aria-label="Nach unten"
                    >↓</button>
                    <button
                      className={`editor-btn icon ${isConfirming('entry', group.id, index) ? 'danger' : ''}`}
                      onClick={() => {
                        if (isConfirming('entry', group.id, index)) {
                          onChange(removeEntry(groups, group.id, index));
                          setConfirming(null);
                        } else {
                          setConfirming({ type: 'entry', groupId: group.id, index });
                        }
                      }}
                      aria-label={`${entry} löschen`}
                    >{isConfirming('entry', group.id, index) ? '✓' : '🗑'}</button>
                  </li>
                ))}
                {group.entries.length === 0 && (
                  <li className="editor-empty">Noch keine Etiketten in dieser Gruppe.</li>
                )}
              </ul>

              <div className="editor-add">
                <input
                  value={draftFor(group.id)}
                  onChange={(e) => setDraft(group.id, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitEntry(group.id); }}
                  placeholder="Neues Etikett…"
                  aria-label={`Neues Etikett in ${group.name}`}
                />
                <button className="editor-btn" onClick={() => commitEntry(group.id)}>➕ Hinzufügen</button>
              </div>
            </section>
          ))}
        </div>

        <footer className="editor-footer">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitGroup(); }}
            placeholder="Neue Gruppe…"
            aria-label="Name der neuen Gruppe"
          />
          <button className="editor-btn" onClick={commitGroup}>➕ Gruppe anlegen</button>
        </footer>
      </div>
    </div>
  );
}
