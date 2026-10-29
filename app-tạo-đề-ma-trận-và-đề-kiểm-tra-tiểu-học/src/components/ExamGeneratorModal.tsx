import React, { useState } from 'react';
import { Grade, Semester, Subject } from '../types/exam';
import { Sparkles, Zap, X, BookOpen, Layers, Calendar, School, Check, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerateInstant: (params: {
    schoolName: string;
    schoolYear: string;
    grade: Grade;
    subject: Subject;
    semester: Semester;
    bookSeries: string;
    customTopic?: string;
  }) => void;
  onGenerateAI: (params: {
    schoolName: string;
    schoolYear: string;
    grade: Grade;
    subject: Subject;
    semester: Semester;
    bookSeries: string;
    customTopics?: string;
    readingGenre?: string;
  }) => Promise<void>;
  isLoadingAI: boolean;
}

export const ExamGeneratorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onGenerateInstant,
  onGenerateAI,
  isLoadingAI,
}) => {
  const [subject, setSubject] = useState<Subject>('Toán');
  const [grade, setGrade] = useState<Grade>(4);
  const [semester, setSemester] = useState<Semester>('Cuối Học kỳ I');
  const [bookSeries, setBookSeries] = useState<string>('Kết nối tri thức với cuộc sống');
  const [schoolName, setSchoolName] = useState<string>('TRƯỜNG TIỂU HỌC KIM ĐỒNG');
  const [schoolYear, setSchoolYear] = useState<string>('NĂM HỌC 2025 - 2026');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [readingGenre, setReadingGenre] = useState<string>('truyện');
  const [aiError, setAiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstant = () => {
    onGenerateInstant({
      schoolName,
      schoolYear,
      grade,
      subject,
      semester,
      bookSeries,
      customTopic,
    });
    onClose();
  };

  const handleAI = async () => {
    setAiError(null);
    try {
      await onGenerateAI({
        schoolName,
        schoolYear,
        grade,
        subject,
        semester,
        bookSeries,
        customTopics: customTopic,
        readingGenre: subject === 'Tiếng Việt' ? readingGenre : undefined,
      });
      onClose();
    } catch (err: any) {
      setAiError(err.message || 'Lỗi tạo đề với AI. Bạn có thể sử dụng Tạo Nhanh Chuẩn Hóa!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-5 text-white flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-blue-200 tracking-wider uppercase flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Thiết Lập Đề Kiểm Tra Chuyên Nghiệp
            </div>
            <h2 className="text-xl font-bold">Tạo Ma Trận, Bản Đặc Tả & Đề Mới</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm text-slate-800">
          {aiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* School Name & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block text-xs text-slate-600 mb-1">
                Tên trường tiểu học:
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold block text-xs text-slate-600 mb-1">
                Năm học:
              </label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Subject & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block text-xs text-slate-600 mb-1">
                Môn học:
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="Toán">Toán</option>
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="Tin học">Tin học</option>
                <option value="Lịch sử và Địa lý">Lịch sử và Địa lý (Lớp 4, 5)</option>
                <option value="Khoa học">Khoa học (Lớp 4, 5)</option>
                <option value="Công nghệ">Công nghệ (Lớp 3, 4, 5)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block text-xs text-slate-600 mb-1">
                Khối lớp:
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value, 10) as Grade)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value={1}>Lớp 1 (3 phương án A, B, C)</option>
                <option value={2}>Lớp 2 (3 phương án A, B, C)</option>
                <option value={3}>Lớp 3 (3 phương án A, B, C)</option>
                <option value={4}>Lớp 4 (4 phương án A, B, C, D)</option>
                <option value={5}>Lớp 5 (4 phương án A, B, C, D)</option>
              </select>
            </div>
          </div>

          {/* Semester & Book Series */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block text-xs text-slate-600 mb-1">
                Kỳ kiểm tra:
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as Semester)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="Giữa Học kỳ I">Giữa Học kỳ I (GKI)</option>
                <option value="Cuối Học kỳ I">Cuối Học kỳ I (CKI)</option>
                <option value="Giữa Học kỳ II">Giữa Học kỳ II (GKII)</option>
                <option value="Cuối Năm">Cuối Năm (CN)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block text-xs text-slate-600 mb-1">
                Bộ sách giáo khoa:
              </label>
              <select
                value={bookSeries}
                onChange={(e) => setBookSeries(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống</option>
                <option value="Cánh Diều">Cánh Diều</option>
                <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                <option value="Chuẩn kiến thức GDPT 2018 chung">Chuẩn kiến thức GDPT 2018 chung</option>
              </select>
            </div>
          </div>

          {/* Reading genre if Tiếng Việt */}
          {subject === 'Tiếng Việt' && (
            <div>
              <label className="font-semibold block text-xs text-slate-600 mb-1">
                Thể loại văn bản đọc ngoài chương trình:
              </label>
              <select
                value={readingGenre}
                onChange={(e) => setReadingGenre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="truyện">Truyện kể / Cổ tích cải biên</option>
                <option value="miêu tả">Đoạn văn miêu tả cảnh vật / thiên nhiên</option>
                <option value="thơ">Bài thơ thiếu nhi</option>
                <option value="thông tin">Văn bản thông tin / Khoa học thường thức</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                * Độ dài văn bản được hệ thống tự động chuẩn hóa đúng số chữ quy định cho Lớp {grade}.
              </span>
            </div>
          )}

          {/* Custom topic prompt */}
          <div>
            <label className="font-semibold block text-xs text-slate-600 mb-1">
              Chủ đề trọng tâm hoặc yêu cầu đặc biệt (tùy chọn):
            </label>
            <input
              type="text"
              placeholder="VD: Tập trung vào hình học và giải toán có lời văn; hoặc chủ đề bảo vệ môi trường..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Quick Notice on Rules applied */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Tự động áp dụng quy tắc Thông tư 27 & GDPT 2018:
            </div>
            <div>• Tỷ lệ Mức 1 (50%) - Mức 2 (30%) - Mức 3 (20%) chuẩn theo từng môn.</div>
            <div>• Thứ tự câu liên tục, xếp từ TN Biết/Hiểu đến TL Biết/Hiểu/Vận dụng.</div>
            <div>• <strong>Tuyệt đối không có câu trắc nghiệm ở Mức vận dụng (M3).</strong></div>
            <div>• Định dạng chuẩn: <em>Câu 1(0,5 điểm): CÂU HỎI ĐỂ CHỮ KHÔNG ĐẬM</em>.</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors text-xs"
          >
            Đóng
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstant}
              disabled={isLoadingAI}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium text-xs transition-colors shadow-xs"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Tạo Nhanh Chuẩn Hóa
            </button>
            <button
              onClick={handleAI}
              disabled={isLoadingAI}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              {isLoadingAI ? 'AI Đang Xây Dựng Đề...' : 'Tạo Bằng AI (Gemini 3.8 Flash)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
