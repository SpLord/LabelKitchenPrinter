import { useEffect, useMemo, useRef, useState } from 'react';
import ShellGame from './ShellGame.jsx';

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


export default function CatSprite({ play, onCatch, debugUi = false, laserMode = false, onToggleLaser, setSuppressSpawn }) {
  const [pos, setPos] = useState({ top: 20, left: 20 });
  const [variant, setVariant] = useState(() => Math.floor(Math.random() * VARIANTS.length));
  const [message, setMessage] = useState(null);
  const [bubbleSize, setBubbleSize] = useState('normal');
  const [trumpetActive, setTrumpetActive] = useState(false);
  const [spray, setSpray] = useState(null); // water spray particles
  const [spraying, setSpraying] = useState(false);
  const [puddles, setPuddles] = useState([]); // accumulated water spots
  const [waterProgress, setWaterProgress] = useState(0); // 0..1 visual fill toward half screen
  const sprayIntervalRef = useRef(null);
  const sprayedAreaRef = useRef(0);
  const catSize = useMemo(() => ({ w: 120, h: 120 }), []);
  const hideTimeout = useRef(null);
  const dirRef = useRef(1); // 1 right, -1 left
  const attemptsRef = useRef(0);
  const nearRef = useRef(false);
  // Elephant removed
  const [droppings, setDroppings] = useState([]);
  const posRef = useRef(pos);
  const [coins, setCoins] = useState([]); // ephemeral pop animations
  const [coinCount, setCoinCount] = useState(0);
  const [coinWallet, setCoinWallet] = useState(0); // spendable coins for purchases
  const [coinsLoaded, setCoinsLoaded] = useState(false);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [fireworks, setFireworks] = useState([]);
  const [fwShown, setFwShown] = useState(false); // legacy, kept for safety
  const [fwDone, setFwDone] = useState(false);   // persisted: prevent re-trigger after reload
  const fwIntervalRef = useRef(null);
  const fwStartedRef = useRef(false);
  const counterClicksRef = useRef(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [x2Active, setX2Active] = useState(false);
  const [magnetActive, setMagnetActive] = useState(false);
  // Visual effect states
  const [sparkles, setSparkles] = useState([]); // around cat
  const [footprints, setFootprints] = useState([]); // short-lived paw prints
  const [rainbowDots, setRainbowDots] = useState([]); // trail dots
  const [confetti, setConfetti] = useState([]); // small bursts
  const [paradeActive, setParadeActive] = useState(false); // emoji banner
  const [capeVisible, setCapeVisible] = useState(false);
  const [goldOutlineActive, setGoldOutlineActive] = useState(false);
  const unlockedRef = useRef({});
  // Treats mini-game
  const [treats, setTreats] = useState([]); // {id,x,y,vy,kind}
  const [shellOpen, setShellOpen] = useState(false);
  const [showUnlocks, setShowUnlocks] = useState(false);
  // Pet care
  const clamp01 = (v) => Math.max(0, Math.min(100, v));
  const [hunger, setHunger] = useState(() => {
    const v = Number(localStorage.getItem('cat_hunger')); return Number.isFinite(v) ? clamp01(v) : 80;
  });
  const [thirst, setThirst] = useState(() => {
    const v = Number(localStorage.getItem('cat_thirst')); return Number.isFinite(v) ? clamp01(v) : 80;
  });
  useEffect(()=>{ try{ localStorage.setItem('cat_hunger', String(hunger)); }catch{} }, [hunger]);
  useEffect(()=>{ try{ localStorage.setItem('cat_thirst', String(thirst)); }catch{} }, [thirst]);
  // degrade over time
  useEffect(() => {
    const id = setInterval(() => {
      setHunger((v) => clamp01(v - 1));
      setThirst((v) => clamp01(v - 1));
    }, 30000); // every 30s -1%
    return () => clearInterval(id);
  }, []);
  // Placement state
  const [placing, setPlacing] = useState(null); // { kind: 'food'|'water', fill:number, cost:number, label:string, emoji:string }
  const [placedItem, setPlacedItem] = useState(null); // { id, kind, x, y, emoji, fill }
  const [internalPlay, setInternalPlay] = useState(null); // mirrors placed item for chase

  // Cookie helpers for session persistence (fallback to localStorage)
  const getCookie = (name) => {
    try {
      const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/\+^])/g, '\\$1') + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    } catch { return null; }
  };
  const setCookie = (name, value, days = 30) => {
    try {
      const d = new Date();
      d.setTime(d.getTime() + days*24*60*60*1000);
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${d.toUTCString()}`;
    } catch {}
  };

  // Read persisted fireworks-done flag on mount
  useEffect(() => {
    try {
      const v = getCookie('cat_fwDone') ?? localStorage.getItem('cat_fwDone');
      if (v === '1') {
        setFwDone(true);
        fwStartedRef.current = true; // ensure effect won't start
      }
    } catch {}
  }, []);

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

  const celebrates = useMemo(
    () => [
      '😸', '😺', '😻', '😁', '🤩', '🥳', '😆', '😃', '😊', '😄',
      '😸🎉', '😺🎊', '😻✨', '🥳🎉', '🤩✨', '😄🎊'
    ],
    []
  );

  const showCelebrate = () => {
    const msg = celebrates[Math.floor(Math.random() * celebrates.length)];
    setBubbleSize('big');
    setMessage(msg);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setMessage(null), 3000);
    setTimeout(() => { onCatch && onCatch(); }, 900);
  };

  // Helpers to trigger visual effects
  const triggerSparkles = () => {
    const cx = posRef.current.left + catSize.w / 2;
    const cy = posRef.current.top + catSize.h / 2;
    const parts = Array.from({ length: 14 }).map((_, i) => ({ id: 'sp'+Date.now()+i, x: cx + (Math.random()*80-40), y: cy + (Math.random()*60-30) }));
    setSparkles(parts);
    setTimeout(() => setSparkles([]), 1600);
  };
  const triggerFootprints = () => {
    const baseX = posRef.current.left + catSize.w/2 - 20;
    const baseY = posRef.current.top + catSize.h - 10;
    const prints = Array.from({ length: 8 }).map((_, i) => ({ id: 'fp'+Date.now()+i, x: baseX + i*10, y: baseY + (i%2?6:-6) }));
    setFootprints(prints);
    setTimeout(() => setFootprints([]), 2000);
  };
  const startRainbowTrail = (ms=3000) => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = Date.now();
      if (t-start > ms) { clearInterval(id); return; }
      const x = posRef.current.left + catSize.w/2;
      const y = posRef.current.top + catSize.h/2;
      const hue = Math.floor((t/20)%360);
      const dot = { id: 'rb'+t+Math.random(), x, y, c: `hsl(${hue}deg 90% 60%)` };
      setRainbowDots((prev)=>{
        const merged = prev.concat(dot);
        return merged.length>150 ? merged.slice(merged.length-150) : merged;
      });
    }, 60);
    setTimeout(()=> setRainbowDots([]), ms+800);
  };
  const triggerConfetti = (strong=false) => {
    const vw = window.innerWidth||1200, vh = window.innerHeight||800;
    const n = strong? 120: 40;
    const parts = Array.from({ length: n }).map((_,i)=>({ id:'cf'+Date.now()+i, x: Math.random()*vw, y: -20-Math.random()*60, c: `hsl(${Math.floor(Math.random()*360)}deg 90% 60%)`, d: 800+Math.random()*800 }));
    setConfetti((prev)=> prev.concat(parts));
    setTimeout(()=> setConfetti([]), strong? 1800: 1000);
  };
  const startShake = () => {
    document.documentElement.classList.add('shake');
    setTimeout(()=> document.documentElement.classList.remove('shake'), 100);
  };
  const startParade = () => {
    setParadeActive(true);
    setTimeout(()=> setParadeActive(false), 1200);
  };
  const showCape = () => { setCapeVisible(true); setTimeout(()=> setCapeVisible(false), 5000); };
  const startGoldOutline = () => { setGoldOutlineActive(true); setTimeout(()=> setGoldOutlineActive(false), 10000); };

  // Milestone triggers on coin thresholds (once per session)
  const lastCoinsRef = useRef(0);
  useEffect(()=>{
    if (!coinsLoaded) return;
    const c = coinCount;
    const mark = (key, fn) => { if (!unlockedRef.current[key] && c >= Number(key)) { unlockedRef.current[key]=true; fn&&fn(); } };
    // 5 sparkles when collecting up to 10
    mark(5, triggerSparkles);
    mark(10, ()=> setMessage('Miau!'));
    mark(15, triggerFootprints);
    mark(20, ()=> triggerConfetti(false));
    mark(25, ()=> startRainbowTrail());
    // 35: quest (simple bonus if +5 coins in 60s)
  if (!unlockedRef.current['35'] && c>=35){
      unlockedRef.current['35']=true;
      const start = coinCount;
      const t0 = Date.now();
      const int = setInterval(()=>{
        if (Date.now()-t0>60000){ clearInterval(int); return; }
    if (coinCount - start >= 5){ setCoinCount(v=>v+3); setCoinWallet(v=>v+3); clearInterval(int); setMessage('Bonus +3!'); setTimeout(()=>setMessage(null),1500);} 
      }, 500);
    }
    mark(40, ()=> { setX2Active(true); setTimeout(()=> setX2Active(false), 10000); });
    // 50 crown already handled by render
    mark(60, ()=> triggerConfetti(false));
    mark(70, ()=> { startShake(); setMessage('Super Miau!'); setTimeout(()=> setMessage(null), 800); });
    mark(75, startParade);
    mark(80, triggerFootprints);
    mark(90, showCape);
    // 100 fireworks handled separately
    mark(110, ()=> triggerConfetti(true));
    mark(150, ()=> triggerConfetti(true));
    mark(200, startGoldOutline);
    // 250 deluxe crown handled via CSS shimmer
    mark(300, ()=> { setMessage('Miau Miau Miau!'); setTimeout(()=> setMessage(null), 1200); });
    mark(400, ()=> triggerConfetti(false));
    mark(500, ()=> triggerConfetti(true));
    // 750 / 1000 handled via panel unlocks (we already have panel)
    lastCoinsRef.current = c;
  }, [coinCount, coinsLoaded]);
  const showTrumpet = () => {
    setTrumpetActive(true);
    setBubbleSize('big');
    setMessage('Töröö!');
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => { setMessage(null); setTrumpetActive(false); }, 1800);
    setTimeout(() => { onCatch && onCatch(); }, 900);
  };

  // Trigger a short coin shower animation (drops temporary coins from the top)
  const triggerCoinShower = () => {
    const vw = window.innerWidth || 1200;
    const items = Array.from({ length: 20 }).map((_, i) => ({ id: 'r' + Date.now() + i, x: Math.random() * vw, y: -20 - Math.random() * 80 }));
    // Reuse coin pop layer for simple rain effect
    setCoins((prev) => prev.concat(items.map(it => ({ id: it.id, x: it.x, y: it.y }))));
    // Cleanup rain coins after ~1.2s (animation time)
    setTimeout(() => setCoins((prev) => prev.filter((c) => !String(c.id).startsWith('r'))), 1200);
  };

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

  // (no trunk anchor needed; no water effects)

  const triggerSpray = () => {
    // Water removed: just trumpet, keep elephant look during message
    setTrumpetActive(true);
    setBubbleSize('big');
    setMessage('Töröö!');
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => { setMessage(null); setTrumpetActive(false); }, 1800);
    setTimeout(() => { onCatch && onCatch(); }, 900);
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
    const target = internalPlay || play;
    if (!target) return;
    let rafId;
    // base speed; adjusted when elephant
    const baseSpeed = 320; // px/s
    let last = performance.now();
    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      setPos((p) => {
        if (!(internalPlay || play)) return p;
        const active = internalPlay || play;
        const targetX = active.x - catSize.w / 2;
        const targetY = active.y - catSize.h / 2;
        let dx = targetX - p.left;
        let dy = targetY - p.top;
        let edgeSeverity = 0; // 0..1 how close to an edge
        // Edge repulsion off (elephant removed)
        const dist = Math.hypot(dx, dy);
        // update facing direction (no rotation)
        dirRef.current = dx < 0 ? -1 : 1;
        // Strict catch detection with generous window: toy circle intersects expanded cat rectangle
        const toyR = active.kind === 'ball' ? 14 : active.kind === 'mouse' ? 12 : 16;
        const pad = active.kind === 'ball' ? 22 : active.kind === 'mouse' ? 16 : 22; // food/water capture a bit wider
        const cx = active.x;
        const cy = active.y;
        const leftR = p.left - pad;
        const topR = p.top - pad;
        const rightR = p.left + catSize.w + pad;
        const bottomR = p.top + catSize.h + pad;
        const closestX = Math.max(leftR, Math.min(cx, rightR));
        const closestY = Math.max(topR, Math.min(cy, bottomR));
        const dxr = cx - closestX;
        const dyr = cy - closestY;
        const intersects = dxr * dxr + dyr * dyr <= toyR * toyR;
        if (intersects) {
          if (active.kind === 'food' || active.kind === 'water') {
            // consume
            if (placedItem && placedItem.id === active.id) {
              if (active.kind === 'food') setHunger((v) => clamp01(v + (placedItem.fill || 0)));
              if (active.kind === 'water') setThirst((v) => clamp01(v + (placedItem.fill || 0)));
              setPlacedItem(null);
            }
            setInternalPlay(null);
            // clear external play only if laser to avoid overriding toys
            if (play && play.kind === 'laser') { onCatch && onCatch(); }
            // small message
            setBubbleSize('normal');
            setMessage(active.kind === 'food' ? 'Nom nom~' : 'Schlürf~');
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
            hideTimeout.current = setTimeout(() => setMessage(null), 1200);
          } else {
          if (!nearRef.current) {
            nearRef.current = true;
            if (active.kind === 'mouse') {
              attemptsRef.current += 1;
              if (attemptsRef.current >= 3) {
                showCelebrate();
              }
            } else {
              showCelebrate();
            }
          }
          }
        } else {
          nearRef.current = false;
        }
        if (dist < 4) return p;
        let speed = baseSpeed;
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
  }, [play, internalPlay, placedItem, catSize.w, catSize.h, onCatch]);

  // No water effects anymore

  // Keep latest position in ref for timers
  useEffect(() => { posRef.current = pos; }, [pos]);

  // Drop a pile at random time within each 3h window; max 4 at once (persistent schedule)
  useEffect(() => {
    const PERIOD = 3 * 60 * 60 * 1000; // 3 hours
    const MIN = 30 * 60 * 1000; // 30 minutes
    const STORAGE_NEXT = 'cat_drop_next';
    let timeoutId;
    let cancelled = false;

    const planNext = (baseNow = Date.now()) => {
      const delay = MIN + Math.floor(Math.random() * Math.max(1, PERIOD - MIN)); // 30min..3h
      const nextTs = baseNow + delay;
      try { localStorage.setItem(STORAGE_NEXT, String(nextTs)); } catch {}
      return delay;
    };

    const doDrop = () => {
      const cur = posRef.current;
      const x = cur.left + catSize.w / 2;
      const y = cur.top + catSize.h - 6;
      const size = 16 + Math.floor(Math.random() * 10);
      const rot = Math.floor(Math.random() * 50) - 25; // -25..25 deg
      setDroppings((prev) => {
        if (prev.length >= 4) return prev; // cap at 4
        return prev.concat({ id: Date.now() + Math.random(), x, y, s: size, r: rot });
      });
      // After dropping, cat moves a bit away (forward + slightly up), clamped to viewport
      const dir = dirRef.current >= 0 ? 1 : -1;
      const stepX = 24 * dir;
      const stepY = -10;
      const vw = window.innerWidth || 1920;
      const vh = window.innerHeight || 1080;
      const newLeft = Math.max(0, Math.min(cur.left + stepX, vw - catSize.w));
      const newTop = Math.max(0, Math.min(cur.top + stepY, vh - catSize.h));
      setPos({ top: newTop, left: newLeft });
      // schedule and persist next
      if (!cancelled) {
        const delay = planNext(Date.now());
        timeoutId = setTimeout(() => { doDrop(); }, delay);
      }
    };

    const start = () => {
      if (cancelled) return;
      let nextTs = NaN;
      try {
        const v = localStorage.getItem(STORAGE_NEXT);
        if (v != null) nextTs = parseInt(v, 10);
      } catch {}
      const now = Date.now();
      if (Number.isFinite(nextTs)) {
        const delta = nextTs - now;
        if (delta > 1000) {
          timeoutId = setTimeout(() => { doDrop(); }, delta);
        } else {
          // overdue or very near: drop soon and reschedule
          timeoutId = setTimeout(() => { doDrop(); }, 1200);
        }
      } else {
        const delay = planNext(now);
        timeoutId = setTimeout(() => { doDrop(); }, delay);
      }
    };

    start();
    return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId); };
  }, [catSize.w, catSize.h]);

  const onDropClick = (e, id, x, y) => {
    e.stopPropagation();
    // remove dropping
  setDroppings((prev) => prev.filter((d) => d.id !== id));
    // spawn coin pop
    const coinId = Date.now() + Math.random();
    setCoins((prev) => prev.concat({ id: coinId, x, y }));
  const add = 1 + (x2Active ? 1 : 0) + (magnetActive ? 1 : 0);
  setCoinCount((c) => c + add);
  setCoinWallet((c) => c + add);
    // cleanup coin after animation (~900ms)
    setTimeout(() => {
      setCoins((prev) => prev.filter((c) => c.id !== coinId));
    }, 1000);
  };

  // Treats spawn: falling snacks to click for bonus coins
  const startTreats = () => {
    const vw = window.innerWidth || 1200;
    const batch = Array.from({ length: 10 }).map((_, i) => ({
      id: 't' + Date.now() + i,
      x: Math.random() * vw,
      y: -20 - Math.random() * 100,
      vy: 120 + Math.random() * 120,
      kind: Math.random() < 0.5 ? 'fish' : 'chicken'
    }));
    setTreats(batch);
  };
  useEffect(() => {
    if (treats.length === 0) return;
    let raf;
    let last = performance.now();
    const step = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      setTreats((prev) => {
        const vh = window.innerHeight || 800;
        const next = prev.map(it => ({ ...it, y: it.y + it.vy * dt })).filter(it => it.y < vh + 40);
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [treats.length]);
  const onTreatClick = (e, id, x, y) => {
    e.stopPropagation();
  setTreats((prev) => prev.filter((t) => t.id !== id));
    const coinId = 'tc' + Date.now() + Math.random();
    setCoins((prev) => prev.concat({ id: coinId, x, y }));
  const add = 1 + (x2Active ? 1 : 0) + (magnetActive ? 1 : 0);
  setCoinCount((c) => c + add);
  setCoinWallet((c) => c + add);
    setTimeout(() => setCoins((prev) => prev.filter((c) => c.id !== coinId)), 1000);
  };

  // Persist coin count: read from cookie/localStorage; write to both
  useEffect(() => {
    try {
      const c = getCookie('cat_coinCount');
      if (c != null) {
        const n = parseInt(c, 10);
        if (!Number.isNaN(n)) { setCoinCount(n); setCoinsLoaded(true); return; }
      }
      const saved = localStorage.getItem('cat_coinCount');
      if (saved != null) setCoinCount(parseInt(saved, 10) || 0);
      setCoinsLoaded(true);
    } catch {}
  }, []);
  useEffect(() => {
    if (!coinsLoaded) return;
    try { localStorage.setItem('cat_coinCount', String(coinCount)); } catch {}
    setCookie('cat_coinCount', String(coinCount));
  }, [coinCount, coinsLoaded]);

  // Wallet: load after coins loaded (seed from lifetime if absent on first run)
  useEffect(() => {
    if (!coinsLoaded || walletLoaded) return;
    try {
      const c = getCookie('cat_coinWallet');
      if (c != null) {
        const n = parseInt(c, 10);
        if (!Number.isNaN(n)) { setCoinWallet(n); setWalletLoaded(true); return; }
      }
      const saved = localStorage.getItem('cat_coinWallet');
      if (saved != null) {
        setCoinWallet(parseInt(saved, 10) || 0);
        setWalletLoaded(true);
        return;
      }
      // Seed: if no wallet persisted, initialize with current lifetime coins
      setCoinWallet(coinCount);
      setWalletLoaded(true);
    } catch {
      setWalletLoaded(true);
    }
  }, [coinsLoaded, walletLoaded, coinCount]);
  useEffect(() => {
    if (!walletLoaded) return;
    try { localStorage.setItem('cat_coinWallet', String(coinWallet)); } catch {}
    setCookie('cat_coinWallet', String(coinWallet));
  }, [coinWallet, walletLoaded]);

  // Placement click handler
  useEffect(() => {
    if (!placing) return;
    setSuppressSpawn && setSuppressSpawn(true);
    const onClick = (e) => {
      // block other click handlers (prevents toy spawn)
      e.preventDefault();
      e.stopPropagation();
      // ignore clicks inside panels or cat
      if (
        e.target.closest('.gimmick-panel') ||
        e.target.closest('.gimmick-toggle') ||
        e.target.closest('.status-indicator') ||
        e.target.closest('.main-layout')
      ) return;
      const x = e.clientX; const y = e.clientY;
      const id = 'pi' + Date.now();
      const item = { id, kind: placing.kind, x, y, emoji: placing.emoji, fill: placing.fill };
      setPlacedItem(item);
      setInternalPlay({ id, kind: placing.kind, x, y });
      setPlacing(null);
      // release suppression after this event cycle
      setTimeout(() => { setSuppressSpawn && setSuppressSpawn(false); }, 0);
    };
    document.addEventListener('click', onClick, true);
    return () => { document.removeEventListener('click', onClick, true); setSuppressSpawn && setSuppressSpawn(false); };
  }, [placing, setSuppressSpawn]);

  // Food options (cost fills hunger); water fills thirst, free
  const FOOD_OPTIONS = [
    { key: 'dry', label: 'Trockenfutter', emoji: '🍖', cost: 3, fill: 20 },
    { key: 'wet', label: 'Nassfutter', emoji: '🥫', cost: 5, fill: 35 },
    { key: 'treat', label: 'Leckerli', emoji: '🐟', cost: 1, fill: 10 },
  ];
  const startPlaceFood = (opt) => {
    if (!debugUi && coinWallet < opt.cost) { setMessage('Nicht genug Kaufmünzen'); setTimeout(()=>setMessage(null), 1000); return; }
    if (!debugUi) setCoinWallet((c) => Math.max(0, c - opt.cost));
    setPlacing({ kind: 'food', fill: opt.fill, cost: opt.cost, label: opt.label, emoji: opt.emoji });
  };
  const startPlaceWater = () => {
    setPlacing({ kind: 'water', fill: 30, cost: 0, label: 'Wasser', emoji: '💧' });
  };

  // Trigger fireworks once when reaching 100 coins
  useEffect(() => {
    if (coinCount >= 100 && !fwStartedRef.current && !fwDone) {
      fwStartedRef.current = true;
      setFwDone(true);
      // persist that fireworks already shown
      try { localStorage.setItem('cat_fwDone', '1'); } catch {}
      setCookie('cat_fwDone', '1');
      const palette = [
        ['#fffb00', '#ff9f0a'],
        ['#ff375f', '#ff9f0a'],
        ['#32d74b', '#0a84ff'],
        ['#a78bfa', '#0066cc'],
        ['#ff3b30', '#ffd60a'],
      ];
      const emitBurst = () => {
        const vw = window.innerWidth || 1200;
        const vh = window.innerHeight || 800;
        const centers = Array.from({ length: 4 }).map((_, i) => ({
          x: Math.round((vw / 5) * (i + 0.7) + (Math.random() - 0.5) * 30),
          y: Math.round(vh * (0.22 + Math.random() * 0.26)),
        }));
        const newParts = [];
        centers.forEach((c) => {
          const count = 20;
          for (let k = 0; k < count; k++) {
            const ang = (Math.PI * 2 * k) / count + (Math.random() - 0.5) * 0.5;
            const R = 180 + Math.random() * 200;
            const [c1, c2] = palette[Math.floor(Math.random() * palette.length)];
            const s = 14 + Math.floor(Math.random() * 10);
            const d = 1200 + Math.random() * 900;
            newParts.push({ id: `${c.x}-${c.y}-${k}-${Math.random()}`, x: c.x, y: c.y, tx: Math.cos(ang) * R, ty: Math.sin(ang) * R, d, c1, c2, s });
          }
        });
        setFireworks((prev) => {
          const merged = prev.concat(newParts);
          const MAX = 1200;
          return merged.length > MAX ? merged.slice(merged.length - MAX) : merged;
        });
      };
      // run for ~30s
      const start = Date.now();
      emitBurst();
      fwIntervalRef.current = setInterval(() => {
        if (Date.now() - start >= 30000) {
          clearInterval(fwIntervalRef.current);
          fwIntervalRef.current = null;
          setTimeout(() => setFireworks([]), 3000);
        } else {
          emitBurst();
        }
      }, 1000);
    }
  }, [coinCount, fwDone]);
  useEffect(() => () => { if (fwIntervalRef.current) clearInterval(fwIntervalRef.current); }, []);

  // Reset attempts when a new play starts (elephant removed)
  useEffect(() => {
    attemptsRef.current = 0;
    nearRef.current = false;
  }, [play?.id]);

  const flip = dirRef.current < 0 ? -1 : 1;

  // Force open panel in BATCAT mode
  useEffect(() => {
    if (debugUi) setPanelOpen(true);
  }, [debugUi]);

  // Unlock flags and availability
  const unlocked = {
    coinShower: debugUi || coinCount >= 30,
    treats: debugUi || coinCount >= 45,
    feed: debugUi || coinCount >= 50,
    x2: debugUi || coinCount >= 60,
    laser: debugUi || coinCount >= 75,
    shell: debugUi || coinCount >= 90,
    magnet: debugUi || coinCount >= 120,
  };
  const hasAnyUnlocked = Object.values(unlocked).some(Boolean);
  const unlockItems = [
    { key: 'treats', label: 'Leckerlis', thr: 45 },
    { key: 'feed', label: 'Füttern & Wasser', thr: 50 },
    { key: 'laser', label: 'Laserpointer', thr: 75 },
    { key: 'shell', label: 'Hütchenspiel', thr: 90 },
    { key: 'magnet', label: 'Magnet', thr: 120 },
  ];

  return (
    <>
      {/* Coin counter shows after first coin */}
  {(debugUi || coinCount > 0) && (
        <div
          className="coin-counter"
          aria-hidden
          title="Klicke 20x zum Zurücksetzen"
          onClick={(e) => {
            e.stopPropagation();
            counterClicksRef.current += 1;
            if (counterClicksRef.current >= 20) {
              counterClicksRef.current = 0;
              setCoinCount(0);
            }
          }}
        >
          <span className="coin-ico">🪙</span>
          <span className="coin-num">{coinCount}</span>
          {(debugUi || coinCount >= 50) && (
            <span className="coin-wallet" title="Kaufmünzen">💼 {coinWallet}</span>
          )}
          {x2Active && <span className="fx-badge">x2</span>}
          {magnetActive && <span className="fx-badge">🧲</span>}
          {(debugUi || coinCount >= 50) && (
            <>
              <span className="pet-stat" title="Hunger">🍽️ {Math.round(hunger)}%</span>
              <span className="pet-stat" title="Durst">💧 {Math.round(thirst)}%</span>
            </>
          )}
          {hasAnyUnlocked && (
            <button
              className="gimmick-toggle-inline"
              onClick={(e)=> {
                e.stopPropagation();
                setShowUnlocks(false);
                setPanelOpen(v=>!v);
              }}
              title="Gimmicks"
            >✨</button>
          )}
          {hasAnyUnlocked && (
            <button
              className="gimmick-toggle-inline"
              onClick={(e)=> {
                e.stopPropagation();
                setPanelOpen(false);
                setShowUnlocks(v=>!v);
              }}
              title="Freischaltungen"
            >📜</button>
          )}
        </div>
      )}
      {showUnlocks && (
        <div className="gimmick-panel top" onClick={(e) => e.stopPropagation()}>
          <div className="gimmick-title">Freischaltungen</div>
          <div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
            {(debugUi ? unlockItems : unlockItems.filter(it => coinCount >= it.thr)).map(it => (
              <div key={it.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--surface)' }}>
                <span style={{ fontWeight: 600 }}>{coinCount >= it.thr ? '✅' : '🔒'} {it.label}</span>
                <span style={{ color: 'var(--muted)' }}>{it.thr} 🪙</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button onClick={() => setShowUnlocks(false)}>Schließen</button>
          </div>
        </div>
      )}
      {hasAnyUnlocked && panelOpen && (
        <div className="gimmick-panel top" onClick={(e) => e.stopPropagation()}>
          <div className="gimmick-title">Gimmicks</div>
          <button onClick={() => { setPanelOpen(false); setShowUnlocks(true); }}>📜 Freischaltungen</button>
          {unlocked.coinShower && (
            <button onClick={triggerCoinShower}>Coin‑Shower</button>
          )}
          <button onClick={() => setDroppings([])}>Poops entfernen</button>
          {unlocked.treats && (
            <button onClick={startTreats}>Leckerlis</button>
          )}
          {unlocked.laser && (
            <button onClick={onToggleLaser}>{laserMode ? '🔴 Laser an' : '⚪️ Laser aus'}</button>
          )}
          {unlocked.feed && (
            <>
              <div style={{ fontWeight: 700, marginTop: 6 }}>Füttern</div>
              {FOOD_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => startPlaceFood(opt)}>
                  {opt.emoji} {opt.label} (−{opt.cost}🪙, +{opt.fill}% Hunger)
                </button>
              ))}
              <button onClick={startPlaceWater}>💧 Wasser (kostenlos, +30% Durst)</button>
            </>
          )}
          {unlocked.shell && (
            <button onClick={() => setShellOpen(true)}>Hütchenspiel</button>
          )}
          {unlocked.x2 && (
            <button onClick={() => { setX2Active(true); setTimeout(() => setX2Active(false), 10000); }}>x2 Coins (10s)</button>
          )}
          {unlocked.magnet && (
            <button onClick={() => { setMagnetActive(true); setTimeout(() => setMagnetActive(false), 15000); }}>Magnet (15s)</button>
          )}
        </div>
      )}
      {confetti.length > 0 && (
        <div className="confetti-layer" aria-hidden>
          {confetti.map((q)=> (
            <span key={q.id} className="confetti" style={{ left: q.x, top: q.y, background: q.c, animationDuration: `${q.d}ms` }} />
          ))}
        </div>
      )}
      {sparkles.length > 0 && (
        <div className="sparkle-layer" aria-hidden>
          {sparkles.map((s)=> (
            <span key={s.id} className="sparkle" style={{ left: s.x, top: s.y }} />
          ))}
        </div>
      )}
      {footprints.length > 0 && (
        <div className="footprint-layer" aria-hidden>
          {footprints.map((f)=> (
            <span key={f.id} className="footprint" style={{ left: f.x, top: f.y }}>🐾</span>
          ))}
        </div>
      )}
      {rainbowDots.length > 0 && (
        <div className="rainbow-layer" aria-hidden>
          {rainbowDots.map((r)=> (
            <span key={r.id} className="rainbow-dot" style={{ left: r.x, top: r.y, background: r.c }} />
          ))}
        </div>
      )}
      {paradeActive && (
        <div className="emoji-parade" aria-hidden>😺 🐟 🧀 🪙 🎉 😻 ✨</div>
      )}
      {/* Fireworks layer (already rendered above when active) */}
      {false && fireworks.length > 0 && (
        <div className="fw-layer" aria-hidden>
          {fireworks.map((p) => (
            <span
              key={p.id}
              className="fw-particle"
              style={{
                left: p.x,
                top: p.y,
                ['--tx']: `${p.tx}px`,
                ['--ty']: `${p.ty}px`,
                animationDuration: `${p.d}ms`,
                width: `${p.s}px`,
                height: `${p.s}px`,
                background: `radial-gradient(circle at 30% 30%, #fff, ${p.c1} 45%, ${p.c2} 100%)`,
              }}
            />
          ))}
        </div>
      )}
      {/* Droppings and coins layers */}
      {(droppings.length > 0) && (
        <div className="dropping-layer">
          {droppings.map((d) => (
            <span
              key={d.id}
              className="dropping"
              onClick={(e) => onDropClick(e, d.id, d.x, d.y)}
              title="Sammle Münze"
              style={{ left: d.x, top: d.y, fontSize: `${d.s}px`, transform: `translate(-50%, -50%) rotate(${d.r}deg)` }}
            >
              💩
            </span>
          ))}
        </div>
      )}
      {(treats.length > 0) && (
        <div className="coin-rain-layer" aria-hidden>
          {treats.map((t) => (
            <span
              key={t.id}
              className="treat"
              onClick={(e) => onTreatClick(e, t.id, t.x, t.y)}
              style={{ left: t.x, top: t.y }}
              title="Leckerli"
            >{t.kind === 'fish' ? '🐟' : '🍗'}</span>
          ))}
        </div>
      )}
      {placedItem && (
        <div className="placed-layer" aria-hidden>
          <span className="placed-item" style={{ left: placedItem.x, top: placedItem.y }}>
            {placedItem.emoji}
          </span>
        </div>
      )}
      {(coins.length > 0) && (
        <div className="coin-layer" aria-hidden>
          {coins.map((c) => (
            <span key={c.id} className="coin-pop" style={{ left: c.x, top: c.y }}>🪙</span>
          ))}
        </div>
      )}
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
      {/* Crown after 50 coins */}
      {(debugUi || coinCount >= 50) && <div className="cat-crown" aria-hidden>👑</div>}
      <div className={`cat-shadow ${play ? 'run' : ''}`} />
      {message && (
        <div className={`cat-bubble ${bubbleSize === 'big' ? 'big' : ''} ${ (pos.left > (typeof window !== 'undefined' ? (window.innerWidth - (120 + 280)) : 100000)) ? 'left' : 'right' }`}>
          {message}
          <span className="cat-bubble-tail" />
        </div>
      )}
  {/* Menü über der Katze entfernt – Bedienung nur über das obere Gimmick-Menü */}
  {shellOpen && (
        <ShellGame
          onClose={() => setShellOpen(false)}
          onResult={(add) => { setCoinCount((c) => c + add); setCoinWallet((c)=> c + add); }}
        />
      )}
      </div>
    </>
  );
}
