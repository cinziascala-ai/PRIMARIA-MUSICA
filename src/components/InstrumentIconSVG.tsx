import React from 'react';
import { InstrumentTimbre } from '../utils/audio';

interface InstrumentIconSVGProps {
  timbre: InstrumentTimbre;
  className?: string;
}

export const InstrumentIconSVG: React.FC<InstrumentIconSVGProps> = ({
  timbre,
  className = 'w-6 h-6',
}) => {
  switch (timbre) {
    case 'xylophone':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="3" y="5" width="3" height="14" rx="1" />
          <rect x="8" y="6.5" width="3" height="11" rx="1" />
          <rect x="13" y="8" width="3" height="8" rx="1" />
          <rect x="18" y="9" width="3" height="6" rx="1" />
        </svg>
      );
    case 'flute':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M4 18L18 4l2 2L6 20l-2-2z" />
          <circle cx="10" cy="14" r="0.8" fill="currentColor" />
          <circle cx="12.5" cy="11.5" r="0.8" fill="currentColor" />
          <circle cx="15" cy="9" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'drum':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <ellipse cx="12" cy="9" rx="8" ry="3.5" />
          <path d="M4 9v6c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5V9" />
          <path d="M8 12v5M16 12v5" />
        </svg>
      );
    case 'piano':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M9 5v8M15 5v8M7 13v6M12 13v6M17 13v6" />
        </svg>
      );
    case 'violin':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M15 9l4-4m-1 0l1 1" />
          <path d="M10.5 9.5c-2.2-.8-4.5.7-4.5 3 0 1.2.6 2 1.2 2.5-.8.9-.7 2.8.8 3.8 1.6 1 3.6.2 4.3-1 .5 0 1.4-.3 2.2-1.1 1-1 .8-2.4.2-3.2.8-.6 1.3-1.6.9-2.8-.5-1.5-2.6-2-5.1-1.2z" />
        </svg>
      );
    case 'trumpet':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M3 13h11l5-4v8l-5-4" />
          <path d="M7 13v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3" />
          <path d="M9 10v3M11.5 10v3" />
        </svg>
      );
    case 'harp':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M6 4v16h11c-2-5-2-9 2-13-4-2-9-3-13-3z" />
          <path d="M9 5v15M12 6v14M15 8v12" />
        </svg>
      );
  }
};
