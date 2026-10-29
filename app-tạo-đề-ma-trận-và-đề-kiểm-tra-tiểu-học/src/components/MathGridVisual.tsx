import React from 'react';
import { GridVisual } from '../types/exam';

interface Props {
  grid: GridVisual;
}

export const MathGridVisual: React.FC<Props> = ({ grid }) => {
  const { rows, cols, cellSize = 28, shapes = [] } = grid;
  const width = cols * cellSize;
  const height = rows * cellSize;

  return (
    <div className="my-3 p-3 bg-white border border-dashed border-sky-300 rounded-lg inline-block shadow-xs">
      <div className="text-xs text-sky-800 font-medium mb-1 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
        Hình vẽ trên lưới ô vuông (Mỗi ô vuông cạnh 1 cm):
      </div>
      <svg
        width={width}
        height={height}
        className="bg-sky-50/40 border border-sky-400 select-none"
      >
        <defs>
          <pattern
            id={`grid-pattern-${rows}-${cols}`}
            width={cellSize}
            height={cellSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
              fill="none"
              stroke="#bae6fd"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Background Grid Lines */}
        <rect width={width} height={height} fill={`url(#grid-pattern-${rows}-${cols})`} />

        {/* Shapes on Grid */}
        {shapes.map((s, idx) => {
          if (s.type === 'rect') {
            const x = (s.startCol || 1) * cellSize - cellSize;
            const y = (s.startRow || 1) * cellSize - cellSize;
            const w = ((s.endCol || 2) - (s.startCol || 1) + 1) * cellSize;
            const h = ((s.endRow || 2) - (s.startRow || 1) + 1) * cellSize;

            return (
              <g key={idx}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={s.fillColor || 'rgba(59, 130, 246, 0.25)'}
                  stroke="#2563eb"
                  strokeWidth="2"
                />
                {s.label && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + 5}
                    textAnchor="middle"
                    className="text-xs font-bold fill-blue-900"
                  >
                    {s.label}
                  </text>
                )}
              </g>
            );
          }

          if (s.type === 'grid_count') {
            const x = (s.startCol || 1) * cellSize - cellSize;
            const y = (s.startRow || 1) * cellSize - cellSize;
            const w = ((s.endCol || cols) - (s.startCol || 1) + 1) * cellSize;
            const h = ((s.endRow || rows) - (s.startRow || 1) + 1) * cellSize;

            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width={w}
                height={h}
                fill="rgba(14, 165, 233, 0.15)"
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            );
          }

          return null;
        })}

        {/* Outer border */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};
