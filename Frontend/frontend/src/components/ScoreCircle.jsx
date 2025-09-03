import React, { useMemo } from "react";

const ScoreCircle = ({ value = 0, size = 64, stroke = 6 }) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = useMemo(() => circumference * (1 - pct / 100), [circumference, pct]);

  return (
    <div className="score-circle" style={{ width: size, height: size }} aria-label={`Compatibility score ${pct}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-hidden="true">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(34,197,94,0.18)" /* #22c55e with alpha */
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        <circle
          className="score-circle__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} /* start at 12 o'clock */
        />
      </svg>
      <div className="score-circle__text">{pct}%</div>
    </div>
  );
};

export default ScoreCircle;