import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface Particle {
  id: number;
  kind: 'note' | 'beam' | 'star' | 'ribbon';
  color: string;
  startX: number;
  targetX: number;
  peakY: number;
  endY: number;
  rotateStart: number;
  rotateEnd: number;
  delay: number;
  duration: number;
  scale: number;
}

const PALETTE = [
  '#2563EB', // cobalt blue
  '#F59E0B', // amber gold
  '#059669', // emerald
  '#DC2626', // coral red
  '#4F46E5', // indigo
  '#EA580C', // warm orange
];

export const CelebrationConfetti: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const particles = useMemo<Particle[]>(() => {
    const kinds: Particle['kind'][] = ['note', 'beam', 'ribbon', 'star'];
    return Array.from({ length: 28 }, (_, i) => {
      const spreadAngle = ((i / 28) * Math.PI * 1.4) - Math.PI * 0.7;
      const distance = 90 + ((i * 37) % 190);
      const targetX = Math.sin(spreadAngle) * distance * (i % 2 === 0 ? 1.15 : 0.9);
      const peakY = -70 - ((i * 23) % 110);
      const endY = 120 + ((i * 29) % 110);

      return {
        id: i,
        kind: kinds[i % kinds.length],
        color: PALETTE[i % PALETTE.length],
        startX: ((i % 5) - 2) * 8,
        targetX,
        peakY,
        endY,
        rotateStart: ((i * 19) % 60) - 30,
        rotateEnd: (i % 2 === 0 ? 1 : -1) * (140 + ((i * 31) % 180)),
        delay: (i % 7) * 0.045,
        duration: 1.7 + (i % 4) * 0.22,
        scale: 0.8 + (i % 3) * 0.22,
      };
    });
  }, []);

  if (prefersReducedMotion) {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden flex items-start justify-center pt-5"
        aria-hidden="true"
      >
        <div className="flex items-center gap-16 opacity-70">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#F59E0B">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#2563EB">
            <path d="M12 2l2.4 6.6L21 9.2l-5 4.4 1.5 6.8L12 16.8 6.5 20.4 8 13.6l-5-4.4 6.6-.6L12 2z" />
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#059669">
            <path d="M9 17.5A3.5 3.5 0 1 1 5.5 14c.54 0 1.05.12 1.5.34V5l12-2v10.5a3.5 3.5 0 1 1-2-3.16V6.6L9 7.93V17.5z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute top-16 left-1/2"
            initial={{
              x: p.startX,
              y: 0,
              opacity: 0,
              scale: 0.3,
              rotate: p.rotateStart,
            }}
            animate={{
              x: [p.startX, p.targetX * 0.72, p.targetX],
              y: [0, p.peakY, p.endY],
              opacity: [0, 1, 1, 0],
              scale: [0.3, p.scale, p.scale * 0.92],
              rotate: [p.rotateStart, p.rotateEnd],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.35, 0.75, 1],
            }}
          >
            {p.kind === 'note' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill={p.color}>
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              </svg>
            )}
            {p.kind === 'beam' && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill={p.color}>
                <path d="M9 17.5A3.5 3.5 0 1 1 5.5 14c.54 0 1.05.12 1.5.34V5l12-2v10.5a3.5 3.5 0 1 1-2-3.16V6.6L9 7.93V17.5z" />
              </svg>
            )}
            {p.kind === 'star' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill={p.color}>
                <path d="M12 2l2.4 6.6L21 9.2l-5 4.4 1.5 6.8L12 16.8 6.5 20.4 8 13.6l-5-4.4 6.6-.6L12 2z" />
              </svg>
            )}
            {p.kind === 'ribbon' && (
              <span
                className="block w-3 h-1.5 rounded-xs"
                style={{ backgroundColor: p.color }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
