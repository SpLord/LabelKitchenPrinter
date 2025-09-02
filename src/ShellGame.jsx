import { useEffect, useMemo, useRef, useState } from 'react';

/*
  ShellGame Overlay (Hütchenspiel)
  - props:
    - onClose(): void
    - onResult(addCoins: number): void  (award coins)
*/
export default function ShellGame({ onClose, onResult }) {
  const [order, setOrder] = useState([0, 1, 2]); // cup -> slot index
  const [prizeCup] = useState(() => Math.floor(Math.random() * 3));
  const [stage, setStage] = useState('shuffle'); // 'shuffle' | 'choose' | 'result'
  const [message, setMessage] = useState('');
  const runningRef = useRef(false);
  const swapsRef = useRef(0);

  const slots = useMemo(() => [-140, 0, 140], []); // X positions

  useEffect(() => {
    runningRef.current = true;
    const doSwap = () => {
      if (!runningRef.current) return;
      swapsRef.current += 1;
      // random swap two cups
      const a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3);
      if (b === a) b = (b + 1) % 3;
      setOrder(prev => {
        const next = prev.slice();
        const t = next[a];
        next[a] = next[b];
        next[b] = t;
        return next;
      });
      if (swapsRef.current < 12) {
        setTimeout(doSwap, 280);
      } else {
        setTimeout(() => setStage('choose'), 300);
      }
    };
    // small delay then start
    const id = setTimeout(doSwap, 400);
    return () => { runningRef.current = false; clearTimeout(id); };
  }, []);

  const onPick = (cupIdx) => {
    if (stage !== 'choose') return;
    const win = cupIdx === prizeCup;
    setStage('result');
    setMessage(win ? 'Richtig! +3 Münzen' : 'Knapp daneben! +1 Münze');
    onResult(win ? 3 : 1);
    setTimeout(() => { onClose(); }, 1200);
  };

  return (
    <div className="shell-overlay" role="dialog" aria-modal="true" aria-label="Hütchenspiel">
      <div className="shell-board">
        <div className="shell-title">Hütchenspiel</div>
        <div className="shell-sub">Merke dir, wo die Münze ist!</div>
        <div className="shell-area">
          {[0,1,2].map((i) => (
            <button
              key={i}
              className={`cup ${stage === 'shuffle' ? 'disabled' : ''}`}
              style={{ transform: `translateX(${slots[order[i]]}px)` }}
              onClick={() => onPick(i)}
              aria-disabled={stage === 'shuffle'}
              aria-label={`Becher ${i+1}`}
            >
              {/* coin is under initial position of prizeCup only visible in result */}
              {stage === 'result' && i === prizeCup && (
                <span className="shell-coin" aria-hidden />
              )}
              <span className="cup-top" aria-hidden />
            </button>
          ))}
        </div>
        <div className="shell-footer">
          <span className="shell-msg">{stage === 'shuffle' ? 'Mische…' : message}</span>
          <button className="shell-close" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}
