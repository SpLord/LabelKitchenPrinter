import { useEffect, useRef } from 'react';

export default function PlayOverlay({ play, setPlay }) {
  const nodeRef = useRef(null);
  const vxRef = useRef(0);
  const vyRef = useRef(0);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const startRef = useRef(0);
  const durRef = useRef(0);
  const rafRef = useRef(0);
  const frameCountRef = useRef(0);
  useEffect(() => {
    if (!play) return;
    // Initialize physics refs
    xRef.current = play.x ?? 0;
    yRef.current = play.y ?? 0;
    const baseSpeed = play.kind === 'ball' ? 320 : 240;
    const ang = Math.random() * Math.PI * 2;
    vxRef.current = Math.cos(ang) * baseSpeed;
    vyRef.current = Math.sin(ang) * baseSpeed;
    startRef.current = performance.now();
    durRef.current = (30 + Math.random() * 15) * 1000; // 30-45s
    frameCountRef.current = 0;

    let last = performance.now();

    const step = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      // Physics integration
      let x = xRef.current;
      let y = yRef.current;
      let vx = vxRef.current;
      let vy = vyRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (play.kind === 'ball') {
        const friction = 0.996;
        vx *= friction;
        vy *= friction;
        x += vx * dt;
        y += vy * dt;
        const r = 14;
        if (x < r) { x = r; vx = Math.abs(vx); }
        if (x > vw - r) { x = vw - r; vx = -Math.abs(vx); }
        if (y < r) { y = r; vy = Math.abs(vy); }
        if (y > vh - r) { y = vh - r; vy = -Math.abs(vy); }
      } else {
        // mouse random walk
        const speed = 230;
        vx += (Math.random() * 2 - 1) * 40;
        vy += (Math.random() * 2 - 1) * 40;
        const len = Math.hypot(vx, vy) || 1;
        vx = (vx / len) * speed;
        vy = (vy / len) * speed;
        x += vx * dt;
        y += vy * dt;
        const m = 10;
        if (x < m || x > vw - m) vx = -vx;
        if (y < m || y > vh - m) vy = -vy;
      }

      // Persist refs
      xRef.current = x; yRef.current = y; vxRef.current = vx; vyRef.current = vy;

      // Move DOM directly
      if (nodeRef.current) {
        const r = play.kind === 'ball' ? 14 : 12;
        nodeRef.current.style.transform = `translate3d(${x - r}px, ${y - r}px, 0)`;
      }

      // Occasionally update React state so the cat can chase
      frameCountRef.current++;
      if (frameCountRef.current % 3 === 0) {
        const start = startRef.current;
        const elapsed = t - start;
        const dur = durRef.current;
        if (elapsed >= dur) {
          setPlay((p) => (p && p.id === play.id ? null : p));
          return; // stop loop
        } else {
          setPlay((p) => (p && p.id === play.id ? { ...p, x, y, vx, vy, start, duration: dur } : p));
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [play?.id]);

  if (!play) return null;

  // initial position for first frame; afterwards we update via RAF directly
  const style = {
    transform: `translate3d(${(play.x ?? 0) - (play.kind === 'ball' ? 14 : 12)}px, ${(play.y ?? 0) - (play.kind === 'ball' ? 14 : 12)}px, 0)`
  };

  return (
    <div className="play-overlay" aria-hidden>
      {play.kind === 'ball' ? (
        <div ref={nodeRef} className="toy-ball" style={style}>
          <div className="ball-core" />
        </div>
      ) : (
        <div ref={nodeRef} className="toy-mouse" style={style}>
          <span role="img" aria-label="mouse">🐭</span>
        </div>
      )}
    </div>
  );
}
