import { DEFAULT_GROUPS, FALLBACK_ICON } from './defaults.js';

/*
  Persistenz + unveränderliche Operationen auf den Etiketten-Gruppen.
  Alle Funktionen geben eine neue Struktur zurück, nichts wird in-place geändert.
*/

const STORAGE_KEY = 'etikett_gruppen_v1';
const MAX_NAME_LENGTH = 60;

// ── Validierung an der Systemgrenze ──────────────────────────────────────────
// localStorage ist Fremdeingabe: von Hand editiert, aus einer alten Version,
// oder schlicht kaputt. Was nicht dem Schema entspricht, fliegt raus.

const cleanText = (value) =>
  typeof value === 'string' ? value.trim().slice(0, MAX_NAME_LENGTH) : '';

const cleanGroup = (raw, index) => {
  if (!raw || typeof raw !== 'object') return null;
  const name = cleanText(raw.name);
  if (!name) return null;

  const entries = Array.isArray(raw.entries)
    ? raw.entries.map(cleanText).filter(Boolean)
    : [];

  return {
    id: cleanText(raw.id) || `gruppe-${index}-${Date.now()}`,
    name,
    icon: cleanText(raw.icon) || FALLBACK_ICON,
    entries,
  };
};

export const parseGroups = (raw) => {
  if (!Array.isArray(raw)) return null;
  const groups = raw.map(cleanGroup).filter(Boolean);
  return groups.length > 0 ? groups : null;
};

export const loadGroups = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_GROUPS;
    return parseGroups(JSON.parse(stored)) ?? DEFAULT_GROUPS;
  } catch (err) {
    console.warn('[labels] Gespeicherte Gruppen unlesbar, nutze Standard:', err);
    return DEFAULT_GROUPS;
  }
};

export const saveGroups = (groups) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    return true;
  } catch (err) {
    console.error('[labels] Speichern fehlgeschlagen:', err);
    return false;
  }
};

// ── Unveränderliche Operationen ──────────────────────────────────────────────

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const mapGroup = (groups, groupId, fn) =>
  groups.map((group) => (group.id === groupId ? fn(group) : group));

export const addGroup = (groups, name, icon) => [
  ...groups,
  { id: newId('gruppe'), name: cleanText(name) || 'Neue Gruppe', icon: cleanText(icon) || FALLBACK_ICON, entries: [] },
];

export const renameGroup = (groups, groupId, name) =>
  mapGroup(groups, groupId, (group) => ({ ...group, name: cleanText(name) || group.name }));

export const setGroupIcon = (groups, groupId, icon) =>
  mapGroup(groups, groupId, (group) => ({ ...group, icon: cleanText(icon) || FALLBACK_ICON }));

export const removeGroup = (groups, groupId) => groups.filter((group) => group.id !== groupId);

export const moveGroup = (groups, groupId, direction) => {
  const from = groups.findIndex((group) => group.id === groupId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= groups.length) return groups;
  const next = [...groups];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
};

export const addEntry = (groups, groupId, name) => {
  const entry = cleanText(name);
  if (!entry) return groups;
  return mapGroup(groups, groupId, (group) =>
    group.entries.includes(entry) ? group : { ...group, entries: [...group.entries, entry] },
  );
};

export const renameEntry = (groups, groupId, index, name) => {
  const entry = cleanText(name);
  if (!entry) return groups;
  return mapGroup(groups, groupId, (group) => ({
    ...group,
    entries: group.entries.map((existing, i) => (i === index ? entry : existing)),
  }));
};

export const removeEntry = (groups, groupId, index) =>
  mapGroup(groups, groupId, (group) => ({
    ...group,
    entries: group.entries.filter((_, i) => i !== index),
  }));

export const moveEntry = (groups, groupId, index, direction) =>
  mapGroup(groups, groupId, (group) => {
    const to = index + direction;
    if (to < 0 || to >= group.entries.length) return group;
    const entries = [...group.entries];
    [entries[index], entries[to]] = [entries[to], entries[index]];
    return { ...group, entries };
  });

export const resetGroups = () => DEFAULT_GROUPS;
