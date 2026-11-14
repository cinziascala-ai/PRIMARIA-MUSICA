import React, { useState } from 'react';
import { DRUM_PIECES } from '../data/drumCurriculum';
import { DrumPieceDefinition } from '../types/music';

export interface DrumStaffNoteItem {
  piece: DrumPieceDefinition;
  state?: 'default' | 'active' | 'correct' | 'wrong';
  showLabel?: boolean;
}

interface DrumStaffSVGProps {
  notes?: DrumStaffNoteItem[];
  highlightStep?: number | null;
  interactivePlacement?: boolean;
  onStepSelect?: (piece: DrumPieceDefinition) => void;
  onNoteClick?: (piece: DrumPieceDefinition, index: number) => void;
}

const BASE_LINE_Y = 152;
const HALF_STEP = 11;

function getDrumStepY(step: number): number {
  return BASE_LINE_Y - step * HALF_STEP;
}

export const DrumStaffSVG: React.FC<DrumStaffSVGProps> = ({
  notes = [],
  highlightStep = null,
  interactivePlacement = false,
  onStepSelect,
  onNoteClick,
}) => {
  const [hoverStep, setHoverStep] = useState<number | null>(null);

  const staffLeft = 46;
  const staffRight = 612;
  const lineSteps = [0, 2, 4, 6, 8];

  const getNotePositionsX = (count: number): number[] => {
    if (count <= 1) return [355];
    if (count === 4) return [225, 325, 425, 525];
    const startX = 210;
    const endX = 545;
    const stepX = (endX - startX) / Math.max(1, count - 1);
    return Array.from({ length: count }, (_, idx) => startX + idx * stepX);
  };

  const xPositions = getNotePositionsX(notes.length);
  const hoverPiece =
    hoverStep !== null ? DRUM_PIECES.find((p) => p.staffStep === hoverStep) : undefined;

  const renderNoteHead = (
    notehead: 'circle' | 'x',
    fillColor: string,
    staffStep: number
  ) => (
    <>
      {/* Ledger line above staff for Piatto Crash (step 10) */}
      {staffStep >= 10 && (
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

      {notehead === 'x' ? (
        <g stroke={fillColor} strokeWidth={3.4} strokeLinecap="round">
          <line x1={-9} y1={-7.5} x2={9} y2={7.5} />
          <line x1={-9} y1={7.5} x2={9} y2={-7.5} />
        </g>
      ) : (
        <>
          <ellipse
            cx={0}
            cy={0}
            rx={12}
            ry={8.5}
            transform="rotate(-15)"
            fill={fillColor}
          />
          <ellipse
            cx={-3}
            cy={-2}
            rx={3}
            ry={1.4}
            transform="rotate(-15)"
            fill="#FFFFFF"
            opacity={0.25}
          />
        </>
      )}

      {/* Stem */}
      {staffStep <= 3 ? (
        <line
          x1={10.5}
          y1={0}
          x2={10.5}
          y2={42}
          stroke={fillColor}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      ) : (
        <line
          x1={10.5}
          y1={0}
          x2={10.5}
          y2={-42}
          stroke={fillColor}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}
    </>
  );

  return (
    <div className="w-full select-none">
      <svg
        viewBox="0 0 640 212"
        className="w-full h-auto max-h-[250px]"
        role="img"
        aria-label="Spartito per batteria in chiave neutra"
      >
        {/* Tip visual highlight band */}
        {highlightStep !== null && (
          <rect
            x={staffLeft}
            y={getDrumStepY(highlightStep) - 9}
            width={staffRight - staffLeft}
            height={18}
            rx={6}
            fill="#FEF3C7"
            stroke="#F59E0B"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {/* 5 Staff lines */}
        {lineSteps.map((step) => (
          <line
            key={`drum-line-${step}`}
            x1={staffLeft}
            y1={getDrumStepY(step)}
            x2={staffRight}
            y2={getDrumStepY(step)}
            stroke="#334155"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        ))}

        {/* Bar lines */}
        <line
          x1={staffLeft}
          y1={getDrumStepY(8)}
          x2={staffLeft}
          y2={getDrumStepY(0)}
          stroke="#1E293B"
          strokeWidth={2.5}
        />
        <line
          x1={staffRight}
          y1={getDrumStepY(8)}
          x2={staffRight}
          y2={getDrumStepY(0)}
          stroke="#1E293B"
          strokeWidth={2.5}
        />

        {/* Neutral Percussion Clef (Two vertical bars spanning lines 2 to 4) */}
        <g aria-hidden="true">
          <rect x={68} y={getDrumStepY(6)} width={7} height={44} rx={2} fill="#0F172A" />
          <rect x={82} y={getDrumStepY(6)} width={7} height={44} rx={2} fill="#2563EB" />
        </g>

        {/* Time signature 4/4 for groove reading */}
        <g aria-hidden="true" className="fill-slate-800 font-display font-bold text-[24px]">
          <text x={114} y={getDrumStepY(5) + 4} textAnchor="middle">
            4
          </text>
          <text x={114} y={getDrumStepY(1) + 4} textAnchor="middle">
            4
          </text>
        </g>

        {/* Interactive Hit Zones for Drum Placement */}
        {interactivePlacement &&
          DRUM_PIECES.map((piece) => {
            const y = getDrumStepY(piece.staffStep);
            const isHovered = hoverStep === piece.staffStep;
            return (
              <g
                key={`drum-hit-${piece.id}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoverStep(piece.staffStep)}
                onMouseLeave={() => setHoverStep(null)}
                onClick={() => onStepSelect?.(piece)}
              >
                <rect
                  x={150}
                  y={y - 8}
                  width={445}
                  height={16}
                  fill={isHovered ? 'rgba(37, 99, 235, 0.08)' : 'transparent'}
                />
              </g>
            );
          })}

        {/* Hover preview notehead */}
        {interactivePlacement && hoverPiece && (
          <g
            transform={`translate(355, ${getDrumStepY(hoverPiece.staffStep)})`}
            pointerEvents="none"
            opacity={0.55}
          >
            {renderNoteHead(hoverPiece.notehead, '#2563EB', hoverPiece.staffStep)}
          </g>
        )}

        {/* Rendered Drum Notes */}
        {notes.map((item, idx) => {
          const { piece, state = 'default', showLabel = false } = item;
          const x = xPositions[idx] ?? 355;
          const y = getDrumStepY(piece.staffStep);

          let fillColor = '#0F172A';
          if (state === 'active') fillColor = '#2563EB';
          if (state === 'correct') fillColor = '#059669';
          if (state === 'wrong') fillColor = '#DC2626';

          return (
            <g
              key={`${piece.id}-${idx}`}
              transform={`translate(${x}, ${y})`}
              onClick={() => onNoteClick?.(piece, idx)}
              className={onNoteClick ? 'cursor-pointer' : undefined}
            >
              {(state === 'active' || state === 'correct') && (
                <circle
                  cx={0}
                  cy={0}
                  r={21}
                  fill={state === 'correct' ? '#D1FAE5' : '#DBEAFE'}
                  opacity={0.8}
                />
              )}

              {renderNoteHead(piece.notehead, fillColor, piece.staffStep)}

              {showLabel && (
                <g transform={`translate(0, ${piece.staffStep <= 3 ? -26 : 30})`}>
                  <rect
                    x={-36}
                    y={-12}
                    width={72}
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
                    className="fill-slate-900 text-[11px] font-bold"
                  >
                    {piece.name.split(' ')[0]}
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
