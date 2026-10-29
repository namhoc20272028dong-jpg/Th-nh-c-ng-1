export type Subject =
  | 'Toán'
  | 'Tiếng Việt'
  | 'Tin học'
  | 'Lịch sử và Địa lý'
  | 'Khoa học'
  | 'Công nghệ';

export type Grade = 1 | 2 | 3 | 4 | 5;

export type Semester =
  | 'Giữa Học kỳ I'
  | 'Cuối Học kỳ I'
  | 'Giữa Học kỳ II'
  | 'Cuối Năm';

export type CognitiveLevel = 1 | 2 | 3; // 1: Biết, 2: Hiểu, 3: Vận dụng

export type QuestionTypeFormat =
  | 'mcq'          // Trắc nghiệm nhiều lựa chọn
  | 'true_false'   // Trắc nghiệm đúng sai
  | 'matching'     // Trắc nghiệm nối cột
  | 'fill_blank'   // Trắc nghiệm điền khuyết
  | 'essay'        // Tự luận
  | 'practice';    // Thực hành máy tính (Tin học)

export interface SubItem {
  id: string;
  label: string; // e.g. "a", "b", "c", "d"
  statement: string;
  correctAnswer?: string | boolean;
}

export interface MatchingPair {
  leftNumber: string;
  leftText: string;
  rightLetter: string;
  rightText: string;
}

export interface GridVisual {
  rows: number;
  cols: number;
  cellSize?: number;
  shapes?: {
    type: 'rect' | 'triangle' | 'polygon' | 'grid_count';
    startRow?: number;
    startCol?: number;
    endRow?: number;
    endCol?: number;
    fillColor?: string;
    label?: string;
  }[];
}

export interface QuestionItem {
  id: string;
  number: number;               // 1, 2, 3 ...
  topic: string;                // Mạch kiến thức/chủ đề
  level: CognitiveLevel;        // 1, 2, 3
  format: QuestionTypeFormat;   // 'mcq' | 'true_false' | 'matching' | 'fill_blank' | 'essay' | 'practice'
  points: number;               // 0.5, 0.25, 1.0, 2.0
  prompt: string;               // Text câu hỏi (không in đậm)
  options?: string[];           // A, B, C (Lớp 1-3) hoặc A, B, C, D (Lớp 4-5)
  correctOption?: string;       // "A", "B", "C", "D"
  subItems?: SubItem[];         // Cho dạng đúng sai hoặc các ý a, b
  matchingPairs?: MatchingPair[]; // Cho dạng nối cột
  blanksPrompt?: string;        // Text cho điền khuyết
  gridVisual?: GridVisual;      // Hình lưới ô vuông nếu có (môn Toán)
  specification: string;        // Yêu cầu cần đạt chi tiết của câu này
  answerGuide: string;          // Lời giải và thang điểm chi tiết
}

export interface ExamMatrixRow {
  topic: string;
  // Mức 1 (Biết)
  m1_tn_count: number;
  m1_tn_points: number;
  m1_tl_count: number;
  m1_tl_points: number;
  // Mức 2 (Hiểu)
  m2_tn_count: number;
  m2_tn_points: number;
  m2_tl_count: number;
  m2_tl_points: number;
  // Mức 3 (Vận dụng) - Không có TN!
  m3_tn_count: number;
  m3_tn_points: number;
  m3_tl_count: number;
  m3_tl_points: number;
  // Tổng cộng mạch
  total_questions: number;
  total_points: number;
  percentage: number;
}

export interface MatrixSummary {
  m1_points: number;
  m1_percent: number;
  m2_points: number;
  m2_percent: number;
  m3_points: number;
  m3_percent: number;
  tn_points: number;
  tn_percent: number;
  tl_points: number;
  tl_percent: number;
  total_points: number;
}

export interface SpecificationItem {
  questionNumber: number;
  topic: string;
  level: string; // "Mức 1", "Mức 2", "Mức 3"
  formatName: string; // "Trắc nghiệm nhiều lựa chọn", "Tự luận", v.v.
  points: number;
  competencyRequired: string; // Yêu cầu cần đạt chuẩn GDPT 2018
}

export interface ReadingPassage {
  title: string;
  author: string;
  genre: 'truyện' | 'thơ' | 'miêu tả' | 'thông tin';
  wordCount: number;
  expectedWordRange: string;
  content: string;
}

export interface VietnameseLanguageExamSections {
  oralReading: {
    points: number; // e.g. Lớp 1: 6đ; Lớp 2-3: 4đ; Lớp 4-5: 3đ
    description: string;
  };
  writtenExam: {
    points: number; // e.g. Lớp 1: 10đ (nghe viết 6đ + BT 4đ); Lớp 2-3: 10đ (nghe viết 4đ + đoạn 6đ); Lớp 4-5: 10đ (đoạn/bài văn 10đ)
    description: string;
  };
}

export interface ExamDocument {
  id: string;
  schoolName: string;
  schoolYear: string;
  title: string;
  grade: Grade;
  subject: Subject;
  semester: Semester;
  bookSeries: string;
  durationMinutes: number;
  passage?: ReadingPassage;
  tvSections?: VietnameseLanguageExamSections;
  matrix: ExamMatrixRow[];
  matrixSummary: MatrixSummary;
  specifications: SpecificationItem[];
  questions: QuestionItem[];
  createdAt: string;
  updatedAt: string;
}
