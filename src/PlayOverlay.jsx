import { useEffect } from 'react';

export default function PlayOverlay({ play, setPlay }) {
  useEffect(() => {
    if (!play) return;
    // ensure initial velocity and duration are set once per play id
    setPlay((p) => {
      if (!p || p.id !== play.id) return p;
      if (p.vx == null || p.vy == null) {
        const speed = 300;
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const duration = (30 + Math.random() * 15) * 1000; // 30-45s
        return { ...p, vx, vy, duration, start: performance.now() };
      }
      return p;
    });

    let rafId;
    let last = performance.now();

    const step = (t) => {
      setPlay((p) => {
        if (!p || p.id !== play.id) return p;
        const start = p.start ?? t;
        const elapsed = t - start;
        const dur = p.duration ?? (30 + Math.random() * 15) * 1000;
        const dt = Math.min(0.05, (t - last) / 1000);
        last = t;

        let { x, y, vx, vy } = p;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (p.kind === 'ball') {
          const friction = 0.996; // slower decay for longer play
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
          // mouse
          const speed = 220;
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

        if (elapsed >= dur) return null; // stop play => stop chasing
        return { ...p, x, y, vx, vy, start };
      });

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [play?.id, setPlay]);

  if (!play) return null;

  const style = {
    transform: `translate(${(play.x ?? 0) - (play.kind === 'ball' ? 14 : 12)}px, ${(play.y ?? 0) - (play.kind === 'ball' ? 14 : 12)}px)`,
  };

  return (
    <div className="play-overlay" aria-hidden>
      {play.kind === 'ball' ? (
        <div className="toy-ball" style={style}>
          <div className="ball-core" />
        </div>
      ) : (
        <div className="toy-mouse" style={style}>
          <span role="img" aria-label="mouse">🐭</span>
        </div>
      )}
    </div>
  );
}
