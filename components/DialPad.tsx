"use client";

import { useCallback, useRef } from "react";

const keys = [
  { digit: "1", sub: "" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "*", sub: "" },
  { digit: "0", sub: "+" },
  { digit: "#", sub: "" },
];

interface DialPadProps {
  onDigitPress: (digit: string) => void;
}

export default function DialPad({ onDigitPress }: DialPadProps) {
  const padRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (digit: string, e: React.MouseEvent<HTMLButtonElement>) => {
      onDigitPress(digit);

      // Create ripple effect
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    },
    [onDigitPress]
  );

  return (
    <div className="dialpad" ref={padRef}>
      {keys.map(({ digit, sub }) => (
        <button
          key={digit}
          className="dial-key"
          onClick={(e) => handleClick(digit, e)}
          aria-label={`Dial ${digit}`}
        >
          {digit}
          {sub && <span className="dial-key-sub">{sub}</span>}
        </button>
      ))}
    </div>
  );
}
