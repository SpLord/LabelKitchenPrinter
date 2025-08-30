import { useEffect, useState } from 'react';

export default function CatSprite() {
  const [pos, setPos] = useState({ top: 20, left: 20 });

  const randomize = () => {
    const margin = 20;
    const catWidth = 120; // match CSS width
    const catHeight = 120;
    const maxLeft = Math.max(0, window.innerWidth - catWidth - margin);
    const maxTop = Math.max(0, window.innerHeight - catHeight - margin);
    const left = Math.floor(Math.random() * (maxLeft - margin + 1)) + margin;
    const top = Math.floor(Math.random() * (maxTop - margin + 1)) + margin;
    setPos({ top, left });
  };

  useEffect(() => {
    randomize();
    const id = setInterval(randomize, 20000); // every 20s
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="cat-sprite"
      style={{ top: pos.top, left: pos.left }}
      aria-hidden
    >
      {/* Simple comic-style cat SVG */}
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
          </filter>
        </defs>
        {/* Tail */}
        <path d="M155 120c20 0 30 15 20 28s-26 10-33 3" fill="none" stroke="#3b3b3b" strokeWidth="8" strokeLinecap="round">
          <animate attributeName="d" dur="1.8s" repeatCount="indefinite" values="M155 120c20 0 30 15 20 28s-26 10-33 3; M155 120c22 2 34 12 26 26s-26 12-35 6; M155 120c20 0 30 15 20 28s-26 10-33 3" />
        </path>
        {/* Body */}
        <g filter="url(#shadow)">
          <ellipse cx="110" cy="120" rx="70" ry="55" fill="#f5d3b3" stroke="#3b3b3b" strokeWidth="6" />
          {/* Head */}
          <circle cx="80" cy="85" r="40" fill="#f5d3b3" stroke="#3b3b3b" strokeWidth="6" />
          {/* Ears */}
          <path d="M55 56 L45 25 L75 45 Z" fill="#f5d3b3" stroke="#3b3b3b" strokeWidth="6" />
          <path d="M105 56 L135 25 L125 60 Z" fill="#f5d3b3" stroke="#3b3b3b" strokeWidth="6" />
          {/* Eyes */}
          <circle cx="65" cy="85" r="6" fill="#3b3b3b" />
          <circle cx="95" cy="85" r="6" fill="#3b3b3b" />
          {/* Nose */}
          <polygon points="80,95 75,103 85,103" fill="#e08e79" />
          {/* Mouth */}
          <path d="M75 108 q5 6 10 0" stroke="#3b3b3b" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Whiskers */}
          <path d="M52 95 h18 M52 103 h18 M52 87 h18" stroke="#3b3b3b" strokeWidth="4" strokeLinecap="round" />
          <path d="M90 95 h18 M90 103 h18 M90 87 h18" stroke="#3b3b3b" strokeWidth="4" strokeLinecap="round" />
          {/* Paws */}
          <ellipse cx="60" cy="155" rx="16" ry="10" fill="#f5d3b3" stroke="#3b3b3b" strokeWidth="6" />
          <ellipse cx="95" cy="165" rx="16" ry="10" fill="#f5d3b3" stroke="#3b3b3b" strokeWidth="6" />
        </g>
      </svg>
    </div>
  );
}

