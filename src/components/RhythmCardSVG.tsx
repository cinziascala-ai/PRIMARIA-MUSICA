import React from 'react';
import { RhythmId } from '../types/music';

interface RhythmCardSVGProps {
  rhythmId: RhythmId;
  size?: number;
  color?: string;
}

export const RhythmCardSVG: React.FC<RhythmCardSVGProps> = ({
  rhythmId,
  size = 88,
  color = '#0F172A',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      role="img"
      aria-label={`Simbolo musicale ${rhythmId}`}
    >
      {/* Subtle reference staff line behind symbol */}
      <line x1={12} y1={62} x2={84} y2={62} stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="3 3" />

      {rhythmId === 'semibreve' && (
        <g>
          <ellipse
            cx={48}
            cy={56}
            rx={18}
            ry={12}
            stroke={color}
            strokeWidth={4.5}
          />
          <ellipse
            cx={48}
            cy={56}
            rx={8}
            ry={6}
            transform="rotate(20 48 56)"
            fill="#FAF9F6"
          />
        </g>
      )}

      {rhythmId === 'minima' && (
        <g>
          <ellipse
            cx={42}
            cy={64}
            rx={13}
            ry={9}
            transform="rotate(-15 42 64)"
            stroke={color}
            strokeWidth={3.8}
          />
          <line
            x1={53.5}
            y1={61}
            x2={53.5}
            y2={18}
            stroke={color}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </g>
      )}

      {rhythmId === 'semiminima' && (
        <g>
          <ellipse
            cx={42}
            cy={64}
            rx={13.5}
            ry={9.5}
            transform="rotate(-15 42 64)"
            fill={color}
          />
          <line
            x1={53.5}
            y1={61}
            x2={53.5}
            y2={18}
            stroke={color}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </g>
      )}

      {rhythmId === 'croma' && (
        <g>
          <ellipse
            cx={38}
            cy={64}
            rx={13}
            ry={9}
            transform="rotate(-15 38 64)"
            fill={color}
          />
          <line
            x1={49.5}
            y1={61}
            x2={49.5}
            y2={18}
            stroke={color}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <path
            d="M 49.5 19 C 61 24, 67 34, 61 45 C 62 36, 56 30, 49.5 28"
            fill={color}
          />
        </g>
      )}

      {rhythmId === 'pausa_semiminima' && (
        <path
          d="M 44 22 L 54 35 L 43 46 L 54 58 C 44 59, 41 67, 49 74"
          stroke={color}
          strokeWidth={4.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
