import React from 'react';
import { ExamDocument } from '../types/exam';
import { ClipboardCheck, Sparkles } from 'lucide-react';

interface Props {
  exam: ExamDocument;
}

export const SpecificationView: React.FC<Props> = ({ exam }) => {
  const { specifications } = exam;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-block bg-white/20 backdrop-blur-xs text-xs px-2.5 py-1 rounded-full font-medium mb-1.5 tracking-wide uppercase">
              Bảng Đặc Tả Yêu Cầu Cần Đạt (1 Câu = 1 Đặc Tả)
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              BẢN ĐẶC TẢ MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ MÔN {exam.subject.toUpperCase()} - LỚP {exam.grade}
            </h2>
            <p className="text-emerald-100 text-xs mt-1">
              Phát triển phẩm chất và năng lực học sinh theo Thông tư 27/2020/TT-BGDĐT
            </p>
          </div>
          <div className="text-right bg-white/10 px-3.5 py-2 rounded-lg border border-white/15 text-xs">
            <span className="text-emerald-100 block">Số lượng đặc tả</span>
            <span className="text-xl font-bold">{specifications.length} câu hỏi</span>
          </div>
        </div>
      </div>

      {/* Rules Reminder */}
      <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Nguyên tắc đặc tả:</strong> Một chủ đề/bài có nhiều câu hỏi thì mỗi câu hỏi tương ứng đúng 1 đặc tả yêu cầu cần đạt riêng biệt. Không ghép câu thuộc 2 chủ đề với nhau.
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto p-4">
        <table className="w-full text-xs text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold text-center">
              <th className="border border-slate-300 p-2.5 w-16">Câu số</th>
              <th className="border border-slate-300 p-2.5 w-44 text-left">Chủ đề / Mạch KT</th>
              <th className="border border-slate-300 p-2.5 w-24">Mức độ</th>
              <th className="border border-slate-300 p-2.5 w-40">Hình thức</th>
              <th className="border border-slate-300 p-2.5 text-left">Yêu cầu cần đạt chuẩn GDPT 2018</th>
              <th className="border border-slate-300 p-2.5 w-16">Điểm</th>
            </tr>
          </thead>
          <tbody>
            {specifications.map((spec, idx) => {
              const isM1 = spec.level.includes('1');
              const isM2 = spec.level.includes('2');
              const isM3 = spec.level.includes('3');

              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-300 p-2.5 text-center font-bold text-slate-900">
                    Câu {spec.questionNumber}
                  </td>
                  <td className="border border-slate-300 p-2.5 font-medium text-slate-800">
                    {spec.topic}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isM1
                          ? 'bg-blue-100 text-blue-800'
                          : isM2
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {spec.level}
                    </span>
                  </td>
                  <td className="border border-slate-300 p-2.5 text-slate-700">
                    {spec.formatName}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-slate-800 leading-relaxed">
                    {spec.competencyRequired}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-center font-bold text-blue-700">
                    {spec.points.toString().replace('.', ',')}đ
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
