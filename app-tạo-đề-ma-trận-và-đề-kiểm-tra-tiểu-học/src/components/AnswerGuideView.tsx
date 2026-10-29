import React from 'react';
import { ExamDocument } from '../types/exam';
import { CheckCheck, HelpCircle } from 'lucide-react';

interface Props {
  exam: ExamDocument;
}

export const AnswerGuideView: React.FC<Props> = ({ exam }) => {
  const mcqQuestions = exam.questions.filter((q) => q.format === 'mcq');
  const otherQuestions = exam.questions.filter((q) => q.format !== 'mcq');

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-800 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-block bg-white/20 backdrop-blur-xs text-xs px-2.5 py-1 rounded-full font-medium mb-1.5 tracking-wide uppercase">
              Hướng dẫn chấm & Thang điểm chi tiết
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM MÔN {exam.subject.toUpperCase()} - LỚP {exam.grade}
            </h2>
            <p className="text-purple-200 text-xs mt-1">
              {exam.title} • {exam.schoolYear}
            </p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/15 text-xs text-right">
            <span className="text-purple-200 block">Thang điểm toàn bài</span>
            <span className="text-xl font-bold">{exam.matrixSummary.total_points} điểm</span>
          </div>
        </div>
      </div>

      {/* Note for Teachers */}
      <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-200 text-xs text-purple-950 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-purple-700 shrink-0" />
        <span>
          <strong>Lưu ý chấm bài:</strong> Học sinh giải theo cách khác nhưng đúng bản chất toán học/kiến thức vẫn được cho điểm tối đa. Điểm toàn bài làm tròn theo quy định của Thông tư 27.
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick MCQ Answer Table if any */}
        {mcqQuestions.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-purple-600" />
              1. Bảng đáp án trắc nghiệm nhiều lựa chọn:
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-purple-50 text-purple-900 font-bold">
                    {mcqQuestions.map((q) => (
                      <th key={q.id} className="border border-slate-300 p-2">
                        Câu {q.number}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {mcqQuestions.map((q) => (
                      <td key={q.id} className="border border-slate-300 p-2.5 font-black text-sm text-purple-700">
                        {q.correctOption || 'A'}
                        <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                          ({q.points.toString().replace('.', ',')}đ)
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Solutions & Rubric for All Questions */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-indigo-600" />
            2. Hướng dẫn chấm và biểu điểm chi tiết từng câu:
          </h3>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {exam.questions.map((q) => (
              <div key={q.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="font-bold text-sm text-slate-900">
                    Câu {q.number}: <span className="font-normal text-slate-600">({q.topic})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                      Mức {q.level}
                    </span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {q.points.toString().replace('.', ',')} điểm
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 mb-2 italic">
                  &ldquo;{q.prompt}&rdquo;
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  <strong className="text-purple-900 block mb-1">Hướng dẫn chấm và đáp án:</strong>
                  {q.answerGuide || 'Học sinh làm đúng theo yêu cầu đạt điểm tối đa.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
