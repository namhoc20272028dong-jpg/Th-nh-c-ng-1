import React, { useState } from 'react';
import { GridVisual } from '../types/exam';
import { Grid, Check, X, Plus, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyGrid: (grid: GridVisual) => void;
  initialGrid?: GridVisual;
}

export const MathGridDrawer: React.FC<Props> = ({ isOpen, onClose, onApplyGrid, initialGrid }) => {
  const [rows, setRows] = useState(initialGrid?.rows || 4);
  const [cols, setCols] = useState(initialGrid?.cols || 6);
  const [cellSize, setCellSize] = useState(initialGrid?.cellSize || 28);
  const [label, setLabel] = useState('ABCD');
  const [startRow, setStartRow] = useState(1);
  const [startCol, setStartCol] = useState(1);
  const [endRow, setEndRow] = useState(3);
  const [endCol, setEndCol] = useState(5);

  if (!isOpen) return null;

  const handleApply = () => {
    const grid: GridVisual = {
      rows,
      cols,
      cellSize,
      shapes: [
        {
          type: 'rect',
          startRow,
          startCol,
          endRow,
          endCol,
          fillColor: 'rgba(59, 130, 246, 0.25)',
          label,
        },
      ],
    };
    onApplyGrid(grid);
    onClose();
  };

  const currentWidth = cols * cellSize;
  const currentHeight = rows * cellSize;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="bg-sky-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Grid className="w-4 h-4 text-sky-200" />
            Tạo & Tùy Chỉnh Hình Vẽ Trên Lưới Ô Vuông
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-700">
          <p className="text-slate-600">
            Hỗ trợ vẽ hình chữ nhật, hình vuông trên lưới ô vuông (mỗi cạnh 1 cm) cho môn Toán Lớp 1 - Lớp 5.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold block mb-1">Số hàng (dọc):</label>
              <input
                type="number"
                min={2}
                max={10}
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value, 10) || 4)}
                className="w-full p-2 border border-slate-300 rounded text-center"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Số cột (ngang):</label>
              <input
                type="number"
                min={2}
                max={12}
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value, 10) || 6)}
                className="w-full p-2 border border-slate-300 rounded text-center"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Kích cỡ ô (px):</label>
              <input
                type="number"
                min={15}
                max={40}
                value={cellSize}
                onChange={(e) => setCellSize(parseInt(e.target.value, 10) || 28)}
                className="w-full p-2 border border-slate-300 rounded text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Tên hình (nhãn):</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Tọa độ hình (Hàng 1-Hàng 2, Cột 1-Cột 2):</label>
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  min={1}
                  max={rows}
                  value={startRow}
                  onChange={(e) => setStartRow(parseInt(e.target.value, 10) || 1)}
                  className="w-12 p-1.5 border border-slate-300 rounded text-center"
                />
                <span>đến</span>
                <input
                  type="number"
                  min={1}
                  max={rows}
                  value={endRow}
                  onChange={(e) => setEndRow(parseInt(e.target.value, 10) || 3)}
                  className="w-12 p-1.5 border border-slate-300 rounded text-center"
                />
                <span className="ml-1">|</span>
                <input
                  type="number"
                  min={1}
                  max={cols}
                  value={startCol}
                  onChange={(e) => setStartCol(parseInt(e.target.value, 10) || 1)}
                  className="w-12 p-1.5 border border-slate-300 rounded text-center"
                />
                <span>đến</span>
                <input
                  type="number"
                  min={1}
                  max={cols}
                  value={endCol}
                  onChange={(e) => setEndCol(parseInt(e.target.value, 10) || 5)}
                  className="w-12 p-1.5 border border-slate-300 rounded text-center"
                />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
            <div className="font-semibold text-slate-700 mb-2">Xem trước trực tiếp:</div>
            <div className="inline-block border border-sky-400 bg-sky-50/40">
              <svg width={currentWidth} height={currentHeight}>
                <defs>
                  <pattern
                    id="grid-preview-pat"
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
                <rect width={currentWidth} height={currentHeight} fill="url(#grid-preview-pat)" />
                {/* Drawn rect */}
                <rect
                  x={(startCol - 1) * cellSize}
                  y={(startRow - 1) * cellSize}
                  width={(endCol - startCol + 1) * cellSize}
                  height={(endRow - startRow + 1) * cellSize}
                  fill="rgba(59, 130, 246, 0.25)"
                  stroke="#2563eb"
                  strokeWidth="2"
                />
                <text
                  x={(startCol - 1) * cellSize + ((endCol - startCol + 1) * cellSize) / 2}
                  y={(startRow - 1) * cellSize + ((endRow - startRow + 1) * cellSize) / 2 + 5}
                  textAnchor="middle"
                  className="text-xs font-bold fill-blue-900"
                >
                  {label}
                </text>
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Áp Dụng Lưới Ô Vuông
          </button>
        </div>
      </div>
    </div>
  );
};
