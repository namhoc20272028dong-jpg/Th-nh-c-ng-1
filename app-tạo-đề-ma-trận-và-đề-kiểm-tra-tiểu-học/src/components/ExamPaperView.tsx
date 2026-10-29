import React, { useState } from 'react';
import { ExamDocument, QuestionItem } from '../types/exam';
import { MathGridVisual } from './MathGridVisual';
import { Edit3, Check, RotateCcw, Shuffle, BookOpen, Printer, Download } from 'lucide-react';

interface Props {
  exam: ExamDocument;
  onUpdateQuestion?: (index: number, updated: QuestionItem) => void;
  onShuffleOptions?: () => void;
}

export const ExamPaperView: React.FC<Props> = ({ exam, onUpdateQuestion, onShuffleOptions }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editPoints, setEditPoints] = useState<number>(0.5);

  const startEdit = (idx: number, q: QuestionItem) => {
    setEditingIndex(idx);
    setEditPrompt(q.prompt);
    setEditPoints(q.points);
  };

  const saveEdit = (idx: number) => {
    if (onUpdateQuestion) {
      const q = exam.questions[idx];
      onUpdateQuestion(idx, {
        ...q,
        prompt: editPrompt,
        points: editPoints,
      });
    }
    setEditingIndex(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden font-serif">
      {/* Top Controls Header (Non-print) */}
      <div className="bg-slate-800 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-sans print:hidden">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-300">ĐỀ BÀI CHUẨN THỂ THỨC TIỂU HỌC</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">
            Không ghi phân đoạn Trắc nghiệm/Tự luận • Số thứ tự liên tục Câu 1 đến {exam.questions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onShuffleOptions && (
            <button
              onClick={onShuffleOptions}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md font-medium transition-colors"
              title="Đảo thứ tự phương án trắc nghiệm để tạo các mã đề khác nhau"
            >
              <Shuffle className="w-3.5 h-3.5 text-sky-400" />
              Đảo phương án (Mã đề A/B)
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            In ấn / Lưu PDF
          </button>
        </div>
      </div>

      {/* Actual Exam Paper Sheet (A4 Style Paper) */}
      <div className="p-8 sm:p-12 text-slate-900 leading-relaxed max-w-4xl mx-auto print:p-0 print:max-w-none">
        {/* Header Block according to Vietnamese School Standard */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-400 text-center text-sm font-sans">
          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wide text-xs sm:text-sm">
              {exam.schoolName}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Họ và tên: ..............................................................
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Lớp: {exam.grade}.... • SBD: ............ Phòng thi: ............
            </div>
          </div>
          <div>
            <div className="font-bold text-slate-900 uppercase tracking-wide text-xs sm:text-sm">
              {exam.title}
            </div>
            <div className="font-bold text-blue-900 text-xs sm:text-sm mt-0.5">
              MÔN: {exam.subject.toUpperCase()} - LỚP {exam.grade}
            </div>
            <div className="text-xs italic text-slate-600 mt-0.5">
              Thời gian làm bài: {exam.durationMinutes} phút ({exam.schoolYear})
            </div>
          </div>
        </div>

        {/* Score and Teacher Comment Box */}
        <div className="grid grid-cols-2 border border-slate-400 my-4 text-center text-xs font-sans">
          <div className="border-r border-slate-400 p-2">
            <div className="font-bold uppercase text-slate-700">Điểm số</div>
            <div className="h-10"></div>
          </div>
          <div className="p-2">
            <div className="font-bold uppercase text-slate-700">Lời nhận xét của thầy cô giáo</div>
            <div className="h-10"></div>
          </div>
        </div>

        {/* TIẾNG VIỆT: Phần Đọc thành tiếng & Phần Đọc hiểu */}
        {exam.passage && (
          <div className="my-6 p-5 bg-amber-50/40 border border-amber-300 rounded-lg print:border-slate-400">
            <div className="text-center mb-3">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 uppercase tracking-wide">
                {exam.passage.title}
              </h3>
              <p className="text-xs italic text-slate-600 mt-0.5 font-sans">
                ({exam.passage.author} • Văn bản ngoài chương trình - Độ dài: {exam.passage.wordCount} chữ - {exam.passage.expectedWordRange})
              </p>
            </div>
            <div className="text-justify text-sm sm:text-base leading-relaxed whitespace-pre-line text-slate-800 indent-8">
              {exam.passage.content}
            </div>
            <div className="text-center mt-3 text-slate-400 text-xs font-sans">
              -----------------------o0o-----------------------
            </div>
          </div>
        )}

        {/* TIẾNG VIỆT SECTIONS OVERVIEW (Đọc thành tiếng & Viết) */}
        {exam.tvSections && (
          <div className="my-4 p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs font-sans text-blue-950">
            <div className="font-bold mb-1 flex items-center gap-1.5 text-blue-900">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Cơ cấu toàn diện môn Tiếng Việt theo Chương trình GDPT 2018:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>
                <strong>A. Đọc thành tiếng:</strong> {exam.tvSections.oralReading.description}
              </li>
              <li>
                <strong>B. Đọc hiểu & Kiến thức Tiếng Việt:</strong> {exam.questions.length} câu hỏi dưới đây ({exam.matrixSummary.total_points} điểm).
              </li>
              <li>
                <strong>C. Phần Viết:</strong> {exam.tvSections.writtenExam.description}
              </li>
            </ul>
          </div>
        )}

        {/* QUESTIONS LIST */}
        <div className="space-y-6 mt-4">
          {exam.questions.map((q, idx) => {
            const isEditing = editingIndex === idx;
            const letters = ['A', 'B', 'C', 'D'];

            return (
              <div
                key={q.id || idx}
                className="relative group rounded-md transition-all hover:bg-slate-50/70 p-2 -mx-2"
              >
                {/* Question line: Câu số (in đậm), điểm (chữ nghiêng không đậm) liền câu số, câu hỏi (không đậm) */}
                {isEditing ? (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-300 font-sans text-xs mb-3">
                    <div className="flex gap-2 items-center mb-2">
                      <label className="font-bold">Điểm số:</label>
                      <input
                        type="number"
                        step="0.25"
                        value={editPoints}
                        onChange={(e) => setEditPoints(parseFloat(e.target.value) || 0)}
                        className="w-20 p-1 border border-slate-300 rounded text-center font-bold"
                      />
                    </div>
                    <label className="font-bold block mb-1">Nội dung câu hỏi:</label>
                    <textarea
                      rows={3}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded font-serif text-sm"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 font-medium"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => saveEdit(idx)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm sm:text-base text-slate-900 leading-normal">
                    {/* Quy chuẩn: Câu số (in đậm), điểm (nghiêng không đậm) liền câu số, câu hỏi (không đậm) */}
                    <span className="font-bold font-serif">Câu {q.number}</span>
                    <span className="italic font-serif font-normal">
                      ({q.points.toString().replace('.', ',')} điểm):{' '}
                    </span>
                    <span className="font-normal font-serif">{q.prompt}</span>

                    {/* Edit button (Non-print) */}
                    <button
                      onClick={() => startEdit(idx, q)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-slate-400 hover:text-blue-600 inline-flex items-center text-xs font-sans print:hidden"
                      title="Chỉnh sửa câu hỏi"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-0.5" /> Sửa
                    </button>
                  </div>
                )}

                {/* Grid Visual for Math (Lưới ô vuông cho Toán) */}
                {q.gridVisual && (
                  <div className="ml-0 sm:ml-4">
                    <MathGridVisual grid={q.gridVisual} />
                  </div>
                )}

                {/* Multiple Choice Options (Lùi vào 1 tab ~ 1cm / pl-8) */}
                {q.options && q.options.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 pl-6 sm:pl-8">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="text-sm sm:text-base flex items-start gap-2">
                        <span className="font-bold min-w-[24px]">{letters[optIdx]}.</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub items for True/False (Câu số và ý a, b bằng lề - không tab) */}
                {q.subItems && q.subItems.length > 0 && (
                  <div className="mt-2 space-y-2 pl-0 sm:pl-1">
                    {q.subItems.map((sub, sIdx) => (
                      <div key={sIdx} className="text-sm sm:text-base flex items-center justify-between gap-4">
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold">{sub.label})</span>
                          <span>{sub.statement}</span>
                        </div>
                        <div className="w-16 h-7 border border-slate-400 rounded-xs flex items-center justify-center text-xs font-sans text-slate-400 shrink-0">
                          [ ...... ]
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Matching pairs */}
                {q.matchingPairs && q.matchingPairs.length > 0 && (
                  <div className="mt-2 space-y-1.5 pl-6 sm:pl-8">
                    {q.matchingPairs.map((pair, pIdx) => (
                      <div key={pIdx} className="text-sm sm:text-base flex items-center gap-3">
                        <span className="font-bold min-w-[140px] sm:min-w-[180px]">
                          {pair.leftNumber}. {pair.leftText}
                        </span>
                        <span className="text-slate-400">----------------</span>
                        <span>
                          {pair.rightLetter}. {pair.rightText}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fill in the blanks */}
                {q.blanksPrompt && (
                  <div className="mt-2 pl-6 sm:pl-8 text-sm sm:text-base whitespace-pre-line text-slate-800">
                    {q.blanksPrompt}
                  </div>
                )}

                {/* Essay Writing Area */}
                {(q.format === 'essay' || q.format === 'practice') && (
                  <div className="mt-3 pl-6 sm:pl-8 font-serif">
                    <div className="italic text-xs text-slate-500 mb-1">Bài làm:</div>
                    <div className="space-y-3.5 pt-1">
                      <div className="border-b border-dotted border-slate-400 h-4"></div>
                      <div className="border-b border-dotted border-slate-400 h-4"></div>
                      <div className="border-b border-dotted border-slate-400 h-4"></div>
                      <div className="border-b border-dotted border-slate-400 h-4"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer of Exam */}
        <div className="text-center mt-12 pt-6 border-t border-slate-300 text-xs italic font-sans text-slate-500">
          --- HẾT ---
          <br />
          (Cán bộ coi kiểm tra không giải thích gì thêm)
        </div>
      </div>
    </div>
  );
};
