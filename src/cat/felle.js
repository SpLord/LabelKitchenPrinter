/*
  Fellpalette der Katze.

  Bewusst in einer eigenen Datei ohne JSX: laden.js verweist über den Index
  hierher, und `VARIANTS[index % VARIANTS.length]` wickelt einen zu grossen
  Index still auf ein falsches Fell um. Der Test in laden.test.mjs prüft
  deshalb gegen diese Liste – das geht nur, wenn er sie importieren kann.
*/
export const VARIANTS = [
  { name: 'sand', body: '#f5d3b3', stroke: '#3b3b3b', accent: '#e08e79', pattern: 'none' },
  { name: 'creme', body: '#f2e5cf', stroke: '#2f2f2f', accent: '#f59e0b', pattern: 'none' },
  { name: 'blau', body: '#c7e0ff', stroke: '#1f2937', accent: '#60a5fa', pattern: 'stripes', patternColor: '#60a5fa' },
  { name: 'rosa', body: '#ffd6e7', stroke: '#334155', accent: '#fb7185', pattern: 'spots', patternColor: '#fb7185' },
  { name: 'ginger', body: '#fbbf24', stroke: '#3b2f17', accent: '#f59e0b', pattern: 'stripes', patternColor: '#d97706' },
  { name: 'gray', body: '#cbd5e1', stroke: '#0f172a', accent: '#94a3b8', pattern: 'none' },
  { name: 'tuxedo', body: '#111827', stroke: '#000000', accent: '#f3f4f6', pattern: 'tuxedo', patternColor: '#f3f4f6' },
  { name: 'siam', body: '#e5d3b3', stroke: '#3b3b3b', accent: '#8b5e34', pattern: 'siam', patternColor: '#8b5e34' },
  { name: 'calico', body: '#fff7ed', stroke: '#374151', accent: '#fb923c', pattern: 'patch', patternColor: '#fb923c' },
  { name: 'snow', body: '#f8fafc', stroke: '#334155', accent: '#a3e635', pattern: 'spots', patternColor: '#a3e635' },
  // Die teuren drei sollen auf einen Blick anders aussehen, nicht nur anders
  // eingefärbt: Mint gestreift, Gold mit Schimmer, Galaxie dunkel mit Sternen.
  { name: 'mint', body: '#ccfbf1', stroke: '#134e4a', accent: '#14b8a6', pattern: 'stripes', patternColor: '#2dd4bf' },
  { name: 'gold', body: '#fcd34d', stroke: '#78350f', accent: '#b45309', pattern: 'glanz', patternColor: '#fffbeb' },
  { name: 'galaxy', body: '#312e81', stroke: '#0f172a', accent: '#c4b5fd', pattern: 'sterne', patternColor: '#f5f3ff' },
];
