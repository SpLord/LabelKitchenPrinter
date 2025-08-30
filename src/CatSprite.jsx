import { useEffect, useMemo, useRef, useState } from 'react';

function CatVariant({ index }) {
  const palettes = [
    { body: '#f5d3b3', stroke: '#3b3b3b', accent: '#e08e79' }, // sand
    { body: '#f2e5cf', stroke: '#2f2f2f', accent: '#f59e0b' }, // creme
    { body: '#c7e0ff', stroke: '#1f2937', accent: '#60a5fa' }, // blau
    { body: '#ffd6e7', stroke: '#334155', accent: '#fb7185' }, // rosa
  ];
  const p = palettes[index % palettes.length];
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
        </filter>
      </defs>
      <path d="M155 120c20 0 30 15 20 28s-26 10-33 3" fill="none" stroke={p.stroke} strokeWidth="8" strokeLinecap="round">
        <animate attributeName="d" dur="1.8s" repeatCount="indefinite" values="M155 120c20 0 30 15 20 28s-26 10-33 3; M155 120c22 2 34 12 26 26s-26 12-35 6; M155 120c20 0 30 15 20 28s-26 10-33 3" />
      </path>
      <g filter="url(#shadow)">
        <ellipse cx="110" cy="120" rx="70" ry="55" fill={p.body} stroke={p.stroke} strokeWidth="6" />
        <circle cx="80" cy="85" r="40" fill={p.body} stroke={p.stroke} strokeWidth="6" />
        {/* Ohren variieren leicht */}
        <path d="M55 56 L45 25 L75 45 Z" fill={p.body} stroke={p.stroke} strokeWidth="6" transform={index % 2 === 0 ? '' : 'rotate(-6 60 40)'} />
        <path d="M105 56 L135 25 L125 60 Z" fill={p.body} stroke={p.stroke} strokeWidth="6" transform={index % 2 === 0 ? '' : 'rotate(6 120 42)'} />
        <circle cx="65" cy="85" r="6" fill={p.stroke} />
        <circle cx="95" cy="85" r="6" fill={p.stroke} />
        <polygon points="80,95 75,103 85,103" fill={p.accent} />
        <path d="M75 108 q5 6 10 0" stroke={p.stroke} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M52 95 h18 M52 103 h18 M52 87 h18" stroke={p.stroke} strokeWidth="4" strokeLinecap="round" />
        <path d="M90 95 h18 M90 103 h18 M90 87 h18" stroke={p.stroke} strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="60" cy="155" rx="16" ry="10" fill={p.body} stroke={p.stroke} strokeWidth="6" />
        <ellipse cx="95" cy="165" rx="16" ry="10" fill={p.body} stroke={p.stroke} strokeWidth="6" />
      </g>
    </svg>
  );
}

export default function CatSprite() {
  const [pos, setPos] = useState({ top: 20, left: 20 });
  const [variant, setVariant] = useState(() => Math.floor(Math.random() * 4));
  const [message, setMessage] = useState(null);
  const catSize = useMemo(() => ({ w: 120, h: 120 }), []);
  const hideTimeout = useRef(null);

  const messages = useMemo(
    () => [
      'Lea, hast du die Mails schon gesehen?',
      'Kurz durchatmen. Danach Mails sortieren! 😺',
      'Lea, ich glaub es gibt neue Mails.',
      'Drucker läuft. Mails später, Lea?',
      'Noch ein Kaffee? Dann die Mails checken.',
      'Lea, ich halte die Stellung. 📬',
    ],
    []
  );

  function rectsOverlap(a, b) {
    return !(a.left > b.right || a.right < b.left || a.top > b.bottom || a.bottom < b.top);
  }

  const pickSafePosition = () => {
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const catW = catSize.w;
    const catH = catSize.h;

    const layoutEl = document.querySelector('.main-layout');
    const statusEl = document.querySelector('.status-indicator');
    const layout = layoutEl ? layoutEl.getBoundingClientRect() : { top: vh / 3, bottom: (vh / 3) * 2, left: vw / 3, right: (vw / 3) * 2 };
    const status = statusEl ? statusEl.getBoundingClientRect() : null;

    const areas = [];
    // Above main layout
    if (layout.top - margin - catH > margin) {
      areas.push({
        xMin: margin,
        xMax: vw - catW - margin,
        yMin: margin,
        yMax: layout.top - catH - margin,
      });
    }
    // Below main layout
    if (vh - layout.bottom - margin - catH > 0) {
      areas.push({
        xMin: margin,
        xMax: vw - catW - margin,
        yMin: layout.bottom + margin,
        yMax: vh - catH - margin,
      });
    }
    // Left of main layout
    if (layout.left - margin - catW > margin) {
      areas.push({
        xMin: margin,
        xMax: layout.left - catW - margin,
        yMin: margin,
        yMax: vh - catH - margin,
      });
    }
    // Right of main layout
    if (vw - layout.right - margin - catW > 0) {
      areas.push({
        xMin: layout.right + margin,
        xMax: vw - catW - margin,
        yMin: margin,
        yMax: vh - catH - margin,
      });
    }

    // fallback to anywhere
    if (areas.length === 0) {
      areas.push({ xMin: margin, xMax: vw - catW - margin, yMin: margin, yMax: vh - catH - margin });
    }

    const attempts = 12;
    for (let i = 0; i < attempts; i++) {
      const area = areas[Math.floor(Math.random() * areas.length)];
      const left = Math.floor(Math.random() * (area.xMax - area.xMin + 1)) + area.xMin;
      const top = Math.floor(Math.random() * (area.yMax - area.yMin + 1)) + area.yMin;
      const catRect = { left, top, right: left + catW, bottom: top + catH };
      if (status) {
        const sRect = { left: status.left - 8, top: status.top - 8, right: status.right + 8, bottom: status.bottom + 8 };
        if (rectsOverlap(catRect, sRect)) continue;
      }
      return { top, left };
    }
    // If all tries failed, return top-left of first area
    const a0 = areas[0];
    return { top: a0.yMin, left: a0.xMin };
  };

  const moveCat = () => {
    setPos(pickSafePosition());
  };

  const showRandomMessage = () => {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    setMessage(msg);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setMessage(null), 8000);
  };

  useEffect(() => {
    // First position and schedule moves
    moveCat();
    const mvId = setInterval(moveCat, 20000);
    // Change variant every ~3 hours
    const varId = setInterval(() => setVariant((v) => (v + 1) % 4), 10800000);
    // Random speech every 60–180s
    let speakId;
    function scheduleSpeak() {
      const delay = 60000 + Math.floor(Math.random() * 120000); // 60-180s
      speakId = setTimeout(() => {
        showRandomMessage();
        scheduleSpeak();
      }, delay);
    }
    scheduleSpeak();

    const onResize = () => moveCat();
    window.addEventListener('resize', onResize);
    return () => {
      clearInterval(mvId);
      clearInterval(varId);
      clearTimeout(speakId);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="cat-sprite" style={{ top: pos.top, left: pos.left }} aria-hidden>
      <CatVariant index={variant} />
      {message && (
        <div className="cat-bubble">
          {message}
          <span className="cat-bubble-tail" />
        </div>
      )}
    </div>
  );
}
