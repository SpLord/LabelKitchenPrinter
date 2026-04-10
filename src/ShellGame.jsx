import { useCallback, useEffect, useRef, useState } from 'react';

/*
  ShellGame Overlay (Hütchenspiel)
  - props:
    - onClose(): void
    - onResult(addCoins: number): void  (award coins)
*/

// ─── Audio Utility ────────────────────────────────────────────────────────────
function playTone(freq, duration, type = 'sine', gainVal = 0.18) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
    osc.onended = () => ctx.close();
  } catch (_) { /* ignore – audio not available */ }
}

function playWin() {
  // Ascending arpeggio C4 → E4 → G4
  const notes = [261.63, 329.63, 392.00];
  notes.forEach((freq, i) => setTimeout(() => playTone(freq, 150), i * 120));
}

function playLose() {
  // Descending tone 400 → 200 Hz
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch (_) { /* ignore */ }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ShellGame({ onClose, onResult }) {
  // cups array: supports 3 or 4 cups depending on difficulty
  const [numCups, setNumCups] = useState(3);

  // order[cupIdx] = slotIdx  (which slot each cup is currently at)
  const [order, setOrder] = useState(() => Array.from({length: numCups}, (_, i) => i));

  // prize cup index (useRef – stable per mount, not a computed value)
  const prizeCupRef = useRef(Math.floor(Math.random() * 3));
  const prizeCup = prizeCupRef.current;

  // stage: 'peek' | 'shuffle' | 'choose' | 'result'
  const [stage, setStage] = useState('peek');

  const [message, setMessage] = useState('');
  const [flashClass, setFlashClass] = useState(''); // 'win' | 'lose'
  const [pickedCup, setPickedCup] = useState(null);

  // streak & difficulty
  const [streak, setStreak] = useState(0);
  const [speed, setSpeed] = useState(280); // ms per swap

  // level display (speed < 200 → level 2)
  const level = speed < 200 ? 2 : 1;

  const runningRef = useRef(false);
  const swapsRef = useRef(0);
  const speedRef = useRef(280);

  // Slot X positions (3 or 4 cups)
  const slots = useMemo(() => {
    if (numCups === 4) return [-210, -70, 70, 210];
    return [-140, 0, 140];
  }, [numCups]);

  // ── Peek → Shuffle ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Show peek for 1.5s then start shuffle
    const peekTimer = setTimeout(() => {
      setStage('shuffle');
    }, 1500);
    return () => clearTimeout(peekTimer);
  }, []);

  // ── Shuffle Loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'shuffle') return;
    runningRef.current = true;
    swapsRef.current = 0;

    const doSwap = () => {
      if (!runningRef.current) return;
      swapsRef.current += 1;

      // Play swap ping
      playTone(200, 80, 'triangle', 0.1);

      const n = numCups;
      const a = Math.floor(Math.random() * n);
      let b = Math.floor(Math.random() * n);
      if (b === a) b = (b + 1) % n;

      setOrder(prev => {
        const next = prev.slice();
        const t = next[a];
        next[a] = next[b];
        next[b] = t;
        return next;
      });

      const targetSwaps = 12 + (level - 1) * 4;
      if (swapsRef.current < targetSwaps) {
        setTimeout(doSwap, speedRef.current);
      } else {
        setTimeout(() => setStage('choose'), 300);
      }
    };

    const id = setTimeout(doSwap, 400);
    return () => {
      runningRef.current = false;
      clearTimeout(id);
    };
  }, [stage, numCups, level]);

  // ── Pick Handler ─────────────────────────────────────────────────────────────
  const onPick = useCallback((cupIdx) => {
    if (stage !== 'choose') return;
    const win = cupIdx === prizeCup;

    setPickedCup(cupIdx);
    setStage('result');

    if (win) {
      playWin();
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak >= 3) {
          // Streak bonus
          setMessage(`🔥 ${newStreak}x Streak! Richtig! +5 Bonus-Münzen!`);
          onResult(5);
        } else {
          setMessage('🎉 Richtig! +3 Münzen');
          onResult(3);
        }
        return newStreak;
      });
      setFlashClass('win');
      // Increase difficulty
      setSpeed(prev => {
        const next = Math.max(120, prev - 30);
        speedRef.current = next;
        return next;
      });
      // Unlock 4th cup after 3 wins
      if (streak >= 2 && numCups < 4) {
        setNumCups(4);
        setOrder(Array.from({length: 4}, (_, i) => i));
      }
    } else {
      playLose();
      setMessage('😢 Knapp daneben! +1 Münze');
      onResult(1);
      setStreak(0);
      setFlashClass('lose');
    }

    setTimeout(() => {
      setFlashClass('');
      onClose();
    }, 1800);
  }, [stage, prizeCup, onResult, onClose, streak]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const cups = Array.from({ length: numCups }, (_, i) => i);

  const getCupStyle = (cupIdx) => {
    const slotIdx = order[cupIdx] ?? cupIdx;
    const x = slots[slotIdx] ?? 0;
    const isWinner = stage === 'result' && cupIdx === prizeCup;
    const translateY = isWinner ? -40 : 0;
    return {
      transform: `translateX(${x}px) translateY(${translateY}px)`,
      transition: stage === 'peek'
        ? 'none'
        : `transform 220ms ease-in-out`,
    };
  };

  const showCoin = (cupIdx) => {
    if (stage === 'peek' && cupIdx === prizeCup) return true;
    if (stage === 'result') return true; // show under all in result
    return false;
  };

  return (
    <div className="shell-overlay" role="dialog" aria-modal="true" aria-label="Hütchenspiel">
      <div className={`shell-board ${flashClass}`}>

        {/* Header */}
        <div className="shell-title">
          🎩 Hütchenspiel
          {level >= 2 && <span className="shell-level"> Level 2 🚀</span>}
          {streak >= 2 && <span className="shell-streak"> 🔥 {streak}x Streak!</span>}
          <span className="shell-bet"> 🪙 Gewinn: {streak >= 2 ? '5' : '3'}</span>
        </div>
        <div className="shell-sub">
          {stage === 'peek'  && 'Merke dir, wo die Münze ist!'}
          {stage === 'shuffle' && 'Mische…'}
          {stage === 'choose'  && 'Welcher Becher verbirgt die Münze?'}
          {stage === 'result'  && ''}
        </div>

        {/* Cup Area */}
        <div style={{textAlign:'center', marginBottom:'8px', fontSize:'1rem', opacity:0.85}}>Einsatz: {level === 2 ? 10 : 5} 🪙</div>
        <div className={`shell-area cups-${numCups}`}>
          {cups.map((i) => {
            const isWinner = stage === 'result' && i === prizeCup;
            return (
              <button
                key={i}
                className={[
                  'cup',
                  stage === 'shuffle' ? 'disabled' : '',
                  isWinner ? 'winner' : '',
                ].filter(Boolean).join(' ')}
                style={getCupStyle(i)}
                onClick={() => onPick(i)}
                disabled={stage !== 'choose'}
                aria-label={`Becher ${i + 1}`}
              >
                {showCoin(i) && (
                  <span className="shell-coin" aria-hidden="true" />
                )}
                <span className="cup-top" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shell-footer">
          <span className="shell-msg">{message}</span>
          <button className="shell-close" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}
