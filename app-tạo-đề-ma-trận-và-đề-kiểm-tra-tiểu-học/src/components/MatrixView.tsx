import React from 'react';
import { ExamDocument } from '../types/exam';
import { Award, CheckCircle2, FileText, Info } from 'lucide-react';

interface Props {
  exam: ExamDocument;
  onUpdateMatrix?: (updatedExam: ExamDocument) => void;
}

export const MatrixView: React.FC<Props> = ({ exam }) => {
  const { matrix, matrixSummary } = exam;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Title & Official Standards Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-block bg-white/20 backdrop-blur-xs text-xs px-2.5 py-1 rounded-full font-medium mb-1.5 tracking-wide uppercase">
              Chuẩn GDPT 2018 & Thông tư 27/2020/TT-BGDĐT
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ MÔN {exam.subject.toUpperCase()} - LỚP {exam.grade}
            </h2>
            <p className="text-blue-100 text-xs mt-1">
              Học kỳ: {exam.semester} • Thời lượng: {exam.durationMinutes} phút • Bộ sách: {exam.bookSeries}
            </p>
          </div>
          <div className="text-right bg-white/10 px-4 py-2.5 rounded-lg border border-white/15">
            <div className="text-xs text-blue-100 font-medium">TỔNG ĐIỂM BÀI THI</div>
            <div className="text-2xl font-black">{matrixSummary.total_points} ĐIỂM</div>
          </div>
        </div>
      </div>

      {/* Ratios Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-slate-200 border-b border-slate-200 text-center text-xs">
        <div className="bg-slate-50 p-3">
          <span className="text-slate-700 block font-medium">Mức 1 (Biết)</span>
          <span className="text-sm font-bold text-slate-800">{matrixSummary.m1_points}đ ({matrixSummary.m1_percent}%)</span>
        </div>
        <div className="bg-slate-50 p-3">
          <span className="text-slate-700 block font-medium">Mức 2 (Hiểu)</span>
          <span className="text-sm font-bold text-blue-700">{matrixSummary.m2_points}đ ({matrixSummary.m2_percent}%)</span>
        </div>
        <div className="bg-slate-50 p-3">
          <span className="text-slate-700 block font-medium">Mức 3 (Vận dụng)</span>
          <span className="text-sm font-bold text-emerald-700">{matrixSummary.m3_points}đ ({matrixSummary.m3_percent}%)</span>
        </div>
        <div className="bg-slate-50 p-3">
          <span className="text-slate-700 block font-medium">Trắc nghiệm</span>
          <span className="text-sm font-bold text-indigo-700">{matrixSummary.tn_points}đ ({matrixSummary.tn_percent}%)</span>
        </div>
        <div className="bg-slate-50 p-3">
          <span className="text-slate-700 block font-medium">Tự luận</span>
          <span className="text-sm font-bold text-amber-700">{matrixSummary.tl_points}đ ({matrixSummary.tl_percent}%)</span>
        </div>
      </div>

      {/* Notice on Strict Rules */}
      <div className="bg-amber-50/80 px-4 py-2.5 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Lưu ý chuyên môn:</strong> Cấu trúc ma trận tuân thủ tuyệt đối: <strong>Không tạo câu trắc nghiệm ở Mức 3 (Vận dụng)</strong>. Tỷ lệ phân bố mạch kiến thức chuẩn theo số tiết chương trình 2018.
        </span>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto p-4">
        <table className="w-full text-xs text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold text-center">
              <th rowSpan={2} className="border border-slate-300 p-2.5 min-w-[180px] text-left">
                Mạch kiến thức / Chủ đề
              </th>
              <th colSpan={2} className="border border-slate-300 p-2 bg-blue-50/70 text-blue-900">
                Mức 1 (Biết)
              </th>
              <th colSpan={2} className="border border-slate-300 p-2 bg-indigo-50/70 text-indigo-900">
                Mức 2 (Hiểu)
              </th>
              <th colSpan={2} className="border border-slate-300 p-2 bg-emerald-50/70 text-emerald-900">
                Mức 3 (Vận dụng)
              </th>
              <th colSpan={3} className="border border-slate-300 p-2 bg-slate-200/80">
                Tổng cộng
              </th>
            </tr>
            <tr className="bg-slate-50 text-slate-700 font-semibold text-center">
              <th className="border border-slate-300 p-1.5 w-16">TN</th>
              <th className="border border-slate-300 p-1.5 w-16">TL</th>
              <th className="border border-slate-300 p-1.5 w-16">TN</th>
              <th className="border border-slate-300 p-1.5 w-16">TL</th>
              <th className="border border-slate-300 p-1.5 w-16 bg-slate-100 text-slate-400">TN</th>
              <th className="border border-slate-300 p-1.5 w-16">TL</th>
              <th className="border border-slate-300 p-1.5 w-16">Số câu</th>
              <th className="border border-slate-300 p-1.5 w-16">Điểm</th>
              <th className="border border-slate-300 p-1.5 w-16">Tỉ lệ</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="border border-slate-300 p-2.5 font-medium text-slate-900">
                  {row.topic}
                </td>
                {/* Mức 1 */}
                <td className="border border-slate-300 p-2 text-center">
                  {row.m1_tn_count > 0 ? (
                    <div>
                      <span className="font-bold text-blue-700">{row.m1_tn_count}</span>
                      <span className="text-[10px] text-slate-700 block">({row.m1_tn_points}đ)</span>
                    </div>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="border border-slate-300 p-2 text-center">
                  {row.m1_tl_count > 0 ? (
                    <div>
                      <span className="font-bold text-amber-700">{row.m1_tl_count}</span>
                      <span className="text-[10px] text-slate-700 block">({row.m1_tl_points}đ)</span>
                    </div>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>

                {/* Mức 2 */}
                <td className="border border-slate-300 p-2 text-center">
                  {row.m2_tn_count > 0 ? (
                    <div>
                      <span className="font-bold text-blue-700">{row.m2_tn_count}</span>
                      <span className="text-[10px] text-slate-700 block">({row.m2_tn_points}đ)</span>
                    </div>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="border border-slate-300 p-2 text-center">
                  {row.m2_tl_count > 0 ? (
                    <div>
                      <span className="font-bold text-amber-700">{row.m2_tl_count}</span>
                      <span className="text-[10px] text-slate-700 block">({row.m2_tl_points}đ)</span>
                    </div>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>

                {/* Mức 3 (Vận dụng) - TN always 0 */}
                <td className="border border-slate-300 p-2 text-center bg-slate-50 text-slate-300 font-mono">
                  -
                </td>
                <td className="border border-slate-300 p-2 text-center">
                  {row.m3_tl_count > 0 ? (
                    <div>
                      <span className="font-bold text-emerald-700">{row.m3_tl_count}</span>
                      <span className="text-[10px] text-slate-700 block">({row.m3_tl_points}đ)</span>
                    </div>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>

                {/* Tổng dòng */}
                <td className="border border-slate-300 p-2 text-center font-bold text-slate-800">
                  {row.total_questions}
                </td>
                <td className="border border-slate-300 p-2 text-center font-bold text-blue-800">
                  {row.total_points}đ
                </td>
                <td className="border border-slate-300 p-2 text-center font-bold text-slate-600">
                  {row.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold text-slate-900 text-center border-t-2 border-slate-400">
              <td className="border border-slate-300 p-2.5 text-left">TỔNG CỘNG</td>
              <td className="border border-slate-300 p-2 text-blue-800">
                {matrix.reduce((a, b) => a + b.m1_tn_count, 0)} câu
                <span className="block text-[10px] text-slate-700">({matrix.reduce((a, b) => a + b.m1_tn_points, 0).toFixed(1)}đ)</span>
              </td>
              <td className="border border-slate-300 p-2 text-amber-800">
                {matrix.reduce((a, b) => a + b.m1_tl_count, 0)} câu
                <span className="block text-[10px] text-slate-700">({matrix.reduce((a, b) => a + b.m1_tl_points, 0).toFixed(1)}đ)</span>
              </td>
              <td className="border border-slate-300 p-2 text-blue-800">
                {matrix.reduce((a, b) => a + b.m2_tn_count, 0)} câu
                <span className="block text-[10px] text-slate-700">({matrix.reduce((a, b) => a + b.m2_tn_points, 0).toFixed(1)}đ)</span>
              </td>
              <td className="border border-slate-300 p-2 text-amber-800">
                {matrix.reduce((a, b) => a + b.m2_tl_count, 0)} câu
                <span className="block text-[10px] text-slate-700">({matrix.reduce((a, b) => a + b.m2_tl_points, 0).toFixed(1)}đ)</span>
              </td>
              <td className="border border-slate-300 p-2 bg-slate-100 text-slate-400 font-mono">
                0
              </td>
              <td className="border border-slate-300 p-2 text-emerald-800">
                {matrix.reduce((a, b) => a + b.m3_tl_count, 0)} câu
                <span className="block text-[10px] text-slate-700">({matrix.reduce((a, b) => a + b.m3_tl_points, 0).toFixed(1)}đ)</span>
              </td>
              <td className="border border-slate-300 p-2 text-slate-900 font-extrabold">
                {matrix.reduce((a, b) => a + b.total_questions, 0)} câu
              </td>
              <td className="border border-slate-300 p-2 text-blue-900 font-extrabold text-sm">
                {matrixSummary.total_points}đ
              </td>
              <td className="border border-slate-300 p-2 font-extrabold">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
