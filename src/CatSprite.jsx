import { useEffect, useMemo, useRef, useState } from 'react';

const VARIANTS = [
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
];

function CatVariant({ index, active }) {
  const v = VARIANTS[index % VARIANTS.length];
  const earTilt = index % 2 === 0 ? '' : 'rotate(-6 60 40)';
  const earTiltR = index % 2 === 0 ? '' : 'rotate(6 120 42)';
  const tailDur = active ? '1.1s' : '1.8s';
  const pawDur = active ? '0.28s' : '1.1s';
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
        </filter>
      </defs>
      <path d="M155 120c20 0 30 15 20 28s-26 10-33 3" fill="none" stroke={v.stroke} strokeWidth="8" strokeLinecap="round">
        <animate attributeName="d" dur={tailDur} repeatCount="indefinite" values="M155 120c20 0 30 15 20 28s-26 10-33 3; M155 120c22 2 34 12 26 26s-26 12-35 6; M155 120c20 0 30 15 20 28s-26 10-33 3" />
      </path>
      <g filter="url(#shadow)">
        {/* Body + Head */}
        <ellipse cx="110" cy="120" rx="70" ry="55" fill={v.body} stroke={v.stroke} strokeWidth="6" />
        <circle cx="80" cy="85" r="40" fill={v.body} stroke={v.stroke} strokeWidth="6" />
        {/* Ears */}
        <path d="M55 56 L45 25 L75 45 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" transform={earTilt}>
          <animateTransform attributeName="transform" attributeType="XML" type="rotate" values="0 60 40; 4 60 40; 0 60 40" dur="4s" repeatCount="indefinite" />
        </path>
        <path d="M105 56 L135 25 L125 60 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" transform={earTiltR}>
          <animateTransform attributeName="transform" attributeType="XML" type="rotate" values="0 120 42; -3 120 42; 0 120 42" dur="4.5s" repeatCount="indefinite" />
        </path>

        {/* Patterns */}
        {v.pattern === 'stripes' && (
          <g stroke={v.patternColor} strokeWidth="4" opacity="0.55" strokeLinecap="round">
            <path d="M120 95 q-16 10 -32 0" fill="none" />
            <path d="M130 115 q-22 12 -44 0" fill="none" />
            <path d="M95 70 q-8 6 -16 0" fill="none" />
          </g>
        )}
        {v.pattern === 'spots' && (
          <g fill={v.patternColor} opacity="0.5">
            <circle cx="120" cy="110" r="10" />
            <circle cx="95" cy="130" r="8" />
            <circle cx="70" cy="78" r="6" />
          </g>
        )}
        {v.pattern === 'tuxedo' && (
          <path d="M110 80 q-40 50 0 80 q40-30 0-80" fill={v.patternColor} opacity="0.95" />
        )}
        {v.pattern === 'siam' && (
          <g fill={v.patternColor} opacity="0.65">
            <path d="M55 56 L45 25 L75 45 Z" />
            <path d="M105 56 L135 25 L125 60 Z" />
            <ellipse cx="60" cy="155" rx="16" ry="10" />
            <ellipse cx="95" cy="165" rx="16" ry="10" />
          </g>
        )}
        {v.pattern === 'patch' && (
          <g fill={v.patternColor} opacity="0.6">
            <path d="M78 60 q-16 8 -10 22 q16-6 10-22" />
            <path d="M130 130 q-20 10 -8 24 q18-8 8-24" />
          </g>
        )}

        {/* Eyes / Face */}
        <circle cx="65" cy="85" r="6" fill={v.stroke}>
          <animate attributeName="r" dur="6s" repeatCount="indefinite" values="6;6;1;6;6" keyTimes="0;0.88;0.9;0.92;1" />
        </circle>
        <circle cx="95" cy="85" r="6" fill={v.stroke}>
          <animate attributeName="r" dur="6.2s" repeatCount="indefinite" values="6;6;1;6;6" keyTimes="0;0.86;0.88;0.9;1" />
        </circle>
        <polygon points="80,95 75,103 85,103" fill={v.accent} />
        <path d="M75 108 q5 6 10 0" stroke={v.stroke} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M52 95 h18 M52 103 h18 M52 87 h18" stroke={v.stroke} strokeWidth="4" strokeLinecap="round" />
        <path d="M90 95 h18 M90 103 h18 M90 87 h18" stroke={v.stroke} strokeWidth="4" strokeLinecap="round" />

        {/* Paws */}
        <ellipse cx="60" cy="155" rx="16" ry="10" fill={v.body} stroke={v.stroke} strokeWidth="6">
          <animate attributeName="cy" dur={pawDur} values="155;153;155" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="95" cy="165" rx="16" ry="10" fill={v.body} stroke={v.stroke} strokeWidth="6">
          <animate attributeName="cy" dur={pawDur} values="165;163;165" repeatCount="indefinite" begin="-0.14s" />
        </ellipse>
      </g>
    </svg>
  );
}

export default function CatSprite({ play, onCatch }) {
  const [pos, setPos] = useState({ top: 20, left: 20 });
  const [variant, setVariant] = useState(() => Math.floor(Math.random() * VARIANTS.length));
  const [message, setMessage] = useState(null);
  const [bubbleSize, setBubbleSize] = useState('normal');
  const catSize = useMemo(() => ({ w: 120, h: 120 }), []);
  const hideTimeout = useRef(null);
  const dirRef = useRef(1); // 1 right, -1 left
  const attemptsRef = useRef(0);
  const nearRef = useRef(false);

  const messages = useMemo(
    () => [
      'Lea, hast du Mails schon gesehen?',
      'Mails, alles gut bei dir?',
      'Lea und Mails, Teamwork? 😺',
      'Hey Mails, Kaffee oder Tee?',
      'Lea, sag Mails hallo von mir!',
      'Mails, ich halte hier die Stellung.',
      'Lea, kurze Pause? Mails kommt gleich.',
      'Mails, kommst du mal kurz rüber?',
      'Lea, gemeinsam schaffen wir das!',
      'Mails, du rockst! ✨',
    ],
    []
  );

  const purrs = useMemo(
    () => [
      'Schnurr~',
      'Prrrrr…',
      'Mrrrr… schnurr…',
      'Schnurrrrrr 😸',
      'Purrr purrr~',
      'Mrrrp… prrr…',
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
    // only reposition when not playing
    if (!play) setPos(pickSafePosition());
  };

  const showRandomMessage = () => {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    setMessage(msg);
    setBubbleSize('normal');
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setMessage(null), 12000);
  };

  const showPurr = () => {
    const msg = purrs[Math.floor(Math.random() * purrs.length)];
    setMessage(msg);
    setBubbleSize('normal');
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setMessage(null), 12000);
  };

  useEffect(() => {
    // First position on mount, variant rotation, speech scheduling
    moveCat();
    // Change variant every ~3 hours
    const varId = setInterval(() => setVariant((v) => (v + 1) % VARIANTS.length), 10800000);
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

    const onResize = () => setPos(pickSafePosition());
    window.addEventListener('resize', onResize);
    return () => {
      clearInterval(varId);
      clearTimeout(speakId);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Reposition occasionally when idle (every 20s), but pause while chasing
  useEffect(() => {
    const fn = () => { if (!play) setPos(pickSafePosition()); };
    fn();
    const id = setInterval(fn, 20000);
    return () => clearInterval(id);
  }, [play]);

  // Chase logic towards current play target
  useEffect(() => {
    if (!play) return;
    let rafId;
    const speed = 320; // px/s
    let last = performance.now();
    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      setPos((p) => {
        if (!play) return p;
        const targetX = play.x - catSize.w / 2;
        const targetY = play.y - catSize.h / 2;
        const dx = targetX - p.left;
        const dy = targetY - p.top;
        const dist = Math.hypot(dx, dy);
        // update facing direction (no rotation)
        dirRef.current = dx < 0 ? -1 : 1;
        // Catch detection with hysteresis
        const catchRadius = play.kind === 'ball' ? 28 : 26;
        const releaseRadius = 42;
        if (dist <= catchRadius) {
          if (!nearRef.current) {
            nearRef.current = true;
            if (play.kind === 'mouse') {
              attemptsRef.current += 1;
              if (attemptsRef.current >= 3) {
                setBubbleSize('big');
                setMessage('😄🎉');
                if (hideTimeout.current) clearTimeout(hideTimeout.current);
                hideTimeout.current = setTimeout(() => setMessage(null), 3000);
                setTimeout(() => { onCatch && onCatch(); }, 900);
              }
            } else {
              setBubbleSize('big');
              setMessage('😄🎉');
              if (hideTimeout.current) clearTimeout(hideTimeout.current);
              hideTimeout.current = setTimeout(() => setMessage(null), 3000);
              setTimeout(() => { onCatch && onCatch(); }, 900);
            }
          }
        } else if (dist > releaseRadius) {
          nearRef.current = false;
        }
        if (dist < 4) return p;
        const step = Math.min(dist, speed * dt);
        const nx = p.left + (dx / (dist || 1)) * step;
        const ny = p.top + (dy / (dist || 1)) * step;
        // keep within viewport
        const vw = window.innerWidth, vh = window.innerHeight;
        const left = Math.max(0, Math.min(nx, vw - catSize.w));
        const top = Math.max(0, Math.min(ny, vh - catSize.h));
        return { top, left };
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [play, catSize.w, catSize.h, onCatch]);

  // Reset attempts when a new play starts
  useEffect(() => {
    attemptsRef.current = 0;
    nearRef.current = false;
  }, [play?.id]);

  const flip = dirRef.current < 0 ? -1 : 1;

  return (
    <div
      className={`cat-sprite ${play ? 'running' : 'idle'}`}
      style={{ top: pos.top, left: pos.left }}
      aria-hidden
      role="button"
      tabIndex={0}
      title="Klick für Schnurren"
      onClick={(e) => { e.stopPropagation(); showPurr(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPurr(); } }}
    >
      <div className="cat-body" style={{ transform: `scaleX(${flip})` }}>
        <CatVariant index={variant} active={!!play} />
      </div>
      <div className={`cat-shadow ${play ? 'run' : ''}`} />
      {message && (
        <div className={`cat-bubble ${bubbleSize === 'big' ? 'big' : ''} ${ (pos.left > (typeof window !== 'undefined' ? (window.innerWidth - (120 + 280)) : 100000)) ? 'left' : 'right' }`}>
          {message}
          <span className="cat-bubble-tail" />
        </div>
      )}
    </div>
  );
}
