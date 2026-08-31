import { useEffect, useRef } from 'react';

/*
  props:
    - play, setPlay
    - posRef: gemeinsamer Ref, über den die Katze der aktuellen Position folgt.

  Früher wurde die Position alle drei Bilder in den React-State geschrieben,
  nur damit die Katze sie lesen kann – rund 20 Zustandsänderungen pro Sekunde,
  jede mit einem kompletten Neuaufbau des Etiketten-Rasters. Der Ref kostet
  nichts und die Katze liest ihn in ihrer eigenen Schleife.
*/
export default function PlayOverlay({ play, setPlay, posRef }) {
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
  // Laser: no autonomous movement; it only follows pointer via App state updates
  if (play.kind === 'laser') return;
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

      // Position teilen, ohne React zu bemühen
      if (posRef) posRef.current = { id: play.id, kind: play.kind, x, y };

      // Nur das Ende der Spielzeit ist eine echte Zustandsänderung
      frameCountRef.current++;
      if (frameCountRef.current % 6 === 0 && t - startRef.current >= durRef.current) {
        setPlay((p) => (p && p.id === play.id ? null : p));
        return; // Schleife beenden
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // play als Ganzes: seit die Position über den Ref läuft, ändert sich das
    // Objekt nur noch beim Erscheinen und Verschwinden – kein Neustart pro Bild.
  }, [play, posRef, setPlay]);

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
      ) : play.kind === 'mouse' ? (
        <div ref={nodeRef} className="toy-mouse" style={style}>
          <span role="img" aria-label="mouse">🐭</span>
        </div>
      ) : (
        // Laser dot: no sprite, just a bright red point following the cursor
        <div
          ref={nodeRef}
          className="toy-laser"
          style={{ transform: `translate3d(${(play.x ?? 0) - 6}px, ${(play.y ?? 0) - 6}px, 0)` }}
        />
      )}
    </div>
  );
}
