import React, { useState } from 'react';
import { ExamDocument, Grade, QuestionItem, Semester, Subject } from './types/exam';
import { STANDARD_EXAM_PRESETS } from './data/standardExamBanks';
import { generateCurriculumCompliantExam } from './utils/examGeneratorEngine';
import { exportExamToDocx } from './utils/docxExport';
import { MatrixView } from './components/MatrixView';
import { SpecificationView } from './components/SpecificationView';
import { ExamPaperView } from './components/ExamPaperView';
import { AnswerGuideView } from './components/AnswerGuideView';
import { ExamGeneratorModal } from './components/ExamGeneratorModal';
import { MathGridDrawer } from './components/MathGridDrawer';
import {
  FileText,
  Table as TableIcon,
  ClipboardList,
  CheckCircle,
  Sparkles,
  Download,
  Printer,
  PlusCircle,
  BookOpen,
  Shuffle,
  Grid,
  School,
  Award,
  Layers,
  HelpCircle,
  Check,
} from 'lucide-react';

export default function App() {
  const [currentExam, setCurrentExam] = useState<ExamDocument>(STANDARD_EXAM_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<'paper' | 'matrix' | 'spec' | 'answers' | 'rules'>('paper');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isGridDrawerOpen, setIsGridDrawerOpen] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [examCode, setExamCode] = useState<string>('01');

  // Handle Instant generation using the built-in deterministic curriculum engine
  const handleGenerateInstant = (params: {
    schoolName: string;
    schoolYear: string;
    grade: Grade;
    subject: Subject;
    semester: Semester;
    bookSeries: string;
    customTopic?: string;
  }) => {
    const newExam = generateCurriculumCompliantExam(params);
    setCurrentExam(newExam);
    setExamCode('01');
    setActiveTab('paper');
  };

  // Handle AI generation via Gemini 3.8 Flash backend endpoint
  const handleGenerateAI = async (params: {
    schoolName: string;
    schoolYear: string;
    grade: Grade;
    subject: Subject;
    semester: Semester;
    bookSeries: string;
    customTopics?: string;
    readingGenre?: string;
  }) => {
    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Không thể tạo đề qua AI. Đang chuyển sang tạo chuẩn hóa.');
      }

      const generatedData = resData.data;

      // Transform AI response into our full ExamDocument
      const aiExam: ExamDocument = {
        id: `exam-ai-${Date.now()}`,
        schoolName: params.schoolName,
        schoolYear: params.schoolYear,
        title: generatedData.title || `ĐỀ KIỂM TRA ĐỊNH KỲ ${params.semester.toUpperCase()}`,
        grade: params.grade,
        subject: params.subject,
        semester: params.semester,
        bookSeries: params.bookSeries,
        durationMinutes: params.grade === 1 ? 35 : 40,
        passage: generatedData.readingPassage ? {
          title: generatedData.readingPassage.title || 'BÀI ĐỌC HIỂU',
          author: generatedData.readingPassage.author || 'Sưu tầm',
          genre: (params.readingGenre as any) || 'truyện',
          wordCount: generatedData.readingPassage.wordCount || 180,
          expectedWordRange: 'Theo chuẩn khối lớp',
          content: generatedData.readingPassage.content || '',
        } : undefined,
        matrix: generatedData.matrix || [],
        matrixSummary: generatedData.matrixSummary || {
          m1_points: 5,
          m1_percent: 50,
          m2_points: 3,
          m2_percent: 30,
          m3_points: 2,
          m3_percent: 20,
          tn_points: 6,
          tn_percent: 60,
          tl_points: 4,
          tl_percent: 40,
          total_points: 10,
        },
        specifications: generatedData.specifications ? generatedData.specifications.map((s: any, idx: number) => ({
          questionNumber: s.questionNumber || idx + 1,
          topic: s.topic || 'Nội dung kiến thức',
          level: s.level || 'Mức 1',
          formatName: s.type || 'Trắc nghiệm nhiều lựa chọn',
          points: s.points || 0.5,
          competencyRequired: s.requiredCompetency || 'Đạt chuẩn yêu cầu chương trình GDPT 2018.',
        })) : [],
        questions: generatedData.questions ? generatedData.questions.map((q: any, idx: number) => ({
          id: `q_ai_${idx}`,
          number: q.number || idx + 1,
          topic: q.topic || 'Kiến thức chung',
          level: (q.level as any) || 1,
          format: (q.format === 'multiple_choice' ? 'mcq' : q.format) || 'mcq',
          points: q.points || 0.5,
          prompt: q.rawPrompt || q.prompt || '',
          options: q.options || [],
          correctOption: q.correctOption || 'A',
          subItems: q.subItems || [],
          specification: q.specification || 'Yêu cầu cần đạt chuẩn GDPT 2018.',
          answerGuide: generatedData.answerKey?.[idx]?.explanation || 'Theo đáp án và biểu điểm chuẩn.',
        })) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCurrentExam(aiExam);
      setExamCode('01');
      setActiveTab('paper');
    } catch (err: any) {
      console.warn('AI Generation fallback:', err);
      // Fallback seamlessly to instant generator
      const fallbackExam = generateCurriculumCompliantExam(params);
      setCurrentExam(fallbackExam);
      setExamCode('01');
      setActiveTab('paper');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Export to Microsoft Word (.docx)
  const handleExportDocx = async () => {
    try {
      setDownloadingDocx(true);
      const blob = await exportExamToDocx(currentExam);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `De_Kiem_Tra_${currentExam.subject}_Lop_${currentExam.grade}_${currentExam.semester.replace(/\s+/g, '_')}.docx`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting docx:', error);
      alert('Đã xảy ra lỗi khi xuất file Word. Vui lòng thử lại!');
    } finally {
      setDownloadingDocx(false);
    }
  };

  // Shuffle multiple choice options to produce Form A / Form B (Mã đề)
  const handleShuffleOptions = () => {
    const newQuestions = currentExam.questions.map((q) => {
      if (q.options && q.options.length > 1) {
        // Clone and shuffle
        const shuffled = [...q.options].sort(() => Math.random() - 0.5);
        return {
          ...q,
          options: shuffled,
        };
      }
      return q;
    });

    const nextCode = examCode === '01' ? '02' : examCode === '02' ? '03' : '01';
    setExamCode(nextCode);
    setCurrentExam({
      ...currentExam,
      questions: newQuestions,
    });
  };

  // Update single question directly
  const handleUpdateQuestion = (idx: number, updated: QuestionItem) => {
    const updatedQuestions = [...currentExam.questions];
    updatedQuestions[idx] = updated;
    setCurrentExam({
      ...currentExam,
      questions: updatedQuestions,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Banner Navigation (Hidden in Print) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white uppercase">
                  APP TẠO ĐỀ MA TRẬN VÀ ĐỀ KIỂM TRA TIỂU HỌC
                </h1>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  GDPT 2018
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Chuẩn hóa cấu trúc Thông tư 27/2020/TT-BGDĐT • Chuyên gia Khảo thí Tiểu học
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Switch Preset */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 px-1 text-[11px] font-medium">Mẫu chuẩn:</span>
              <button
                onClick={() => {
                  setCurrentExam(STANDARD_EXAM_PRESETS[0]);
                  setActiveTab('paper');
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  currentExam.id === 'toan-4-cki' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Toán 4 CKI
              </button>
              <button
                onClick={() => {
                  setCurrentExam(STANDARD_EXAM_PRESETS[1]);
                  setActiveTab('paper');
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  currentExam.id === 'tiengviet-3-cki' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Tiếng Việt 3 CKI
              </button>
              <button
                onClick={() => {
                  setCurrentExam(STANDARD_EXAM_PRESETS[2]);
                  setActiveTab('paper');
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  currentExam.id === 'tinhoc-4-cki' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Tin học 4 CKI
              </button>
            </div>

            {/* Math Grid Drawer Trigger (for Math) */}
            {currentExam.subject === 'Toán' && (
              <button
                onClick={() => setIsGridDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                title="Vẽ hình trên lưới ô vuông Toán học"
              >
                <Grid className="w-4 h-4 text-sky-400" />
                Vẽ Lưới Ô Vuông
              </button>
            )}

            {/* Export DOCX */}
            <button
              onClick={handleExportDocx}
              disabled={downloadingDocx}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              title="Xuất file Word .docx chuẩn căn lề và font Times New Roman"
            >
              <Download className="w-4 h-4" />
              {downloadingDocx ? 'Đang xuất...' : 'Xuất File Word (.docx)'}
            </button>

            {/* Open Generator Modal */}
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              Tạo Đề Mới (AI / Chuẩn hóa)
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4 py-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('paper')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'paper'
                    ? 'border-blue-500 text-white bg-slate-800/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-400" />
                Đề Kiểm Tra Chuẩn
                <span className="text-[10px] bg-blue-900/80 text-blue-200 px-1.5 py-0.2 rounded-full">
                  Mã {examCode}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('matrix')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'matrix'
                    ? 'border-indigo-500 text-white bg-slate-800/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <TableIcon className="w-4 h-4 text-indigo-400" />
                Ma Trận Đề Kiểm Tra (2D)
              </button>

              <button
                onClick={() => setActiveTab('spec')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'spec'
                    ? 'border-emerald-500 text-white bg-slate-800/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-emerald-400" />
                Bản Đặc Tả Đề
              </button>

              <button
                onClick={() => setActiveTab('answers')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'answers'
                    ? 'border-purple-500 text-white bg-slate-800/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-purple-400" />
                Đáp Án & Hướng Dẫn Chấm
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'rules'
                    ? 'border-amber-500 text-white bg-slate-800/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                Khung Quy Định & Tỷ Lệ Bộ GD
              </button>
            </div>

            {/* Current Exam Summary Pill */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="text-white font-semibold">{currentExam.subject}</span> •{' '}
              <span>Lớp {currentExam.grade}</span> •{' '}
              <span>{currentExam.semester}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 grow">
        {activeTab === 'paper' && (
          <ExamPaperView
            exam={currentExam}
            onUpdateQuestion={handleUpdateQuestion}
            onShuffleOptions={handleShuffleOptions}
          />
        )}

        {activeTab === 'matrix' && (
          <MatrixView exam={currentExam} />
        )}

        {activeTab === 'spec' && (
          <SpecificationView exam={currentExam} />
        )}

        {activeTab === 'answers' && (
          <AnswerGuideView exam={currentExam} />
        )}

        {activeTab === 'rules' && (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6 text-sm text-slate-800">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                HƯỚNG DẪN CHUYÊN MÔN: QUY ĐỊNH RA ĐỀ & XÂY DỰNG MA TRẬN TIỂU HỌC GDPT 2018
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tổng hợp đầy đủ cấu trúc đề thi, tỷ lệ các mức độ, phân bố mạch kiến thức và quy cách trình bày theo Thông tư 27/2020/TT-BGDĐT.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Cấu trúc và trình bày đề */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-blue-600" />
                  1. Cấu trúc và thứ tự câu hỏi trong đề:
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700">
                  <li>
                    <strong>Thứ tự câu:</strong> Đánh số liên tục từ Câu 1 đến câu cuối cùng hết đề kiểm tra.
                  </li>
                  <li>
                    <strong className="text-red-700">KHÔNG GHI</strong> phân đoạn &quot;Phần trắc nghiệm&quot; hay &quot;Phần tự luận&quot; trong đề kiểm tra.
                  </li>
                  <li>
                    <strong>Sắp xếp từ Trắc nghiệm đến Tự luận:</strong>
                    <div className="pl-4 mt-1 space-y-1">
                      <div>• <em>Trắc nghiệm:</em> M1 xếp trước – M2 xếp sau. Cụ thể: Biết NLC → Biết ĐS → Biết Nối cột → Biết Điền khuyết → Hiểu NLC → Hiểu ĐS → Hiểu NC → Hiểu ĐK.</div>
                      <div>• <strong className="text-red-700">TUYỆT ĐỐI KHÔNG TẠO TRẮC NGHIỆM Ở MỨC VẬN DỤNG (M3).</strong></div>
                      <div>• <em>Tự luận:</em> Lần lượt từ Biết (M1) → Hiểu (M2) → Vận dụng (M3) để học sinh tư duy từ dễ đến khó.</div>
                      <div>• Không ghép câu thuộc 2 chủ đề/mạch kiến thức với nhau.</div>
                    </div>
                  </li>
                </ul>
              </div>

              {/* 2. Cách trình bày văn bản */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  2. Thể thức trình bày và thang điểm:
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700">
                  <li>
                    <strong>Quy cách dòng câu:</strong> Câu số (in đậm), điểm (chữ nghiêng và không đậm) liền câu số, câu hỏi (chữ không đậm).
                    <div className="mt-1 p-1.5 bg-white rounded border border-emerald-300 font-serif text-[13px]">
                      <strong>Câu 1</strong> <em>(0,5 điểm):</em> CÂU HỎI ĐỂ CHỮ KHÔNG ĐẬM
                    </div>
                  </li>
                  <li>
                    <strong>Căn lề:</strong> Câu số và các ý (a, b...) bằng lề - không tab.
                  </li>
                  <li>
                    <strong>Phương án A, B, C, D:</strong> Lùi vào 1 tab (1cm).
                  </li>
                  <li>
                    <strong>Số phương án:</strong> Lớp 1, 2, 3 gồm 3 phương án (A, B, C); Lớp 4, 5 gồm 4 phương án (A, B, C, D).
                  </li>
                  <li>
                    <strong>Thang điểm chuẩn:</strong>
                    <div>• TN nhiều lựa chọn: 0,5đ cho ý/câu.</div>
                    <div>• TN Đúng/Sai, Nối cột, Điền khuyết: 0,25đ / ý.</div>
                    <div>• Tự luận: M1: 0,5đ; M2: 1,0đ; M3: 1,0 – 2,0đ.</div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Chi tiết từng môn */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-200 pb-2">
                3. Tỷ lệ phân bổ và mạch kiến thức theo từng môn học:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Môn Toán */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-blue-800 text-sm mb-1.5">📐 MÔN TOÁN</h4>
                  <p className="mb-1"><strong>Tỉ lệ mức độ:</strong> 50% (M1) - 30% (M2) - 20% (M3).</p>
                  <p className="mb-2"><strong>Hình thức:</strong> Trắc nghiệm 60% (6đ) - Tự luận 40% (4đ).</p>
                  <div className="space-y-1 text-slate-600">
                    <div>• <strong>Lớp 1:</strong> Số & PT: 80%, Hình học & Đo lường: 20%.</div>
                    <div>• <strong>Lớp 2, 3:</strong> Kỳ I (Số: 70%, HH&ĐL: 30%); Kỳ II (Số: 70%, HH&ĐL: 20%, TK&XS: 10%).</div>
                    <div>• <strong>Lớp 4:</strong> CKI (Số: 50%, HH&ĐL: 50%); CN (Số: 70%, HH&ĐL: 20%, TK&XS: 10%).</div>
                    <div>• <strong>Lớp 5:</strong> CKI (Số: 60%, HH&ĐL: 40%); GKII & CN (Số: 50%, HH&ĐL: 40-50%, TK&XS: 10%).</div>
                    <div className="text-amber-800 font-medium mt-1">• <em>Lưu ý: Vẽ hình trên lưới ô vuông (Lớp 1 - 5).</em></div>
                  </div>
                </div>

                {/* Môn Tiếng Việt */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-indigo-800 text-sm mb-1.5">📖 MÔN TIẾNG VIỆT</h4>
                  <p className="mb-1"><strong>Đọc hiểu văn bản ngoài chương trình:</strong></p>
                  <div className="space-y-1 text-slate-600 mb-2">
                    <div>• <strong>Lớp 1:</strong> Đọc TT 6đ, Đọc hiểu 4đ (TN 6 câu = 3đ; TL 1 câu = 1đ). Truyện 90-130 chữ, thơ 50-70 chữ. Viết 10đ (Nghe viết 6đ + 4 bài tập 4đ).</div>
                    <div>• <strong>Lớp 2, 3:</strong> Đọc TT 4đ, Đọc hiểu 6đ (9 câu: Đọc hiểu 4đ, KTTV 2đ). Viết 10đ (Nghe viết 4đ + Đoạn 6đ). Truyện L2 (180-200 chữ), L3 (200-250 chữ).</div>
                    <div>• <strong>Lớp 4, 5:</strong> Đọc TT 3đ, Đọc hiểu 7đ (11 câu: Đọc hiểu 4đ, KTTV 3đ). Viết đoạn/bài 10đ. Truyện L4 (280-330 chữ), L5 (300-350 chữ).</div>
                  </div>
                </div>

                {/* Môn Tin học, Lịch sử, Khoa học, Công nghệ */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-emerald-800 text-sm mb-1.5">💻 TIN HỌC & MÔN KHÁC</h4>
                  <p className="mb-1"><strong>Môn Tin học:</strong></p>
                  <div className="space-y-1 text-slate-600 mb-2">
                    <div>• <strong>Lớp 3:</strong> LT 7đ (TN 6 câu = 3đ, TL 4đ) - TH 3đ (CN: 1 bài).</div>
                    <div>• <strong>Lớp 4:</strong> LT 6đ (TN 6 câu = 3đ, TL 2 câu) - TH 4đ (2 bài).</div>
                    <div>• <strong>Lớp 5:</strong> LT 5đ (TN 5 câu, TL 2-3 câu) - TH 5đ (2-3 bài).</div>
                    <div>• Không tạo câu trắc nghiệm ở mức vận dụng.</div>
                  </div>
                  <p className="mb-1 mt-2"><strong>Lịch sử & Địa lý, Khoa học, Công nghệ:</strong></p>
                  <div className="text-slate-600">
                    <div>• Tỉ lệ: M1 (50%) - M2 (30%) - M3 (20%).</div>
                    <div>• Trắc nghiệm = 60%, Tự luận = 40%.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Generator Modal */}
      <ExamGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onGenerateInstant={handleGenerateInstant}
        onGenerateAI={handleGenerateAI}
        isLoadingAI={isLoadingAI}
      />

      {/* Math Grid Drawer */}
      <MathGridDrawer
        isOpen={isGridDrawerOpen}
        onClose={() => setIsGridDrawerOpen(false)}
        onApplyGrid={(grid) => {
          // Add grid to first math question or level 2 question
          const updated = [...currentExam.questions];
          const targetIndex = updated.findIndex((q) => q.topic.includes('Hình học') || q.level === 2);
          if (targetIndex >= 0) {
            updated[targetIndex] = {
              ...updated[targetIndex],
              gridVisual: grid,
            };
            setCurrentExam({ ...currentExam, questions: updated });
          } else if (updated.length > 0) {
            updated[0] = { ...updated[0], gridVisual: grid };
            setCurrentExam({ ...currentExam, questions: updated });
          }
        }}
      />
    </div>
  );
}
