import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/*
  ShellGame Overlay (Hütchenspiel)
  - props:
    - onClose(): void
    - onResult(delta: number): void      Münzen gutschreiben (negativ = Einsatz)
    - balance: number                    aktueller Kontostand
    - streak: number                     bisherige Siegesserie (überlebt die Runde)
    - onStreak(next: number): void       neue Serie melden

  Die Serie lag früher im lokalen State dieser Komponente. Da sie 1,8 s nach
  jeder Runde ausgehängt wird, war der Fortschritt damit jedes Mal weg: Streak
  blieb 0, Level 1, der 4. Becher tauchte nie auf.
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
  } catch { /* ignore – audio not available */ }
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
  } catch { /* ignore */ }
}

// ─── Component ────────────────────────────────────────────────────────────────
// Einsatz und Auszahlung. Vorher stand "Einsatz: 5" nur da, abgezogen wurde
// nichts – und ein Treffer brachte 3, ein Fehlgriff sogar noch 1.
export const STAKE = 5;
const PAYOUT = { 3: 15, 4: 20 };
const STREAK_BONUS = 5;

export default function ShellGame({ onClose, onResult, streak = 0, onStreak, balance = 0 }) {
  // Ab drei Siegen in Folge wird mit vier Bechern gespielt
  const [numCups, setNumCups] = useState(() => (streak >= 3 ? 4 : 3));

  // order[cupIdx] = slotIdx  (which slot each cup is currently at)
  const [order, setOrder] = useState(() => Array.from({length: numCups}, (_, i) => i));

  // prize cup index – stabil für die laufende Runde, aber immer innerhalb von numCups
  const [prizeCup, setPrizeCup] = useState(() => Math.floor(Math.random() * numCups));

  // stage: 'peek' | 'shuffle' | 'choose' | 'result'
  const [stage, setStage] = useState('peek');

  const [message, setMessage] = useState('');
  const [flashClass, setFlashClass] = useState(''); // 'win' | 'lose'

  // Tempo steigt mit der Serie
  const startTempo = Math.max(120, 280 - streak * 30);
  const [speed, setSpeed] = useState(startTempo);

  // level display (speed < 200 → level 2)
  const level = speed < 200 ? 2 : 1;

  const runningRef = useRef(false);
  const swapsRef = useRef(0);
  const speedRef = useRef(startTempo);

  // Slot X positions (3 or 4 cups)
  const slots = useMemo(() => {
    if (numCups === 4) return [-210, -70, 70, 210];
    return [-140, 0, 140];
  }, [numCups]);

  // Wächst das Feld (3 → 4 Becher), muss der Gewinnbecher gültig bleiben
  useEffect(() => {
    setPrizeCup((prev) => (prev < numCups ? prev : Math.floor(Math.random() * numCups)));
  }, [numCups]);

  // ── Einsatz ─────────────────────────────────────────────────────────────────
  const stakePaidRef = useRef(false);
  useEffect(() => {
    if (stakePaidRef.current) return;   // StrictMode ruft Effekte doppelt auf
    stakePaidRef.current = true;
    if (balance < STAKE) {
      setMessage(`Zu wenig Münzen – ${STAKE} 🪙 nötig.`);
      setStage('result');
      const t = setTimeout(onClose, 1800);
      return () => clearTimeout(t);
    }
    onResult(-STAKE);
  }, [balance, onResult, onClose]);

  // ── Peek → Shuffle ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (balance < STAKE) return;
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
        setTimeout(() => { if (runningRef.current) setStage('choose'); }, 300);
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

    setStage('result');

    if (win) {
      playWin();
      const newStreak = streak + 1;
      onStreak && onStreak(newStreak);
      const gewinn = (PAYOUT[numCups] ?? PAYOUT[3]) + (newStreak >= 3 ? STREAK_BONUS : 0);
      setMessage(
        newStreak >= 3
          ? `🔥 ${newStreak}x Serie! Richtig! +${gewinn} Münzen`
          : `🎉 Richtig! +${gewinn} Münzen`,
      );
      onResult(gewinn);
      setFlashClass('win');
      // Increase difficulty
      const nextSpeed = Math.max(120, speedRef.current - 30);
      speedRef.current = nextSpeed;
      setSpeed(nextSpeed);
      // Unlock 4th cup after 3 wins
      if (newStreak >= 3 && numCups < 4) {
        setNumCups(4);
        setOrder(Array.from({length: 4}, (_, i) => i));
      }
    } else {
      playLose();
      setMessage(`😢 Knapp daneben – ${STAKE} 🪙 futsch.`);
      onStreak && onStreak(0);
      setFlashClass('lose');
    }

    setTimeout(() => {
      setFlashClass('');
      onClose();
    }, 1800);
  }, [stage, prizeCup, onResult, onClose, onStreak, streak, numCups]);

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

  const showCoin = (cupIdx) =>
    (stage === 'peek' || stage === 'result') && cupIdx === prizeCup;

  return (
    <div className="shell-overlay" role="dialog" aria-modal="true" aria-label="Hütchenspiel">
      <div className={`shell-board ${flashClass}`}>

        {/* Header */}
        <div className="shell-title">
          🎩 Hütchenspiel
          {level >= 2 && <span className="shell-level"> Level 2 🚀</span>}
          {streak >= 2 && <span className="shell-streak"> 🔥 {streak}x Streak!</span>}
          <span className="shell-bet">
            {' '}🪙 Einsatz {STAKE} · Gewinn {(PAYOUT[numCups] ?? PAYOUT[3]) + (streak >= 2 ? STREAK_BONUS : 0)}
          </span>
        </div>
        <div className="shell-sub">
          {stage === 'peek'  && 'Merke dir, wo die Münze ist!'}
          {stage === 'shuffle' && 'Mische…'}
          {stage === 'choose'  && 'Welcher Becher verbirgt die Münze?'}
          {stage === 'result'  && ''}
        </div>

        {/* Cup Area */}
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
