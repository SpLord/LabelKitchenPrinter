import { useRef, useState } from 'react';
import IconPicker from './labels/IconPicker.jsx';
import { downloadBackup, readBackup } from './labels/backup.js';
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
  const [notice, setNotice] = useState(null);
  const fileRef = useRef(null);

  const draftFor = (groupId) => newEntry[groupId] ?? '';
  const setDraft = (groupId, value) => setNewEntry((prev) => ({ ...prev, [groupId]: value }));
  const cancel = () => setConfirming(null);

  const isConfirming = (type, groupId, index) =>
    confirming?.type === type && confirming?.groupId === groupId && confirming?.index === index;

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

  const say = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const importFile = async (file) => {
    if (!file) return;
    try {
      const result = readBackup(await file.text());
      if (!result.ok) return say(`⚠️ ${result.error}`);
      onChange(result.groups);
      say(`✅ ${result.groups.length} Gruppen aus der Datei übernommen.`);
    } catch (err) {
      say(`⚠️ Datei nicht lesbar: ${err.message}`);
    }
  };

  return (
    <div className="editor-overlay" role="dialog" aria-modal="true" aria-label="Etiketten bearbeiten">
      <div className="editor-panel">
        <header className="editor-header">
          <h2>🏷️ Etiketten bearbeiten</h2>
          <div className="editor-header-actions">
            <button className="editor-btn ghost" onClick={() => downloadBackup(groups)}>
              ⬇️ Sichern
            </button>
            <button className="editor-btn ghost" onClick={() => fileRef.current?.click()}>
              ⬆️ Laden
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = ''; }}
            />
            {isConfirming('reset') ? (
              <>
                <button className="editor-btn danger" onClick={() => { onChange(resetGroups()); cancel(); }}>
                  Ja, alles zurücksetzen
                </button>
                <button className="editor-btn" onClick={cancel}>Abbrechen</button>
              </>
            ) : (
              <button className="editor-btn ghost" onClick={() => setConfirming({ type: 'reset' })}>
                Zurücksetzen
              </button>
            )}
            <button className="editor-btn primary" onClick={onClose}>Fertig</button>
          </div>
        </header>

        {notice && <p className="editor-notice" role="status">{notice}</p>}

        <p className="editor-hint">
          Änderungen werden sofort in diesem Browser gespeichert. Für ein anderes Gerät
          oder als Sicherung die Datei über „Sichern“ ablegen.
        </p>

        <div className="editor-groups">
          {groups.map((group, groupIndex) => (
            <section key={group.id} className="editor-group">
              {isConfirming('group', group.id) ? (
                <div className="editor-confirm" role="alertdialog">
                  <span>
                    Gruppe <strong>{group.name}</strong> mit {group.entries.length}{' '}
                    {group.entries.length === 1 ? 'Etikett' : 'Etiketten'} löschen?
                  </span>
                  <button className="editor-btn danger" onClick={() => { onChange(removeGroup(groups, group.id)); cancel(); }}>
                    Ja, löschen
                  </button>
                  <button className="editor-btn" onClick={cancel}>Abbrechen</button>
                </div>
              ) : (
                <div className="editor-group-head">
                  <IconPicker
                    value={group.icon}
                    label={group.name}
                    onChange={(icon) => onChange(setGroupIcon(groups, group.id, icon))}
                  />
                  <input
                    className="editor-group-name"
                    value={group.name}
                    onChange={(e) => onChange(renameGroup(groups, group.id, e.target.value))}
                    aria-label="Gruppenname"
                  />
                  <div className="editor-group-tools">
                    <button className="editor-btn icon" onClick={() => onChange(moveGroup(groups, group.id, -1))}
                            disabled={groupIndex === 0} aria-label="Gruppe nach oben">↑</button>
                    <button className="editor-btn icon" onClick={() => onChange(moveGroup(groups, group.id, 1))}
                            disabled={groupIndex === groups.length - 1} aria-label="Gruppe nach unten">↓</button>
                    <button className="editor-btn icon danger-ghost"
                            onClick={() => setConfirming({ type: 'group', groupId: group.id })}
                            aria-label={`Gruppe ${group.name} löschen`} title="Gruppe löschen">🗑</button>
                  </div>
                </div>
              )}

              <ul className="editor-entries">
                {group.entries.map((entry, index) => (
                  <li key={`${group.id}-${index}`} className="editor-entry">
                    {isConfirming('entry', group.id, index) ? (
                      <div className="editor-confirm" role="alertdialog">
                        <span><strong>{entry}</strong> löschen?</span>
                        <button className="editor-btn danger"
                                onClick={() => { onChange(removeEntry(groups, group.id, index)); cancel(); }}>
                          Ja, löschen
                        </button>
                        <button className="editor-btn" onClick={cancel}>Abbrechen</button>
                      </div>
                    ) : (
                      <>
                        <input
                          value={entry}
                          onChange={(e) => onChange(renameEntry(groups, group.id, index, e.target.value))}
                          aria-label={`Etikett ${index + 1} in ${group.name}`}
                        />
                        <button className="editor-btn icon" onClick={() => onChange(moveEntry(groups, group.id, index, -1))}
                                disabled={index === 0} aria-label="Nach oben">↑</button>
                        <button className="editor-btn icon" onClick={() => onChange(moveEntry(groups, group.id, index, 1))}
                                disabled={index === group.entries.length - 1} aria-label="Nach unten">↓</button>
                        <button className="editor-btn icon danger-ghost"
                                onClick={() => setConfirming({ type: 'entry', groupId: group.id, index })}
                                aria-label={`${entry} löschen`} title="Etikett löschen">🗑</button>
                      </>
                    )}
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
