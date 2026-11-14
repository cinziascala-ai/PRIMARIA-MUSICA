import React, { useState } from 'react';
import { ClefType, NoteDefinition } from '../types/music';
import { BASS_NOTES, TREBLE_NOTES } from '../data/curriculum';

export interface StaffNoteItem {
  note: NoteDefinition;
  state?: 'default' | 'active' | 'correct' | 'wrong' | 'preview';
  showLabel?: boolean;
}

interface StaffSVGProps {
  clef: ClefType;
  notes?: StaffNoteItem[];
  highlightStep?: number | null;
  showLineNumbers?: boolean;
  showColorHints?: boolean;
  interactivePlacement?: boolean;
  onStepSelect?: (note: NoteDefinition) => void;
  onNoteClick?: (note: NoteDefinition, index: number) => void;
  compact?: boolean;
}

const BASE_LINE_Y = 148;
const HALF_STEP = 11;

export function getStepY(step: number): number {
  return BASE_LINE_Y - step * HALF_STEP;
}

export const StaffSVG: React.FC<StaffSVGProps> = ({
  clef,
  notes = [],
  highlightStep = null,
  showLineNumbers = false,
  showColorHints = false,
  interactivePlacement = false,
  onStepSelect,
  onNoteClick,
  compact = false,
}) => {
  const [hoverStep, setHoverStep] = useState<number | null>(null);

  const staffLeft = showLineNumbers ? 48 : 28;
  const staffRight = 612;
  const lineSteps = [0, 2, 4, 6, 8];

  const availableNotes = clef === 'treble' ? TREBLE_NOTES : BASS_NOTES;

  const findNoteByStep = (step: number): NoteDefinition | undefined => {
    return availableNotes.find((n) => n.staffStep === step);
  };

  const getNotePositionsX = (count: number): number[] => {
    if (count <= 1) return [355];
    if (count === 2) return [280, 430];
    if (count === 3) return [245, 360, 475];
    if (count === 4) return [225, 315, 405, 495];
    const startX = 205;
    const endX = 550;
    const stepX = (endX - startX) / Math.max(1, count - 1);
    return Array.from({ length: count }, (_, idx) => startX + idx * stepX);
  };

  const xPositions = getNotePositionsX(notes.length);
  const hoverNote = hoverStep !== null ? findNoteByStep(hoverStep) : undefined;

  return (
    <div className="w-full select-none">
      <svg
        viewBox="0 0 640 210"
        className={`w-full h-auto ${compact ? 'max-h-[190px]' : 'max-h-[260px]'}`}
        role="img"
        aria-label={clef === 'treble' ? 'Pentagramma in Chiave di Violino' : 'Pentagramma in Chiave di Basso'}
      >
        {/* Soft highlight band for progressive hint */}
        {highlightStep !== null && (
          <rect
            x={staffLeft}
            y={getStepY(highlightStep) - 9}
            width={staffRight - staffLeft}
            height={18}
            rx={6}
            fill="#FEF3C7"
            stroke="#F59E0B"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {/* Line numbers 1..5 from bottom to top for Principiante / Ripasso */}
        {showLineNumbers &&
          lineSteps.map((step, idx) => (
            <text
              key={`line-num-${step}`}
              x={22}
              y={getStepY(step) + 4}
              textAnchor="middle"
              className="fill-slate-400 text-[12px] font-semibold font-mono"
            >
              {idx + 1}
            </text>
          ))}

        {/* 5 Staff lines */}
        {lineSteps.map((step) => (
          <line
            key={`staff-line-${step}`}
            x1={staffLeft}
            y1={getStepY(step)}
            x2={staffRight}
            y2={getStepY(step)}
            stroke="#334155"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        ))}

        {/* Bar lines at start and end */}
        <line
          x1={staffLeft}
          y1={getStepY(8)}
          x2={staffLeft}
          y2={getStepY(0)}
          stroke="#1E293B"
          strokeWidth={2.5}
        />
        <line
          x1={staffRight}
          y1={getStepY(8)}
          x2={staffRight}
          y2={getStepY(0)}
          stroke="#1E293B"
          strokeWidth={2.5}
        />

        {/* Clef Artwork */}
        {clef === 'treble' ? (
          <g transform={`translate(${showLineNumbers ? 64 : 46}, 0)`} aria-hidden="true">
            {/* Authentic stylized Treble Clef anchored on 2nd line (y = 126, Sol) */}
            <path
              d="M 28 136 C 21 136, 17 129, 19 122 C 21 114, 32 112, 39 118 C 46 125, 44 140, 32 146 C 18 152, 6 140, 8 123 C 10 103, 35 88, 37 64 C 38 48, 32 34, 26 34 C 20 34, 17 47, 19 63 L 31 161 C 32 173, 25 181, 16 179 C 10 177, 8 171, 12 167 C 16 164, 21 167, 20 172"
              fill="none"
              stroke="#0F172A"
              strokeWidth={3.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={28} cy={126} r={3.5} fill="#2563EB" opacity={0.85} />
          </g>
        ) : (
          <g transform={`translate(${showLineNumbers ? 66 : 48}, 0)`} aria-hidden="true">
            {/* Authentic stylized Bass Clef anchored on 4th line (y = 82, Fa) */}
            <circle cx={14} cy={82} r={5.5} fill="#0F172A" />
            <path
              d="M 14 82 C 14 64, 36 58, 43 76 C 50 96, 33 124, 10 138"
              fill="none"
              stroke="#0F172A"
              strokeWidth={4.2}
              strokeLinecap="round"
            />
            <circle cx={54} cy={71} r={3.4} fill="#2563EB" />
            <circle cx={54} cy={93} r={3.4} fill="#2563EB" />
          </g>
        )}

        {/* Interactive Placement Hit Targets */}
        {interactivePlacement &&
          availableNotes.map((candidate) => {
            const y = getStepY(candidate.staffStep);
            const isHovered = hoverStep === candidate.staffStep;
            return (
              <g
                key={`hit-${candidate.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoverStep(candidate.staffStep)}
                onMouseLeave={() => setHoverStep(null)}
                onClick={() => onStepSelect?.(candidate)}
              >
                <rect
                  x={155}
                  y={y - 5.5}
                  width={435}
                  height={11}
                  fill={isHovered ? 'rgba(37, 99, 235, 0.08)' : 'transparent'}
                />
              </g>
            );
          })}

        {/* Hover ghost note preview in placement mode */}
        {interactivePlacement && hoverNote && (
          <g transform={`translate(355, ${getStepY(hoverNote.staffStep)})`} pointerEvents="none" opacity={0.55}>
            {hoverNote.staffStep <= -2 && (
              <line x1={-22} y1={0} x2={22} y2={0} stroke="#2563EB" strokeWidth={2} />
            )}
            <ellipse cx={0} cy={0} rx={12.5} ry={8.8} transform="rotate(-15)" fill="#2563EB" />
            {hoverNote.staffStep < 4 ? (
              <line x1={11.5} y1={-2} x2={11.5} y2={-48} stroke="#2563EB" strokeWidth={2.4} strokeLinecap="round" />
            ) : (
              <line x1={-11.5} y1={2} x2={-11.5} y2={48} stroke="#2563EB" strokeWidth={2.4} strokeLinecap="round" />
            )}
          </g>
        )}

        {/* Rendered Notes */}
        {notes.map((item, idx) => {
          const { note, state = 'default', showLabel = false } = item;
          const x = xPositions[idx] ?? 355;
          const y = getStepY(note.staffStep);

          let fillColor = '#0F172A';
          if (showColorHints && state === 'default') {
            fillColor = note.color;
          }
          if (state === 'active') fillColor = '#2563EB';
          if (state === 'correct') fillColor = '#059669';
          if (state === 'wrong') fillColor = '#DC2626';
          if (state === 'preview') fillColor = '#2563EB';

          const stemUp = note.staffStep < 4;

          return (
            <g
              key={`${note.id}-${idx}`}
              transform={`translate(${x}, ${y})`}
              onClick={() => onNoteClick?.(note, idx)}
              className={onNoteClick ? 'cursor-pointer' : undefined}
            >
              {/* Active highlight halo */}
              {(state === 'active' || state === 'correct') && (
                <circle
                  cx={0}
                  cy={0}
                  r={21}
                  fill={state === 'correct' ? '#D1FAE5' : '#DBEAFE'}
                  opacity={0.75}
                />
              )}

              {/* Ledger line for C4 / Do basso */}
              {note.staffStep <= -2 && (
                <line
                  x1={-22}
                  y1={0}
                  x2={22}
                  y2={0}
                  stroke={fillColor}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              )}

              {/* Note head */}
              <ellipse
                cx={0}
                cy={0}
                rx={12.5}
                ry={8.8}
                transform="rotate(-15)"
                fill={fillColor}
              />

              {/* Subtle inner specular shine for crispness */}
              <ellipse
                cx={-3.5}
                cy={-2.5}
                rx={3.2}
                ry={1.5}
                transform="rotate(-15)"
                fill="#FFFFFF"
                opacity={0.25}
              />

              {/* Stem */}
              {stemUp ? (
                <line
                  x1={11.5}
                  y1={-2}
                  x2={11.5}
                  y2={-48}
                  stroke={fillColor}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
              ) : (
                <line
                  x1={-11.5}
                  y1={2}
                  x2={-11.5}
                  y2={48}
                  stroke={fillColor}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
              )}

              {/* Optional label below/above note */}
              {showLabel && (
                <g transform={`translate(0, ${stemUp ? 28 : -24})`}>
                  <rect
                    x={-20}
                    y={-12}
                    width={40}
                    height={20}
                    rx={6}
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth={1.2}
                  />
                  <text
                    x={0}
                    y={2}
                    textAnchor="middle"
                    className="fill-slate-900 text-[12px] font-bold"
                  >
                    {note.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
