import { Grade, Semester, Subject } from '../types/exam';

export interface SubjectRuleInfo {
  name: Subject;
  levelsRatio: { m1: number; m2: number; m3: number }; // %
  formatRatio: { tn: number; tl: number }; // %
  strands: {
    semester: Semester;
    distribution: { name: string; percent: number }[];
  }[];
  notes: string[];
}

// Lấy thông tin cấu trúc mạch kiến thức theo từng khối lớp và kỳ thi
export function getCurriculumStrands(
  subject: Subject,
  grade: Grade,
  semester: Semester
): { name: string; percent: number }[] {
  if (subject === 'Toán') {
    if (grade === 1) {
      return [
        { name: 'Số và phép tính', percent: 80 },
        { name: 'Hình học và Đo lường', percent: 20 },
      ];
    }
    if (grade === 2 || grade === 3) {
      if (semester === 'Giữa Học kỳ I' || semester === 'Cuối Học kỳ I') {
        return [
          { name: 'Số và phép tính', percent: 70 },
          { name: 'Hình học và Đo lường', percent: 30 },
        ];
      }
      return [
        { name: 'Số và phép tính', percent: 70 },
        { name: 'Hình học và Đo lường', percent: 20 },
        { name: 'Yếu tố Thống kê và Xác suất', percent: 10 },
      ];
    }
    if (grade === 4) {
      if (semester === 'Giữa Học kỳ I') {
        return [
          { name: 'Số và phép tính', percent: 70 },
          { name: 'Hình học và Đo lường', percent: 30 },
        ];
      }
      if (semester === 'Cuối Học kỳ I') {
        return [
          { name: 'Số và phép tính', percent: 50 },
          { name: 'Hình học và Đo lường', percent: 50 },
        ];
      }
      if (semester === 'Giữa Học kỳ II') {
        return [
          { name: 'Số và phép tính', percent: 70 },
          { name: 'Hình học và Đo lường', percent: 30 },
        ];
      }
      // Cuối Năm
      return [
        { name: 'Số và phép tính', percent: 70 },
        { name: 'Hình học và Đo lường', percent: 20 },
        { name: 'Yếu tố Thống kê và Xác suất', percent: 10 },
      ];
    }
    if (grade === 5) {
      if (semester === 'Giữa Học kỳ I') {
        return [
          { name: 'Số và phép tính', percent: 80 },
          { name: 'Hình học và Đo lường', percent: 20 },
        ];
      }
      if (semester === 'Cuối Học kỳ I') {
        return [
          { name: 'Số và phép tính', percent: 60 },
          { name: 'Hình học và Đo lường', percent: 40 },
        ];
      }
      if (semester === 'Giữa Học kỳ II') {
        return [
          { name: 'Số và phép tính', percent: 50 },
          { name: 'Hình học và Đo lường', percent: 50 },
        ];
      }
      // Cuối Năm
      return [
        { name: 'Số và phép tính', percent: 50 },
        { name: 'Hình học và Đo lường', percent: 40 },
        { name: 'Yếu tố Thống kê và Xác suất', percent: 10 },
      ];
    }
  }

  if (subject === 'Tiếng Việt') {
    if (grade === 1) {
      return [
        { name: 'Đọc hiểu văn bản (Vần, từ, câu)', percent: 75 },
        { name: 'Bài tập vận dụng', percent: 25 },
      ];
    }
    if (grade === 2 || grade === 3) {
      return [
        { name: 'Đọc hiểu văn bản', percent: 67 }, // 4/6 điểm
        { name: 'Kiến thức Tiếng Việt', percent: 33 }, // 2/6 điểm
      ];
    }
    // Lớp 4, 5
    return [
      { name: 'Đọc hiểu văn bản', percent: 57 }, // 4/7 điểm
      { name: 'Kiến thức Tiếng Việt', percent: 43 }, // 3/7 điểm
    ];
  }

  if (subject === 'Tin học') {
    if (grade === 3) {
      return [
        { name: 'Máy tính và em (Lí thuyết)', percent: 70 },
        { name: 'Ứng dụng Tin học & Thực hành', percent: 30 },
      ];
    }
    if (grade === 4) {
      return [
        { name: 'Lí thuyết Tin học', percent: 60 },
        { name: 'Thực hành kỹ năng Tin học', percent: 40 },
      ];
    }
    return [
      { name: 'Lí thuyết Tin học', percent: 50 },
      { name: 'Thực hành kỹ năng Tin học', percent: 50 },
    ];
  }

  if (subject === 'Lịch sử và Địa lý') {
    return [
      { name: 'Mạch kiến thức Lịch sử', percent: 50 },
      { name: 'Mạch kiến thức Địa lý', percent: 50 },
    ];
  }

  if (subject === 'Khoa học') {
    return [
      { name: 'Chất và Năng lượng / Sinh vật và Môi trường', percent: 60 },
      { name: 'Con người và Sức khỏe / Trái đất và Bầu trời', percent: 40 },
    ];
  }

  if (subject === 'Công nghệ') {
    return [
      { name: 'Công nghệ và đời sống', percent: 50 },
      { name: 'Thủ công kĩ thuật & Thiết kế', percent: 50 },
    ];
  }

  return [{ name: 'Nội dung kiến thức trọng tâm', percent: 100 }];
}

// Giới hạn số chữ chuẩn văn bản đọc ngoài chương trình môn Tiếng Việt
export function getReadingPassageWordRange(grade: Grade, genre: 'truyện' | 'thơ' | 'miêu tả' | 'thông tin'): { min: number; max: number; desc: string } {
  if (grade === 1) {
    if (genre === 'thơ') return { min: 50, max: 70, desc: 'Khoảng 50 – 70 chữ' };
    return { min: 90, max: 130, desc: 'Khoảng 90 – 130 chữ (truyện/đoạn văn miêu tả)' };
  }
  if (grade === 2) {
    if (genre === 'truyện') return { min: 180, max: 200, desc: 'Khoảng 180 – 200 chữ' };
    if (genre === 'miêu tả') return { min: 150, max: 180, desc: 'Khoảng 150 – 180 chữ' };
    if (genre === 'thơ') return { min: 70, max: 90, desc: 'Khoảng 70 – 90 chữ' };
    return { min: 110, max: 140, desc: 'Khoảng 110 – 140 chữ (văn bản thông tin)' };
  }
  if (grade === 3) {
    if (genre === 'truyện') return { min: 200, max: 250, desc: 'Khoảng 200 – 250 chữ' };
    if (genre === 'miêu tả') return { min: 180, max: 200, desc: 'Khoảng 180 – 200 chữ' };
    if (genre === 'thơ') return { min: 80, max: 100, desc: 'Khoảng 80 – 100 chữ' };
    return { min: 120, max: 150, desc: 'Khoảng 120 – 150 chữ (văn bản thông tin)' };
  }
  if (grade === 4) {
    if (genre === 'truyện') return { min: 280, max: 330, desc: 'Khoảng 280 – 330 chữ (truyện, kịch bản)' };
    if (genre === 'miêu tả') return { min: 200, max: 250, desc: 'Khoảng 200 – 250 chữ' };
    if (genre === 'thơ') return { min: 100, max: 120, desc: 'Khoảng 100 – 120 chữ' };
    return { min: 150, max: 180, desc: 'Khoảng 150 – 180 chữ (văn bản thông tin)' };
  }
  // Grade 5
  if (genre === 'truyện') return { min: 300, max: 350, desc: 'Khoảng 300 – 350 chữ (truyện, kịch bản)' };
  if (genre === 'miêu tả') return { min: 200, max: 250, desc: 'Khoảng 200 – 250 chữ' };
  if (genre === 'thơ') return { min: 110, max: 130, desc: 'Khoảng 110 – 130 chữ' };
  return { min: 210, max: 240, desc: 'Khoảng 230 chữ (văn bản thông tin)' };
}

// Quy chuẩn câu hỏi sắp xếp theo thứ tự nghiêm ngặt của đề thi
// 1. Trắc nghiệm Biết (M1) xếp trước: NLC -> ĐS -> Nối cột -> Điền khuyết
// 2. Trắc nghiệm Hiểu (M2) xếp sau: NLC -> ĐS -> Nối cột -> Điền khuyết
// (TUYỆT ĐỐI KHÔNG CÓ TRẮC NGHIỆM MỨC 3)
// 3. Tự luận: Lần lượt M1 (Biết) -> M2 (Hiểu) -> M3 (Vận dụng)
export function sortExamQuestions<T extends { level: number; format: string; topic?: string }>(questions: T[]): T[] {
  const getFormatOrder = (format: string): number => {
    switch (format) {
      case 'mcq': return 1;
      case 'true_false': return 2;
      case 'matching': return 3;
      case 'fill_blank': return 4;
      case 'essay': return 5;
      case 'practice': return 6;
      default: return 99;
    }
  };

  const isTN = (format: string) => ['mcq', 'true_false', 'matching', 'fill_blank'].includes(format);

  return [...questions].sort((a, b) => {
    const aIsTN = isTN(a.format);
    const bIsTN = isTN(b.format);

    // Trắc nghiệm luôn xếp trước Tự luận
    if (aIsTN && !bIsTN) return -1;
    if (!aIsTN && bIsTN) return 1;

    if (aIsTN && bIsTN) {
      // Trong Trắc nghiệm: Mức 1 xếp trước, Mức 2 xếp sau
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      // Cùng mức: NLC (1) -> ĐS (2) -> Nối cột (3) -> Điền khuyết (4)
      return getFormatOrder(a.format) - getFormatOrder(b.format);
    }

    // Trong Tự luận: Lần lượt Mức 1 -> Mức 2 -> Mức 3 (dễ đến khó)
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    return getFormatOrder(a.format) - getFormatOrder(b.format);
  });
}
