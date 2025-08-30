import { useEffect } from 'react';

export default function PlayOverlay({ play, setPlay }) {
  useEffect(() => {
    if (!play) return;
    let rafId;
    const start = performance.now();
    const duration = play.kind === 'ball' ? 7000 : 5000; // ms
    let last = start;

    // Initial velocity
    let vx = play.vx ?? (Math.random() * 2 - 1) * 300; // px/s
    let vy = play.vy ?? (Math.random() * 2 - 1) * 300;

    const step = (t) => {
      if (!play) return;
      const dt = Math.min(0.05, (t - last) / 1000); // seconds, clamp
      last = t;
      const elapsed = t - start;

      setPlay((p) => {
        if (!p || p.id !== play.id) return p;
        let { x, y } = p;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (p.kind === 'ball') {
          // friction
          vx *= 0.992;
          vy *= 0.992;
          x += vx * dt;
          y += vy * dt;
          // bounce at edges with margin
          const r = 14;
          if (x < r) { x = r; vx = Math.abs(vx); }
          if (x > vw - r) { x = vw - r; vx = -Math.abs(vx); }
          if (y < r) { y = r; vy = Math.abs(vy); }
          if (y > vh - r) { y = vh - r; vy = -Math.abs(vy); }
        } else {
          // mouse scampers in a slightly changing direction
          // steer away from center occasionally
          const speed = 220; // px/s
          // small random walk on velocity
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

        return { ...p, x, y, vx, vy };
      });

      if (elapsed < duration) {
        rafId = requestAnimationFrame(step);
      } else {
        // clear play after duration
        setPlay((p) => (p && p.id === play.id ? null : p));
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [play, setPlay]);

  if (!play) return null;

  const style = {
    transform: `translate(${play.x - (play.kind === 'ball' ? 14 : 12)}px, ${play.y - (play.kind === 'ball' ? 14 : 12)}px)`,
  };

  return (
    <div className="play-overlay" aria-hidden>
      {play.kind === 'ball' ? (
        <div className="toy-ball" style={style} />
      ) : (
        <div className="toy-mouse" style={style}>
          <span role="img" aria-label="mouse">🐭</span>
        </div>
      )}
    </div>
  );
}

