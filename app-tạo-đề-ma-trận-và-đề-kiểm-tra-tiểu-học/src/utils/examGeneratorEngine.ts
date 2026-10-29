import {
  CognitiveLevel,
  ExamDocument,
  ExamMatrixRow,
  Grade,
  QuestionItem,
  QuestionTypeFormat,
  Semester,
  SpecificationItem,
  Subject,
} from '../types/exam';
import { getCurriculumStrands, getReadingPassageWordRange, sortExamQuestions } from './curriculumRules';

// Function to generate a deterministic standard-compliant exam when offline or as instant template
export function generateCurriculumCompliantExam(params: {
  schoolName: string;
  schoolYear: string;
  grade: Grade;
  subject: Subject;
  semester: Semester;
  bookSeries: string;
  customTopic?: string;
}): ExamDocument {
  const { schoolName, schoolYear, grade, subject, semester, bookSeries, customTopic } = params;

  const strands = getCurriculumStrands(subject, grade, semester);
  const isLowerPrimary = grade <= 3; // Lớp 1, 2, 3 có 3 lựa chọn A, B, C
  const optionCount = isLowerPrimary ? 3 : 4;

  let questions: QuestionItem[] = [];
  let matrix: ExamMatrixRow[] = [];
  let specifications: SpecificationItem[] = [];

  // Duration
  const durationMinutes = grade === 1 ? 35 : 40;

  // Let's create questions based on subject & grade rules
  if (subject === 'Toán') {
    questions = buildMathQuestions(grade, semester, optionCount, strands);
  } else if (subject === 'Tiếng Việt') {
    questions = buildVietnameseQuestions(grade, semester, optionCount, strands);
  } else if (subject === 'Tin học') {
    questions = buildInformaticsQuestions(grade, semester, optionCount, strands);
  } else if (subject === 'Lịch sử và Địa lý') {
    questions = buildHistoryGeographyQuestions(grade, semester, optionCount, strands);
  } else if (subject === 'Khoa học') {
    questions = buildScienceQuestions(grade, semester, optionCount, strands);
  } else {
    // Công nghệ
    questions = buildTechnologyQuestions(grade, semester, optionCount, strands);
  }

  // Strictly sort questions:
  // TN M1 (mcq -> tf -> matching -> fill) -> TN M2 (mcq -> tf -> matching -> fill) -> TL M1 -> TL M2 -> TL M3
  const sortedQuestions = sortExamQuestions(questions);

  // Re-number sequentially from 1 to N
  sortedQuestions.forEach((q, idx) => {
    q.number = idx + 1;
  });

  // Build specifications: 1 question = 1 specification item
  specifications = sortedQuestions.map((q) => {
    let formatLabel = 'Tự luận';
    if (q.format === 'mcq') formatLabel = 'Trắc nghiệm nhiều lựa chọn';
    else if (q.format === 'true_false') formatLabel = 'Trắc nghiệm đúng sai';
    else if (q.format === 'matching') formatLabel = 'Trắc nghiệm nối cột';
    else if (q.format === 'fill_blank') formatLabel = 'Trắc nghiệm điền khuyết';
    else if (q.format === 'practice') formatLabel = 'Thực hành máy tính';

    return {
      questionNumber: q.number,
      topic: q.topic,
      level: `Mức ${q.level}`,
      formatName: formatLabel,
      points: q.points,
      competencyRequired: q.specification,
    };
  });

  // Build matrix rows based on strands
  matrix = strands.map((strand) => {
    const strandQuestions = sortedQuestions.filter((q) => q.topic.toLowerCase().includes(strand.name.toLowerCase()) || strand.name.toLowerCase().includes(q.topic.toLowerCase()));

    const m1_tn = strandQuestions.filter((q) => q.level === 1 && isTN(q.format));
    const m1_tl = strandQuestions.filter((q) => q.level === 1 && !isTN(q.format));

    const m2_tn = strandQuestions.filter((q) => q.level === 2 && isTN(q.format));
    const m2_tl = strandQuestions.filter((q) => q.level === 2 && !isTN(q.format));

    const m3_tn = strandQuestions.filter((q) => q.level === 3 && isTN(q.format)); // Must be 0
    const m3_tl = strandQuestions.filter((q) => q.level === 3 && !isTN(q.format));

    const totalPts = strandQuestions.reduce((acc, q) => acc + q.points, 0);

    return {
      topic: strand.name,
      m1_tn_count: m1_tn.length,
      m1_tn_points: m1_tn.reduce((acc, q) => acc + q.points, 0),
      m1_tl_count: m1_tl.length,
      m1_tl_points: m1_tl.reduce((acc, q) => acc + q.points, 0),

      m2_tn_count: m2_tn.length,
      m2_tn_points: m2_tn.reduce((acc, q) => acc + q.points, 0),
      m2_tl_count: m2_tl.length,
      m2_tl_points: m2_tl.reduce((acc, q) => acc + q.points, 0),

      m3_tn_count: m3_tn.length,
      m3_tn_points: 0,
      m3_tl_count: m3_tl.length,
      m3_tl_points: m3_tl.reduce((acc, q) => acc + q.points, 0),

      total_questions: strandQuestions.length,
      total_points: Math.round(totalPts * 10) / 10,
      percentage: strand.percent,
    };
  });

  // Calculate matrix summary
  let m1_pts = 0;
  let m2_pts = 0;
  let m3_pts = 0;
  let tn_pts = 0;
  let tl_pts = 0;

  sortedQuestions.forEach((q) => {
    if (q.level === 1) m1_pts += q.points;
    if (q.level === 2) m2_pts += q.points;
    if (q.level === 3) m3_pts += q.points;

    if (isTN(q.format)) tn_pts += q.points;
    else tl_pts += q.points;
  });

  const totalPoints = Math.round((m1_pts + m2_pts + m3_pts) * 10) / 10;

  const matrixSummary = {
    m1_points: Math.round(m1_pts * 10) / 10,
    m1_percent: Math.round((m1_pts / totalPoints) * 100),
    m2_points: Math.round(m2_pts * 10) / 10,
    m2_percent: Math.round((m2_pts / totalPoints) * 100),
    m3_points: Math.round(m3_pts * 10) / 10,
    m3_percent: Math.round((m3_pts / totalPoints) * 100),
    tn_points: Math.round(tn_pts * 10) / 10,
    tn_percent: Math.round((tn_pts / totalPoints) * 100),
    tl_points: Math.round(tl_pts * 10) / 10,
    tl_percent: Math.round((tl_pts / totalPoints) * 100),
    total_points: totalPoints,
  };

  // Optional passage for Tiếng Việt
  let passage = undefined;
  let tvSections = undefined;
  if (subject === 'Tiếng Việt') {
    const range = getReadingPassageWordRange(grade, 'truyện');
    passage = {
      title: 'BÔNG HOA CÚC TRẮNG VÀ BÀI HỌC VỀ LÒNG BIẾT ƠN',
      author: 'Truyện cổ tích cải biên',
      genre: 'truyện' as const,
      wordCount: grade === 1 ? 110 : grade === 2 ? 190 : grade === 3 ? 225 : grade === 4 ? 310 : 335,
      expectedWordRange: range.desc,
      content: getSamplePassageText(grade),
    };

    tvSections = {
      oralReading: {
        points: grade === 1 ? 6.0 : grade <= 3 ? 4.0 : 3.0,
        description: `Đọc thành tiếng (${grade === 1 ? '6,0' : grade <= 3 ? '4,0' : '3,0'} điểm): Học sinh bốc thăm đọc một đoạn văn/bài thơ ngoài chương trình và trả lời câu hỏi tìm hiểu bài.`,
      },
      writtenExam: {
        points: 10.0,
        description: grade === 1
          ? 'Phần Viết: Nghe viết chính tả (6,0 điểm) và 4 bài tập chính tả/ngữ âm (4,0 điểm).'
          : grade <= 3
          ? 'Phần Viết: Nghe viết chính tả (4,0 điểm) và Viết đoạn văn ngắn 3-4 câu (6,0 điểm).'
          : 'Phần Viết: Viết đoạn văn/bài văn hoàn chỉnh theo chủ đề đã học (10,0 điểm).',
      },
    };
  }

  const titleSemester = semester.toUpperCase();

  return {
    id: `exam-${Date.now()}`,
    schoolName: schoolName || 'TRƯỜNG TIỂU HỌC NGUYỄN TRÃI',
    schoolYear: schoolYear || 'NĂM HỌC 2025 - 2026',
    title: `ĐỀ KIỂM TRA ĐỊNH KỲ ${titleSemester}`,
    grade,
    subject,
    semester,
    bookSeries: bookSeries || 'Chương trình GDPT 2018',
    durationMinutes,
    passage,
    tvSections,
    matrix,
    matrixSummary,
    specifications,
    questions: sortedQuestions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function isTN(format: QuestionTypeFormat): boolean {
  return ['mcq', 'true_false', 'matching', 'fill_blank'].includes(format);
}

// Build standard Math questions matching GDPT 2018
function buildMathQuestions(grade: Grade, semester: Semester, optionCount: number, strands: { name: string; percent: number }[]): QuestionItem[] {
  const qList: QuestionItem[] = [];
  const strand1 = strands[0]?.name || 'Số và phép tính';
  const strand2 = strands[1]?.name || 'Hình học và Đo lường';
  const strand3 = strands[2]?.name || 'Yếu tố Thống kê và Xác suất';

  // Lớp 1
  if (grade === 1) {
    // TN M1
    qList.push({
      id: 'm1_1',
      number: 0,
      topic: strand1,
      level: 1,
      format: 'mcq',
      points: 0.5,
      prompt: 'Số gồm 1 chục và 5 đơn vị là số nào?',
      options: ['15', '51', '10'].slice(0, optionCount),
      correctOption: 'A',
      specification: 'Nhận biết cấu tạo số có hai chữ số trong phạm vi 100.',
      answerGuide: 'Đáp án: A (15). Cho 0,5 điểm.',
    });
    qList.push({
      id: 'm1_2',
      number: 0,
      topic: strand1,
      level: 1,
      format: 'mcq',
      points: 0.5,
      prompt: 'Kết quả của phép tính 14 + 3 là:',
      options: ['17', '18', '16'].slice(0, optionCount),
      correctOption: 'A',
      specification: 'Nhận biết và thực hiện cộng không nhớ trong phạm vi 20.',
      answerGuide: 'Đáp án: A (17). Cho 0,5 điểm.',
    });
    qList.push({
      id: 'm1_3',
      number: 0,
      topic: strand2,
      level: 1,
      format: 'mcq',
      points: 0.5,
      prompt: 'Hình nào dưới đây là hình tam giác?',
      options: ['Hình tam giác', 'Hình vuông', 'Hình tròn'].slice(0, optionCount),
      correctOption: 'A',
      specification: 'Nhận biết các hình phẳng cơ bản: hình vuông, hình tròn, hình tam giác.',
      answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
    });
    qList.push({
      id: 'm1_4',
      number: 0,
      topic: strand1,
      level: 1,
      format: 'true_false',
      points: 0.5,
      prompt: 'Đúng ghi Đ, sai ghi S vào ô trống:',
      subItems: [
        { id: '1a', label: 'a', statement: 'Số 20 đọc là hai mươi.', correctAnswer: true },
        { id: '1b', label: 'b', statement: '15 bé hơn 12.', correctAnswer: false },
      ],
      specification: 'Nhận biết cách đọc số và so sánh các số trong phạm vi 20.',
      answerGuide: 'Ý a ghi Đ (0,25 điểm); Ý b ghi S (0,25 điểm).',
    });
    qList.push({
      id: 'm1_5',
      number: 0,
      topic: strand1,
      level: 1,
      format: 'matching',
      points: 0.5,
      prompt: 'Nối phép tính với kết quả thích hợp:',
      matchingPairs: [
        { leftNumber: '1', leftText: '10 + 6', rightLetter: 'A', rightText: '16' },
        { leftNumber: '2', leftText: '19 - 5', rightLetter: 'B', rightText: '14' },
      ],
      specification: 'Nhận biết và ghép nối phép tính với kết quả tương ứng.',
      answerGuide: 'Nối 1 - A (0,25 điểm); 2 - B (0,25 điểm).',
    });
    qList.push({
      id: 'm1_6',
      number: 0,
      topic: strand2,
      level: 1,
      format: 'fill_blank',
      points: 0.5,
      prompt: 'Điền số đo thích hợp vào chỗ chấm:',
      blanksPrompt: 'Bút chì dài ....... cm.',
      specification: 'Đọc số đo độ dài theo đơn vị xăng-ti-mét trên thước đo kẻ vạch.',
      answerGuide: 'Điền đúng số đo (ví dụ: 12 cm). Cho 0,5 điểm.',
    });

    // TN M2
    qList.push({
      id: 'm1_7',
      number: 0,
      topic: strand1,
      level: 2,
      format: 'mcq',
      points: 0.5,
      prompt: 'Số thích hợp điền vào ô trống trong phép tính 18 - ⬚ = 10 là:',
      options: ['8', '7', '9'].slice(0, optionCount),
      correctOption: 'A',
      specification: 'Hiểu mối quan hệ giữa phép cộng và phép trừ để tìm thành phần chưa biết.',
      answerGuide: 'Đáp án: A (8). Cho 0,5 điểm.',
    });
    qList.push({
      id: 'm1_8',
      number: 0,
      topic: strand2,
      level: 2,
      format: 'mcq',
      points: 0.5,
      prompt: 'Quan sát hình vẽ trên lưới ô vuông, hình bên gồm có bao nhiêu hình vuông nhỏ?',
      options: ['6 hình vuông', '5 hình vuông', '8 hình vuông'].slice(0, optionCount),
      correctOption: 'A',
      gridVisual: {
        rows: 2,
        cols: 3,
        cellSize: 30,
        shapes: [{ type: 'grid_count', startRow: 1, startCol: 1, endRow: 2, endCol: 3, label: 'Lưới ô vuông' }],
      },
      specification: 'Hiểu và đếm số hình vuông đơn vị trên lưới ô vuông.',
      answerGuide: 'Đáp án: A (6 hình vuông). Cho 0,5 điểm.',
    });
    qList.push({
      id: 'm1_9',
      number: 0,
      topic: strand1,
      level: 2,
      format: 'true_false',
      points: 0.5,
      prompt: 'Đúng ghi Đ, sai ghi S vào ô trống:',
      subItems: [
        { id: '2a', label: 'a', statement: '13 + 5 = 19 - 1', correctAnswer: true },
        { id: '2b', label: 'b', statement: '16 - 4 = 11 + 2', correctAnswer: false },
      ],
      specification: 'Hiểu và so sánh giá trị của hai biểu thức số.',
      answerGuide: 'Ý a ghi Đ (0,25 điểm); Ý b ghi S (0,25 điểm).',
    });
    qList.push({
      id: 'm1_10',
      number: 0,
      topic: strand1,
      level: 2,
      format: 'fill_blank',
      points: 0.5,
      prompt: 'Điền số thích hợp vào chỗ chấm:',
      blanksPrompt: 'Dãy số: 10, 20, 30, ......., 50',
      specification: 'Hiểu quy luật đếm thêm 10 và điền số tròn chục.',
      answerGuide: 'Điền 40. Cho 0,5 điểm.',
    });

    // TL M1
    qList.push({
      id: 'm1_11',
      number: 0,
      topic: strand1,
      level: 1,
      format: 'essay',
      points: 0.5,
      prompt: 'Tính:\na) 12 + 6 = .......\nb) 19 - 7 = .......',
      specification: 'Nhận biết và tính nhẩm thành thạo phép cộng trừ không nhớ trong phạm vi 20.',
      answerGuide: 'a) 18 (0,25 điểm); b) 12 (0,25 điểm).',
    });

    // TL M2
    qList.push({
      id: 'm1_12',
      number: 0,
      topic: strand1,
      level: 2,
      format: 'essay',
      points: 1.0,
      prompt: 'Đặt tính rồi tính:\na) 43 + 25\nb) 78 - 34',
      specification: 'Hiểu kỹ thuật đặt tính thẳng hàng và thực hiện phép cộng trừ trong phạm vi 100.',
      answerGuide: `a) 43 + 25 = 68 (Đặt tính: 0,25đ; Kết quả: 0,25đ)
b) 78 - 34 = 44 (Đặt tính: 0,25đ; Kết quả: 0,25đ)`,
    });
    qList.push({
      id: 'm1_13',
      number: 0,
      topic: strand2,
      level: 2,
      format: 'essay',
      points: 1.0,
      prompt: 'Vẽ đoạn thẳng AB dài 7 cm trên lưới ô vuông (mỗi ô vuông có cạnh 1 cm).',
      gridVisual: {
        rows: 2,
        cols: 8,
        cellSize: 28,
      },
      specification: 'Hiểu và sử dụng thước thẳng để vẽ đoạn thẳng có độ dài cho trước trên lưới ô vuông.',
      answerGuide: 'Học sinh dùng thước vẽ đúng đoạn thẳng AB thẳng tắp, dài 7 ô vuông (7 cm), ghi tên hai đầu mút A, B. Đạt 1,0 điểm.',
    });

    // TL M3
    qList.push({
      id: 'm1_14',
      number: 0,
      topic: strand1,
      level: 3,
      format: 'essay',
      points: 1.5,
      prompt: 'Mẹ có 18 quả cam. Mẹ biếu bà 8 quả cam. Hỏi mẹ còn lại bao nhiêu quả cam?',
      specification: 'Vận dụng phép trừ để giải bài toán có lời văn một bước tính trong tình huống thực tế.',
      answerGuide: `Bài giải:
Mẹ còn lại số quả cam là: (0,5 điểm)
18 - 8 = 10 (quả) (0,5 điểm)
Đáp số: 10 quả cam. (0,5 điểm)`,
    });

    return qList;
  }

  // Grades 2 to 5 standard builder
  // We provide standard questions for any requested grade
  const optionsMCQ = (opts: string[]) => opts.slice(0, optionCount);

  // Mức 1 - Trắc nghiệm (NLC -> ĐS -> Nối cột -> Điền khuyết)
  qList.push({
    id: 'gen_q1',
    number: 0,
    topic: strand1,
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: grade === 5
      ? 'Chữ số 7 trong số thập phân 45,872 có giá trị là:'
      : grade === 3
      ? 'Số lớn nhất có ba chữ số là số nào?'
      : 'Số liền sau của số 79 là số nào?',
    options: optionsMCQ(
      grade === 5
        ? ['7/100', '7/10', '7/1000', '7']
        : grade === 3
        ? ['999', '990', '900', '1000']
        : ['80', '78', '81', '70']
    ),
    correctOption: 'A',
    specification: 'Nhận biết vị trí hàng và giá trị của chữ số trong hệ thập phân.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'gen_q2',
    number: 0,
    topic: strand1,
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: grade === 5
      ? 'Phân số 3/5 được viết dưới dạng số thập phân là:'
      : grade === 3
      ? 'Kết quả của phép nhân 12 × 4 là:'
      : 'Tổng của 35 và 24 là:',
    options: optionsMCQ(
      grade === 5
        ? ['0,6', '0,35', '0,53', '0,75']
        : grade === 3
        ? ['48', '46', '50', '44']
        : ['59', '69', '58', '60']
    ),
    correctOption: 'A',
    specification: 'Nhận biết quy tắc chuyển đổi phân số thập phân hoặc tính nhẩm phép cộng nhân cơ bản.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'gen_q3',
    number: 0,
    topic: strand2,
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: grade === 5
      ? 'Hình lập phương là hình có bao nhiêu mặt là các hình vuông bằng nhau?'
      : grade === 3
      ? 'Một hình vuông có cạnh dài 5 cm. Chu vi của hình vuông đó là:'
      : 'Độ dài 1 dm bằng bao nhiêu cm?',
    options: optionsMCQ(
      grade === 5
        ? ['6 mặt', '8 mặt', '12 mặt', '4 mặt']
        : grade === 3
        ? ['20 cm', '25 cm', '15 cm', '10 cm']
        : ['10 cm', '1 cm', '100 cm', '20 cm']
    ),
    correctOption: 'A',
    specification: 'Nhận biết đặc điểm các hình khối phẳng hoặc đơn vị đo độ dài cơ bản.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'gen_q4',
    number: 0,
    topic: strand1,
    level: 1,
    format: 'true_false',
    points: 0.5,
    prompt: 'Đúng ghi Đ, sai ghi S vào ô trống:',
    subItems: [
      { id: 'tf1', label: 'a', statement: grade === 5 ? 'Muốn nhân một số thập phân với 10 ta chuyển dấu phẩy sang bên phải một chữ số.' : 'Muốn tìm số hạng chưa biết ta lấy tổng trừ đi số hạng kia.', correctAnswer: true },
      { id: 'tf2', label: 'b', statement: grade === 5 ? '0,5 lớn hơn 0,50.' : 'Số 0 nhân với bất kỳ số nào cũng bằng 1.', correctAnswer: false },
    ],
    specification: 'Nhận biết các quy tắc tính toán và tính chất cơ bản của các phép tính.',
    answerGuide: 'Ý a ghi Đ (0,25 điểm); Ý b ghi S (0,25 điểm).',
  });

  qList.push({
    id: 'gen_q5',
    number: 0,
    topic: strand2,
    level: 1,
    format: 'matching',
    points: 0.5,
    prompt: 'Nối tên đơn vị hoặc hình ở cột bên trái với ký hiệu hoặc đặc điểm tương ứng ở cột bên phải:',
    matchingPairs: [
      { leftNumber: '1', leftText: grade === 5 ? '1 m³' : '1 mét', rightLetter: 'A', rightText: grade === 5 ? '1 000 dm³' : '100 cm' },
      { leftNumber: '2', leftText: grade === 5 ? '1 lít' : '1 ki-lô-gam', rightLetter: 'B', rightText: grade === 5 ? '1 dm³' : '1 000 gam' },
    ],
    specification: 'Nhận biết và ghép nối mối quan hệ giữa các đơn vị đo lường.',
    answerGuide: 'Nối 1 - A (0,25 điểm); Nối 2 - B (0,25 điểm).',
  });

  qList.push({
    id: 'gen_q6',
    number: 0,
    topic: strand1,
    level: 1,
    format: 'fill_blank',
    points: 0.5,
    prompt: 'Điền số thích hợp vào chỗ chấm:',
    blanksPrompt: grade === 5
      ? 'a) 4,25 × 10 = .......\nb) 36 : 100 = .......'
      : 'a) 24 + 16 = .......\nb) 50 - 25 = .......',
    specification: 'Điền số thích hợp vào chỗ chấm trong các phép tính cơ bản.',
    answerGuide: grade === 5 ? 'a) 42,5 (0,25đ); b) 0,36 (0,25đ).' : 'a) 40 (0,25đ); b) 25 (0,25đ).',
  });

  // Mức 2 - Trắc nghiệm (NLC -> ĐS -> Nối cột -> Điền khuyết)
  qList.push({
    id: 'gen_q7',
    number: 0,
    topic: strand1,
    level: 2,
    format: 'mcq',
    points: 0.5,
    prompt: grade === 5
      ? 'Một lớp học có 32 học sinh, trong đó có 16 bạn nữ. Tỉ số phần trăm của số học sinh nữ và số học sinh cả lớp là:'
      : 'Giá trị của biểu thức 120 - 20 × 3 là:',
    options: optionsMCQ(
      grade === 5
        ? ['50%', '40%', '60%', '25%']
        : ['60', '300', '100', '80']
    ),
    correctOption: 'A',
    specification: 'Hiểu thứ tự thực hiện phép tính hoặc cách tìm tỉ số phần trăm.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'gen_q8',
    number: 0,
    topic: strand2,
    level: 2,
    format: 'mcq',
    points: 0.5,
    prompt: grade === 5
      ? 'Một hình tam giác có độ dài đáy là 12 cm, chiều cao tương ứng là 8 cm. Diện tích của hình tam giác đó là:'
      : 'Một hình chữ nhật có chiều dài 8 cm, chiều rộng 5 cm. Diện tích hình chữ nhật đó là:',
    options: optionsMCQ(
      grade === 5
        ? ['48 cm²', '96 cm²', '20 cm²', '24 cm²']
        : ['40 cm²', '26 cm²', '13 cm²', '35 cm²']
    ),
    correctOption: 'A',
    specification: 'Hiểu và áp dụng công thức tính diện tích hình phẳng.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'gen_q9',
    number: 0,
    topic: strand1,
    level: 2,
    format: 'true_false',
    points: 0.5,
    prompt: 'Đúng ghi Đ, sai ghi S vào ô trống:',
    subItems: [
      { id: 'tf3', label: 'a', statement: grade === 5 ? '25% của 200 kg là 50 kg.' : 'Chu vi hình vuông cạnh 4 cm bằng diện tích hình vuông cạnh 4 cm.', correctAnswer: true },
      { id: 'tf4', label: 'b', statement: grade === 5 ? '1 m³ = 100 lít.' : 'Thương của hai số luôn bé hơn số bị chia.', correctAnswer: false },
    ],
    specification: 'Hiểu ý nghĩa tỉ số phần trăm và mối quan hệ giữa các đại lượng.',
    answerGuide: 'Ý a ghi Đ (0,25 điểm); Ý b ghi S (0,25 điểm).',
  });

  qList.push({
    id: 'gen_q10',
    number: 0,
    topic: strand2,
    level: 2,
    format: 'fill_blank',
    points: 0.5,
    prompt: 'Quan sát hình vẽ trên lưới ô vuông (mỗi ô vuông cạnh 1 cm), tính diện tích phần đã tô đậm:',
    blanksPrompt: 'Diện tích hình chữ nhật trên lưới ô vuông là ....... cm².',
    gridVisual: {
      rows: 4,
      cols: 6,
      cellSize: 26,
      shapes: [
        { type: 'rect', startRow: 1, startCol: 1, endRow: 3, endCol: 5, fillColor: 'rgba(59, 130, 246, 0.25)', label: 'S' },
      ],
    },
    specification: 'Đọc diện tích hình vẽ trên lưới ô vuông đơn vị xăng-ti-mét vuông.',
    answerGuide: 'Diện tích: 15 cm². Điền 15 (0,5 điểm).',
  });

  if (strand3 && strands.length >= 3) {
    qList.push({
      id: 'gen_q10b',
      number: 0,
      topic: strand3,
      level: 2,
      format: 'mcq',
      points: 0.5,
      prompt: 'Dựa vào bảng số liệu thống kê số cây trồng của 4 tổ (Tổ 1: 15 cây, Tổ 2: 20 cây, Tổ 3: 18 cây, Tổ 4: 22 cây). Tổ trồng được nhiều cây nhất là:',
      options: optionsMCQ(['Tổ 4', 'Tổ 2', 'Tổ 3', 'Tổ 1']),
      correctOption: 'A',
      specification: 'Hiểu và đọc số liệu từ bảng thống kê đơn giản.',
      answerGuide: 'Đáp án: A (Tổ 4). Cho 0,5 điểm.',
    });
  }

  // Tự luận M1 (Biết)
  qList.push({
    id: 'gen_q11',
    number: 0,
    topic: strand1,
    level: 1,
    format: 'essay',
    points: 0.5,
    prompt: grade === 5
      ? 'Tìm x biết:\nx - 4,5 = 12,3'
      : 'Tính giá trị biểu thức:\n150 + 50 : 2',
    specification: 'Nhận biết cách tìm thành phần chưa biết hoặc thứ tự tính giá trị biểu thức.',
    answerGuide: grade === 5 ? 'x = 12,3 + 4,5 = 16,8. Cho 0,5 điểm.' : '150 + 25 = 175. Cho 0,5 điểm.',
  });

  // Tự luận M2 (Hiểu)
  qList.push({
    id: 'gen_q12',
    number: 0,
    topic: strand1,
    level: 2,
    format: 'essay',
    points: 1.0,
    prompt: grade === 5
      ? 'Đặt tính rồi tính:\na) 48,25 + 23,89\nb) 85,5 - 34,75'
      : 'Đặt tính rồi tính:\na) 1 425 × 6\nb) 2 480 : 4',
    specification: 'Hiểu kỹ thuật thực hiện tính toán phép tính cơ bản có lời giải chi tiết.',
    answerGuide: 'Đặt tính đúng và tính kết quả đúng mỗi ý được 0,5 điểm. Tổng 1,0 điểm.',
  });

  qList.push({
    id: 'gen_q13',
    number: 0,
    topic: strand2,
    level: 2,
    format: 'essay',
    points: 1.0,
    prompt: 'Một mảnh đất hình chữ nhật có chu vi là 120 m. Chiều dài bằng 40 m. Tính diện tích của mảnh đất đó.',
    specification: 'Hiểu và áp dụng các công thức liên hệ giữa chu vi, chiều dài, chiều rộng và diện tích hình chữ nhật.',
    answerGuide: `Bài giải:
Nửa chu vi mảnh đất là: 120 : 2 = 60 (m) (0,25 điểm)
Chiều rộng mảnh đất là: 60 - 40 = 20 (m) (0,25 điểm)
Diện tích mảnh đất là: 40 × 20 = 800 (m²) (0,5 điểm)
Đáp số: 800 m².`,
  });

  // Tự luận M3 (Vận dụng) - 1.0 đến 2.0 điểm
  qList.push({
    id: 'gen_q14',
    number: 0,
    topic: strand1,
    level: 3,
    format: 'essay',
    points: 1.5,
    prompt: grade === 5
      ? 'Một cửa hàng nhập về 1,5 tấn gạo. Ngày thứ nhất bán được 35% số gạo đó. Ngày thứ hai bán được 40% số gạo còn lại. Hỏi sau hai ngày cửa hàng còn lại bao nhiêu ki-lô-gam gạo?'
      : 'Hai thùng chứa tất cả 120 lít dầu. Nếu chuyển 15 lít từ thùng thứ nhất sang thùng thứ hai thì số dầu ở hai thùng bằng nhau. Hỏi lúc đầu mỗi thùng chứa bao nhiêu lít dầu?',
    specification: 'Vận dụng kiến thức giải toán nhiều bước tính trong tình huống thực tiễn có ý nghĩa.',
    answerGuide: `Bài giải đầy đủ các bước lập luận, phép tính và đáp số chính xác. Đạt 1,5 điểm.`,
  });

  return qList;
}

// Build standard Vietnamese questions matching the exact prompt structure
function buildVietnameseQuestions(grade: Grade, semester: Semester, optionCount: number, strands: { name: string; percent: number }[]): QuestionItem[] {
  const qList: QuestionItem[] = [];
  const optionsMCQ = (opts: string[]) => opts.slice(0, optionCount);

  // Mức 1 - Trắc nghiệm (NLC -> ĐS)
  qList.push({
    id: 'tv_q1',
    number: 0,
    topic: 'Đọc hiểu văn bản',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Nhân vật chính trong câu chuyện đã làm gì khi thấy bà cụ bị ốm?',
    options: optionsMCQ([
      'Chăm sóc ân cần và đi tìm thầy thuốc',
      'Đóng cửa ở trong nhà một mình',
      'Đi chơi cùng bạn bè ngoài sân',
      'Ngồi khóc không biết làm gì',
    ]),
    correctOption: 'A',
    specification: 'Nhận biết chi tiết, nhân vật và sự việc được nêu trực tiếp trong văn bản đọc hiểu.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'tv_q2',
    number: 0,
    topic: 'Đọc hiểu văn bản',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Chi tiết bông hoa cúc trắng hé nở tượng trưng cho điều gì trong câu chuyện?',
    options: optionsMCQ([
      'Tấm lòng hiếu thảo và sự kỳ diệu của yêu thương',
      'Vẻ đẹp kiêu sa rực rỡ của mùa xuân',
      'Sự giàu sang phú quý của gia đình',
      'Thời tiết ấm áp đang trở về',
    ]),
    correctOption: 'A',
    specification: 'Nhận biết hình ảnh mang tính biểu tượng được khắc họa trong bài đọc.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'tv_q3',
    number: 0,
    topic: 'Kiến thức Tiếng Việt',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Từ nào sau đây là từ chỉ phẩm chất tốt đẹp của con người?',
    options: optionsMCQ([
      'Hiếu thảo, nhân ái',
      'Chạy nhảy, reo hò',
      'Cao ráo, trắng trẻo',
      'Nhà cửa, trường học',
    ]),
    correctOption: 'A',
    specification: 'Nhận biết vốn từ ngữ chỉ phẩm chất và tính cách con người.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'tv_q4',
    number: 0,
    topic: 'Đọc hiểu văn bản',
    level: 1,
    format: 'true_false',
    points: 0.5,
    prompt: 'Đúng ghi Đ, sai ghi S vào ô trống:',
    subItems: [
      { id: 'tv_tf1', label: 'a', statement: 'Em bé luôn vâng lời và yêu thương mẹ hết lòng.', correctAnswer: true },
      { id: 'tv_tf2', label: 'b', statement: 'Bông hoa chỉ có đúng 2 cánh hoa mỏng manh.', correctAnswer: false },
    ],
    specification: 'Nhận biết và kiểm chứng thông tin đúng sai dựa vào chi tiết trong bài đọc.',
    answerGuide: 'Ý a ghi Đ (0,25đ); Ý b ghi S (0,25đ).',
  });

  // Mức 2 - Trắc nghiệm (NLC -> ĐS)
  qList.push({
    id: 'tv_q5',
    number: 0,
    topic: 'Đọc hiểu văn bản',
    level: 2,
    format: 'mcq',
    points: 0.5,
    prompt: 'Vì sao hành động xé nhỏ từng cánh hoa cúc của cô bé lại thể hiện tình yêu thương vô bờ bến?',
    options: optionsMCQ([
      'Vì mỗi cánh hoa tượng trưng cho một ngày mẹ được sống thêm trên cõi đời',
      'Vì cô bé muốn bông hoa cúc trông đẹp mắt hơn',
      'Vì ông lão dặn phải xé hoa thành nhiều mảnh nhỏ để làm thuốc',
      'Vì cô bé muốn chia hoa cho nhiều người cùng ngắm',
    ]),
    correctOption: 'A',
    specification: 'Hiểu ý nghĩa hành động và phẩm chất của nhân vật qua tình huống then chốt.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'tv_q6',
    number: 0,
    topic: 'Kiến thức Tiếng Việt',
    level: 2,
    format: 'mcq',
    points: 0.5,
    prompt: 'Dấu gạch ngang trong câu văn: "Bác sĩ mỉm cười – nụ cười ấm áp của người thầy thuốc – nhìn em bé." có tác dụng gì?',
    options: optionsMCQ([
      'Đánh dấu bộ phận chú thích, giải thích trong câu',
      'Đánh dấu lời nói trực tiếp của nhân vật',
      'Đánh dấu các ý liệt kê trong đoạn văn',
      'Nối các từ ngữ trong một liên danh',
    ]),
    correctOption: 'A',
    specification: 'Hiểu công dụng của dấu gạch ngang trong câu văn.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  // Tự luận M2 (Hiểu)
  qList.push({
    id: 'tv_q7',
    number: 0,
    topic: 'Đọc hiểu văn bản',
    level: 2,
    format: 'essay',
    points: 1.0,
    prompt: 'Theo em, câu chuyện muốn khuyên chúng ta điều gì về đạo làm con đối với ông bà, cha mẹ?',
    specification: 'Hiểu chủ đề và bài học nhân văn sâu sắc mà văn bản gửi gắm.',
    answerGuide: 'Nêu được bài học: Phải biết yêu thương, chăm sóc, hiếu thảo và biết ơn cha mẹ, ông bà khi họ còn mạnh khỏe cũng như lúc ốm đau. Đạt 1,0 điểm.',
  });

  qList.push({
    id: 'tv_q8',
    number: 0,
    topic: 'Kiến thức Tiếng Việt',
    level: 2,
    format: 'essay',
    points: 1.0,
    prompt: 'Hãy đặt 1 câu bày tỏ tình cảm của em đối với người thân trong gia đình, trong đó có sử dụng một từ ngữ chỉ đặc điểm.',
    specification: 'Hiểu và thực hành viết câu biểu cảm đúng ngữ pháp có sử dụng từ chỉ đặc điểm.',
    answerGuide: 'Đặt câu đúng ngữ pháp, có đủ chủ vị, có từ chỉ đặc điểm (ấm áp, hiền hậu, dịu dàng...), đầu câu viết hoa, cuối câu có dấu chấm. Đạt 1,0 điểm.',
  });

  // Tự luận M3 (Vận dụng) - 1.0 đến 2.0đ
  qList.push({
    id: 'tv_q9',
    number: 0,
    topic: 'Đọc hiểu văn bản',
    level: 3,
    format: 'essay',
    points: 1.0,
    prompt: 'Viết một đoạn văn ngắn (từ 3 đến 5 câu) kể về một việc làm cụ thể của em đã giúp đỡ ông bà hoặc cha mẹ khi họ mệt mỏi.',
    specification: 'Vận dụng bài học đạo đức vào đời sống thực tế thông qua việc viết đoạn văn trải nghiệm bản thân.',
    answerGuide: 'Đoạn văn đúng số câu, diễn đạt mạch lạc, cảm xúc chân thực, không sai lỗi chính tả. Đạt 1,0 điểm.',
  });

  return qList;
}

// Build Informatics questions
function buildInformaticsQuestions(grade: Grade, semester: Semester, optionCount: number, strands: { name: string; percent: number }[]): QuestionItem[] {
  const qList: QuestionItem[] = [];
  const optionsMCQ = (opts: string[]) => opts.slice(0, optionCount);

  // Lý thuyết M1
  qList.push({
    id: 'tin_q1',
    number: 0,
    topic: 'Lí thuyết Tin học',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Bộ phận nào của máy tính để bàn có chức năng xử lý thông tin giống như bộ não của con người?',
    options: optionsMCQ(['Thân máy (CPU)', 'Màn hình máy tính', 'Bàn phím', 'Chuột máy tính']),
    correctOption: 'A',
    specification: 'Nhận biết chức năng cơ bản của thân máy tính (CPU).',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'tin_q2',
    number: 0,
    topic: 'Lí thuyết Tin học',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Phím Spacebar (phím dài nhất trên bàn phím) dùng để làm gì khi soạn thảo văn bản?',
    options: optionsMCQ(['Tạo khoảng cách giữa các từ', 'Xuống dòng mới', 'Xóa ký tự đứng trước', 'Viết hoa chữ cái']),
    correctOption: 'A',
    specification: 'Nhận biết chức năng của phím cách (Spacebar) trong soạn thảo.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'tin_q3',
    number: 0,
    topic: 'Lí thuyết Tin học',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Để tẩy một nét vẽ bị sai trong phần mềm đồ họa Paint, em sử dụng công cụ nào?',
    options: optionsMCQ(['Công cụ Tẩy (Eraser)', 'Công cụ Bút chì (Pencil)', 'Công cụ Bình sơn (Fill)', 'Công cụ Kính lúp (Magnifier)']),
    correctOption: 'A',
    specification: 'Nhận biết công cụ tẩy xóa trong phần mềm đồ họa.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'tin_q4',
    number: 0,
    topic: 'Lí thuyết Tin học',
    level: 1,
    format: 'true_false',
    points: 0.5,
    prompt: 'Đúng ghi Đ, sai ghi S vào ô trống:',
    subItems: [
      { id: 'tin_tf1', label: 'a', statement: 'Tệp tin (file) có thể chứa văn bản, hình ảnh, âm thanh hoặc video.', correctAnswer: true },
      { id: 'tin_tf2', label: 'b', statement: 'Thư mục không thể chứa các thư mục con bên trong.', correctAnswer: false },
    ],
    specification: 'Nhận biết khái niệm tệp tin và thư mục trong hệ điều hành.',
    answerGuide: 'Ý a ghi Đ (0,25đ); Ý b ghi S (0,25đ).',
  });

  // Lý thuyết M2
  qList.push({
    id: 'tin_q5',
    number: 0,
    topic: 'Lí thuyết Tin học',
    level: 2,
    format: 'mcq',
    points: 0.5,
    prompt: 'Để căn giữa cho tiêu đề một bài văn trong Word, em nhấn tổ hợp phím nào?',
    options: optionsMCQ(['Ctrl + E', 'Ctrl + L', 'Ctrl + R', 'Ctrl + J']),
    correctOption: 'A',
    specification: 'Hiểu thao tác phím tắt căn lề trong soạn thảo văn bản.',
    answerGuide: 'Đáp án: A (Ctrl + E). Cho 0,5 điểm.',
  });

  qList.push({
    id: 'tin_q6',
    number: 0,
    topic: 'Lí thuyết Tin học',
    level: 2,
    format: 'true_false',
    points: 0.5,
    prompt: 'Đúng ghi Đ, sai ghi S vào ô trống:',
    subItems: [
      { id: 'tin_tf3', label: 'a', statement: 'Khi nhận được tin nhắn từ người lạ yêu cầu gửi ảnh gia đình, em cần báo ngay cho bố mẹ hoặc thầy cô.', correctAnswer: true },
      { id: 'tin_tf4', label: 'b', statement: 'Em có thể dùng chung mật khẩu tài khoản học tập với bạn cùng lớp để tiện trao đổi.', correctAnswer: false },
    ],
    specification: 'Hiểu quy tắc an toàn và bảo mật thông tin trên mạng Internet.',
    answerGuide: 'Ý a ghi Đ (0,25đ); Ý b ghi S (0,25đ).',
  });

  // Tự luận M2 (Lí thuyết)
  qList.push({
    id: 'tin_q7',
    number: 0,
    topic: 'Lí thuyết Tin học',
    level: 2,
    format: 'essay',
    points: 1.5,
    prompt: 'Em hãy nêu tác dụng của việc tổ chức thông tin trong máy tính thành các thư mục và tệp tin một cách khoa học.',
    specification: 'Hiểu lợi ích của việc quản lý tệp và thư mục ngăn nắp trong máy tính.',
    answerGuide: '- Giúp tìm kiếm thông tin nhanh chóng, thuận tiện (0,5đ).\n- Tránh nhầm lẫn, mất mát dữ liệu (0,5đ).\n- Giúp máy tính gọn gàng, tiết kiệm thời gian học tập và làm việc (0,5đ).',
  });

  // Thực hành M2 (2.0đ)
  qList.push({
    id: 'tin_q8',
    number: 0,
    topic: 'Thực hành kỹ năng Tin học',
    level: 2,
    format: 'practice',
    points: 2.0,
    prompt: 'Em hãy mở phần mềm Microsoft Word, gõ đúng chính tả đoạn ca dao sau:\n"Công cha như núi Thái Sơn\nNghĩa mẹ như nước trong nguồn chảy ra\nMột lòng thờ mẹ kính cha\nCho tròn chữ hiếu mới là đạo con."\nYêu cầu: Phông chữ Times New Roman, cỡ 14, in đậm hai chữ "Công cha", "Nghĩa mẹ".',
    specification: 'Thực hành kỹ năng gõ tiếng Việt có dấu và định dạng kiểu chữ đậm nghiêng trong văn bản.',
    answerGuide: '- Gõ đúng chính tả, đủ 4 câu: 1,0đ.\n- Định dạng phông chữ Times New Roman cỡ 14: 0,5đ.\n- In đậm đúng các cụm từ yêu cầu: 0,5đ.',
  });

  // Thực hành M3 (Vận dụng - 3.0đ)
  qList.push({
    id: 'tin_q9',
    number: 0,
    topic: 'Thực hành kỹ năng Tin học',
    level: 3,
    format: 'practice',
    points: 2.5,
    prompt: 'Tiếp tục bài làm trên:\na) Chèn một hình ảnh hoa sen từ thư mục máy tính vào dưới bài ca dao.\nb) Căn giữa hình ảnh và lưu văn bản vào ổ đĩa D:\\ với tên "CaDao_Lop4A.docx".',
    specification: 'Vận dụng kỹ năng chèn và căn chỉnh hình ảnh, lưu tệp theo đúng đường dẫn quy định.',
    answerGuide: '- Chèn được hình ảnh phù hợp và căn giữa: 1,5đ.\n- Lưu đúng ổ đĩa và đúng tên tệp: 1,0đ.',
  });

  return qList;
}

// Build History & Geography questions
function buildHistoryGeographyQuestions(grade: Grade, semester: Semester, optionCount: number, strands: { name: string; percent: number }[]): QuestionItem[] {
  const qList: QuestionItem[] = [];
  const optionsMCQ = (opts: string[]) => opts.slice(0, optionCount);

  // M1 TN
  qList.push({
    id: 'ls_q1',
    number: 0,
    topic: 'Mạch kiến thức Lịch sử',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Chiến thắng Bạch Đằng năm 938 do ai trực tiếp lãnh đạo?',
    options: optionsMCQ(['Ngô Quyền', 'Lý Thường Kiệt', 'Trần Hưng Đạo', 'Lê Lợi']),
    correctOption: 'A',
    specification: 'Nhận biết vị anh hùng dân tộc gắn liền với chiến thắng Bạch Đằng lịch sử.',
    answerGuide: 'Đáp án: A (Ngô Quyền). Cho 0,5 điểm.',
  });

  qList.push({
    id: 'ls_q2',
    number: 0,
    topic: 'Mạch kiến thức Địa lý',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Đồng bằng nào có diện tích lớn nhất nước ta?',
    options: optionsMCQ(['Đồng bằng sông Cửu Long', 'Đồng bằng Bắc Bộ', 'Đồng bằng duyên hải miền Trung', 'Đồng bằng sông Mã']),
    correctOption: 'A',
    specification: 'Nhận biết các đồng bằng lớn và đặc điểm tự nhiên của đất nước.',
    answerGuide: 'Đáp án: A (Đồng bằng sông Cửu Long). Cho 0,5 điểm.',
  });

  qList.push({
    id: 'ls_q3',
    number: 0,
    topic: 'Mạch kiến thức Lịch sử',
    level: 1,
    format: 'true_false',
    points: 0.5,
    prompt: 'Đúng ghi Đ, sai ghi S vào ô trống:',
    subItems: [
      { id: 'ls_tf1', label: 'a', statement: 'Năm 1010, vua Lý Thái Tổ quyết định dời đô từ Hoa Lư về Đại La (Thăng Long).', correctAnswer: true },
      { id: 'ls_tf2', label: 'b', statement: 'Văn Miếu Quốc Tử Giám được xây dựng dưới thời nhà Nguyễn tại Huế.', correctAnswer: false },
    ],
    specification: 'Nhận biết các mốc thời gian và sự kiện lịch sử quan trọng thời kỳ phong kiến.',
    answerGuide: 'Ý a ghi Đ (0,25đ); Ý b ghi S (0,25đ).',
  });

  qList.push({
    id: 'ls_q4',
    number: 0,
    topic: 'Mạch kiến thức Địa lý',
    level: 1,
    format: 'matching',
    points: 0.5,
    prompt: 'Nối tên vùng địa lý ở cột bên trái với đặc điểm địa hình tương ứng ở cột bên phải:',
    matchingPairs: [
      { leftNumber: '1', leftText: 'Vùng Trung du và miền núi Bắc Bộ', rightLetter: 'A', rightText: 'Địa hình đồi núi hiểm trở, nhiều đỉnh núi cao' },
      { leftNumber: '2', leftText: 'Vùng Duyên hải miền Trung', rightLetter: 'B', rightText: 'Dải đồng bằng hẹp, cồn cát ven biển' },
    ],
    specification: 'Nhận biết đặc điểm địa hình tiêu biểu của các vùng miền trên cả nước.',
    answerGuide: 'Nối 1 - A (0,25đ); 2 - B (0,25đ).',
  });

  // M2 TN
  qList.push({
    id: 'ls_q5',
    number: 0,
    topic: 'Mạch kiến thức Lịch sử',
    level: 2,
    format: 'mcq',
    points: 0.5,
    prompt: 'Ý nghĩa to lớn nhất của chiến thắng Bạch Đằng năm 938 là gì?',
    options: optionsMCQ([
      'Chấm dứt hoàn toàn hơn một nghìn năm Bắc thuộc, mở ra kỷ nguyên độc lập lâu dài',
      'Đánh tan quân Tống xâm lược lần thứ hai',
      'Thành lập nên triều đại nhà Trần hưng thịnh',
      'Mở rộng bờ cõi về phía Nam',
    ]),
    correctOption: 'A',
    specification: 'Hiểu ý nghĩa lịch sử sâu sắc của chiến thắng Bạch Đằng năm 938.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'ls_q6',
    number: 0,
    topic: 'Mạch kiến thức Địa lý',
    level: 2,
    format: 'mcq',
    points: 0.5,
    prompt: 'Vì sao vùng Đồng bằng sông Hồng lại có mạng lưới đê điều kiên cố và dài nhất nước ta?',
    options: optionsMCQ([
      'Để ngăn chặn lũ lụt từ sông Hồng vào mùa mưa bão, bảo vệ mùa màng và người dân',
      'Để làm đường giao thông vận tải huyết mạch nối liền các tỉnh',
      'Để phân chia ranh giới hành chính giữa các huyện',
      'Để giữ nước ngọt phục vụ nuôi trồng thủy sản quanh năm',
    ]),
    correctOption: 'A',
    specification: 'Hiểu mối quan hệ giữa đặc điểm khí hậu thủy văn và hoạt động đắp đê trị thủy của con người.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  // TL M1
  qList.push({
    id: 'ls_q7',
    number: 0,
    topic: 'Mạch kiến thức Lịch sử',
    level: 1,
    format: 'essay',
    points: 0.5,
    prompt: 'Kể tên 2 danh lam thắng cảnh hoặc di tích lịch sử nổi tiếng tại Thủ đô Hà Nội mà em biết.',
    specification: 'Nhận biết các di tích lịch sử - văn hóa tiêu biểu của dân tộc.',
    answerGuide: 'Học sinh kể được 2 di tích (Hồ Gươm, Hoàng thành Thăng Long, Văn Miếu Quốc Tử Giám, Chùa Một Cột...). Đạt 0,5 điểm.',
  });

  // TL M2
  qList.push({
    id: 'ls_q8',
    number: 0,
    topic: 'Mạch kiến thức Địa lý',
    level: 2,
    format: 'essay',
    points: 1.0,
    prompt: 'Nêu các thế mạnh kinh tế nổi bật của vùng Tây Nguyên trong việc phát triển nông nghiệp và công nghiệp.',
    specification: 'Hiểu tiềm năng tự nhiên của vùng đất đỏ bazan và khí hậu Tây Nguyên đối với cây công nghiệp lâu năm.',
    answerGuide: '- Đất đỏ bazan màu mỡ thích hợp trồng cây công nghiệp lâu năm: cà phê, cao su, chè, tiêu (0,5đ).\n- Sông ngòi chảy xiết có tiềm năng lớn phát triển thủy điện (0,5đ).',
  });

  // TL M3
  qList.push({
    id: 'ls_q9',
    number: 0,
    topic: 'Mạch kiến thức Địa lý',
    level: 3,
    format: 'essay',
    points: 1.5,
    prompt: 'Là một học sinh tiểu học, em có thể làm những hành động thiết thực nào để góp phần giữ gìn môi trường biển đảo quê hương luôn trong xanh và tươi đẹp?',
    specification: 'Vận dụng kiến thức bảo vệ tài nguyên môi trường vào hành vi thực tế hàng ngày.',
    answerGuide: '- Không xả rác bừa bãi khi đi du lịch tắm biển, đặc biệt là túi ni-lông và rác nhựa (0,5đ).\n- Tích cực tham gia các buổi dọn vệ sinh trường lớp, khu dân cư (0,5đ).\n- Tuyên truyền, nhắc nhở bạn bè và người thân cùng chung tay bảo vệ môi trường biển (0,5đ).',
  });

  return qList;
}

// Build Science questions
function buildScienceQuestions(grade: Grade, semester: Semester, optionCount: number, strands: { name: string; percent: number }[]): QuestionItem[] {
  const qList: QuestionItem[] = [];
  const optionsMCQ = (opts: string[]) => opts.slice(0, optionCount);

  qList.push({
    id: 'kh_q1',
    number: 0,
    topic: 'Chất và Năng lượng / Sinh vật và Môi trường',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Nước tồn tại ở mấy thể cơ bản trong tự nhiên?',
    options: optionsMCQ(['3 thể (rắn, lỏng, khí)', '2 thể (lỏng, khí)', '4 thể (rắn, lỏng, khí, plasma)', '1 thể duy nhất']),
    correctOption: 'A',
    specification: 'Nhận biết ba thể tồn tại cơ bản của nước trong tự nhiên.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'kh_q2',
    number: 0,
    topic: 'Con người và Sức khỏe / Trái đất và Bầu trời',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Để phòng tránh bệnh sốt xuất huyết, việc làm nào sau đây là quan trọng nhất?',
    options: optionsMCQ([
      'Diệt muỗi, loăng quăng/bọ gậy và ngủ màn',
      'Uống thật nhiều nước ngọt có ga',
      'Đóng kín cửa sổ suốt ngày đêm',
      'Tập thể dục dưới trời nắng gắt',
    ]),
    correctOption: 'A',
    specification: 'Nhận biết biện pháp phòng tránh bệnh truyền nhiễm do muỗi truyền.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'kh_q3',
    number: 0,
    topic: 'Chất và Năng lượng / Sinh vật và Môi trường',
    level: 1,
    format: 'true_false',
    points: 0.5,
    prompt: 'Đúng ghi Đ, sai ghi S vào ô trống:',
    subItems: [
      { id: 'kh_tf1', label: 'a', statement: 'Thực vật cần có ánh sáng, nước, không khí và chất khoáng để sống và phát triển.', correctAnswer: true },
      { id: 'kh_tf2', label: 'b', statement: 'Không khí là chất có hình dạng cố định và mắt thường luôn nhìn thấy được.', correctAnswer: false },
    ],
    specification: 'Nhận biết các yếu tố cần thiết cho sự sống của thực vật và tính chất của không khí.',
    answerGuide: 'Ý a ghi Đ (0,25đ); Ý b ghi S (0,25đ).',
  });

  qList.push({
    id: 'kh_q4',
    number: 0,
    topic: 'Con người và Sức khỏe / Trái đất và Bầu trời',
    level: 2,
    format: 'mcq',
    points: 0.5,
    prompt: 'Tại sao khi trời rét, chúng ta nên mặc quần áo ấm bằng len hoặc dạ?',
    options: optionsMCQ([
      'Vì len dạ xốp, chứa nhiều không khí dẫn nhiệt kém giúp giữ nhiệt cơ thể',
      'Vì len dạ có thể tự tỏa ra nhiệt độ cao làm nóng cơ thể',
      'Vì len dạ ngăn cản máu trong cơ thể lưu thông',
      'Vì len dạ nhẹ hơn tất cả các loại vải khác',
    ]),
    correctOption: 'A',
    specification: 'Hiểu tính chất dẫn nhiệt kém của không khí và ứng dụng của vật liệu cách nhiệt.',
    answerGuide: 'Đáp án: A. Cho 0,5 điểm.',
  });

  qList.push({
    id: 'kh_q5',
    number: 0,
    topic: 'Chất và Năng lượng / Sinh vật và Môi trường',
    level: 2,
    format: 'essay',
    points: 1.0,
    prompt: 'Em hãy vẽ sơ đồ hoặc mô tả vòng tuần hoàn của nước trong tự nhiên bằng các từ gợi ý: Bay hơi, Ngưng tụ, Mưa, Nước ngầm.',
    specification: 'Hiểu hiện tượng bay hơi, ngưng tụ tạo thành mây và mưa trong vòng tuần hoàn của nước.',
    answerGuide: '- Nước ở sông, hồ, biển gặp ánh nắng mặt trời bay hơi lên cao (0,25đ).\n- Hơi nước lên cao gặp lạnh ngưng tụ thành những hạt nước nhỏ li ti tạo thành mây (0,25đ).\n- Các giọt nước lớn dần rơi xuống tạo thành mưa (0,25đ).\n- Nước mưa chảy về sông suối, ngấm vào lòng đất tạo thành nước ngầm rồi lại trở về biển (0,25đ).',
  });

  qList.push({
    id: 'kh_q6',
    number: 0,
    topic: 'Con người và Sức khỏe / Trái đất và Bầu trời',
    level: 3,
    format: 'essay',
    points: 1.5,
    prompt: 'Gia đình bạn An thường xuyên vứt pin cũ vào thùng rác sinh hoạt chung. Em hãy giải thích cho bạn An hiểu tác hại của hành động đó và đề xuất cách xử lý pin cũ đúng cách.',
    specification: 'Vận dụng kiến thức về ô nhiễm hóa chất độc hại vào tình huống bảo vệ môi trường thực tế.',
    answerGuide: '- Tác hại: Pin chứa các kim loại nặng độc hại (chì, thủy ngân, cadimi). Khi chôn lấp sẽ ngấm vào đất và nguồn nước ngầm gây ung thư và độc hại cho con người và sinh vật (0,75đ).\n- Giải pháp: Thu gom pin cũ vào hộp riêng và mang đến các điểm thu gom rác thải điện tử tái chế của địa phương (0,75đ).',
  });

  return qList;
}

// Build Technology questions
function buildTechnologyQuestions(grade: Grade, semester: Semester, optionCount: number, strands: { name: string; percent: number }[]): QuestionItem[] {
  const qList: QuestionItem[] = [];
  const optionsMCQ = (opts: string[]) => opts.slice(0, optionCount);

  qList.push({
    id: 'cn_q1',
    number: 0,
    topic: 'Công nghệ và đời sống',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Biển báo giao thông có hình tròn, viền đỏ, nền trắng với hình vẽ màu đen bên trong là biển báo gì?',
    options: optionsMCQ(['Biển báo cấm', 'Biển báo nguy hiểm', 'Biển hiệu lệnh', 'Biển chỉ dẫn']),
    correctOption: 'A',
    specification: 'Nhận biết đặc điểm và ý nghĩa các nhóm biển báo giao thông đường bộ cơ bản.',
    answerGuide: 'Đáp án: A (Biển báo cấm). Cho 0,5 điểm.',
  });

  qList.push({
    id: 'cn_q2',
    number: 0,
    topic: 'Thủ công kĩ thuật & Thiết kế',
    level: 1,
    format: 'mcq',
    points: 0.5,
    prompt: 'Dụng cụ nào dùng để đo kích thước và kẻ các đoạn thẳng chính xác trong quy trình làm đồ chơi thủ công?',
    options: optionsMCQ(['Thước kẻ', 'Kéo thủ công', 'Keo dán giấy', 'Com-pa']),
    correctOption: 'A',
    specification: 'Nhận biết các dụng cụ cắt, dán và đo lường trong môn thủ công kỹ thuật.',
    answerGuide: 'Đáp án: A (Thước kẻ). Cho 0,5 điểm.',
  });

  qList.push({
    id: 'cn_q3',
    number: 0,
    topic: 'Công nghệ và đời sống',
    level: 1,
    format: 'true_false',
    points: 0.5,
    prompt: 'Đúng ghi Đ, sai ghi S vào ô trống:',
    subItems: [
      { id: 'cn_tf1', label: 'a', statement: 'Cần rút phích cắm điện khi không sử dụng thiết bị để tiết kiệm điện và phòng chống cháy nổ.', correctAnswer: true },
      { id: 'cn_tf2', label: 'b', statement: 'Có thể dùng tay ướt để cắm hoặc rút các thiết bị điện sinh hoạt.', correctAnswer: false },
    ],
    specification: 'Nhận biết quy tắc an toàn khi sử dụng các thiết bị điện trong gia đình.',
    answerGuide: 'Ý a ghi Đ (0,25đ); Ý b ghi S (0,25đ).',
  });

  qList.push({
    id: 'cn_q4',
    number: 0,
    topic: 'Thủ công kĩ thuật & Thiết kế',
    level: 2,
    format: 'essay',
    points: 1.0,
    prompt: 'Em hãy nêu các bước cơ bản để làm một chiếc ống cắm bút đơn giản từ vật liệu tái chế (như lõi giấy vệ sinh hoặc vỏ chai nhựa).',
    specification: 'Hiểu quy trình thiết kế và tái chế vật liệu thành đồ dùng học tập sáng tạo.',
    answerGuide: '- Bước 1: Chuẩn bị vật liệu (lõi giấy/chai nhựa, kéo, keo dán, giấy màu trang trí) (0,25đ).\n- Bước 2: Cắt và làm sạch thân ống cắm bút (0,25đ).\n- Bước 3: Dán đáy kín và bọc trang trí bằng giấy màu (0,25đ).\n- Bước 4: Kiểm tra độ vững chắc và cắm thử bút (0,25đ).',
  });

  qList.push({
    id: 'cn_q5',
    number: 0,
    topic: 'Công nghệ và đời sống',
    level: 3,
    format: 'essay',
    points: 1.5,
    prompt: 'Trong lớp học của em, nhiều bạn quên tắt quạt và bóng đèn khi ra về. Em hãy đề xuất một số giải pháp thiết thực để giúp các bạn hình thành thói quen sử dụng điện an toàn, tiết kiệm.',
    specification: 'Vận dụng ý thức tiết kiệm năng lượng và an toàn công nghệ vào môi trường học đường.',
    answerGuide: '- Cử bạn sao đỏ hoặc phân công tổ trực nhật kiểm tra tắt thiết bị điện trước khi ra về (0,5đ).\n- Vẽ tranh cổ động, viết khẩu hiệu "Tắt khi không sử dụng" dán cạnh công tắc điện (0,5đ).\n- Tuyên truyền trong các buổi sinh hoạt lớp về ý nghĩa tiết kiệm năng lượng (0,5đ).',
  });

  return qList;
}

// Sample reading text according to grade level
function getSamplePassageText(grade: Grade): string {
  if (grade === 1) {
    return `Ngày xưa, có hai mẹ con sống trong một túp lều tranh nghèo. Người mẹ bị ốm nặng. Cô bé thương mẹ, đi tìm thầy thuốc chữa bệnh.

Trên đường đi, cô bé gặp một cụ già râu tóc bạc phơ. Cụ đưa cho cô bé một bông hoa cúc trắng và bảo:
- Bông hoa này có bao nhiêu cánh thì mẹ cháu sẽ sống thêm được bấy nhiêu ngày.

Cô bé nhìn bông hoa chỉ có hai mươi cánh. Em liền cẩn thận xé nhỏ từng cánh hoa thành nhiều sợi nhỏ dài li ti. Từ đó, bông hoa cúc trắng có vô vàn cánh hoa, và người mẹ đã khỏi bệnh, sống thật vui vẻ bên cô con gái hiếu thảo.`;
  }

  if (grade === 2) {
    return `Mùa xuân đã về trên khắp các sườn đồi. Những chồi non hé mắt nhìn bầu trời trong xanh vời vợi. Trong vườn nhà, cây bưởi bung nở từng chùm hoa trắng ngần, tỏa hương thơm dìu dịu bay khắp xóm làng.

Chú chim sâu nhỏ thoăn thoắt chuyền cành, vạch từng kẽ lá tìm sâu bọ giúp cây tươi tốt. Đàn ong mật rộn ràng bay lượn từ sớm tinh mơ để gom góp từng giọt mật thơm cho đời.

Bé Mai cùng ông nội ra vườn tưới nước cho cây. Ngắm nhìn giọt sương mai long lanh như những viên pha lê đọng trên đầu ngọn cỏ, lòng Mai rộn rã niềm vui. Em thầm cảm ơn thiên nhiên tươi đẹp đã ban tặng cho con người muôn vàn sắc hương kỳ diệu.`;
  }

  if (grade === 3) {
    return `Cứ mỗi độ chớm hè, rừng dẻ ven làng tôi lại bắt đầu trút bỏ những chiếc lá già úa để nhường chỗ cho lộc non xanh biếc. Rồi từ những kẽ lá, những chùm hoa dẻ vàng óng hé nở, toả hương thơm ngát khắp nẻo đường làng.

Hoa dẻ không kiêu sa, lộng lẫy như hoa hồng, hoa cúc, cánh hoa thon dài, mỏng manh đung đưa trước gió như những ngón tay nhỏ xíu. Hương hoa dẻ ngọt ngào, thoang thoảng bay xa trong gió sớm. Lũ trẻ chúng tôi thường rủ nhau ra đồi hái những chùm hoa dẻ còn đọng sương mai, bọc vào vạt áo hay cài lên mái tóc để mang cả hương rừng về lớp học. Mỗi khi mở trang vở ra, mùi hương hoa dẻ lại ngào ngạt như nhắc nhở chúng tôi thêm yêu quý mảnh đất quê hương mộc mạc, nơi đã nâng bước tuổi thơ êm đềm lớn khôn theo từng năm tháng.`;
  }

  if (grade === 4) {
    return `Mùa gặt đến, cánh đồng làng tôi như một tấm thảm nhung vàng rực rỡ trải dài tít tắp đến tận chân trời. Gió thu nhè nhẹ thổi qua, sóng lúa nhấp nhô rập rờn tạo nên những thanh âm rì rào êm ả như lời ru của đất mẹ.

Từ sáng sớm, trên các ngả đường làng, bà con nông dân đã tấp nập gánh gồng, đẩy xe ra đồng với nụ cười rạng rỡ. Tiếng cười nói xôn xao hòa cùng tiếng máy gặt đập rộn rã khắp thôn xóm. Những bông lúa trĩu hạt, vàng óng ả nghiêng mình như mời gọi bàn tay người lao động cần cù. Mỗi hạt thóc mẩy tròn đều thấm đượm bao giọt mồ hôi vất vả, dãi dầu mưa nắng của người nông dân một nắng hai sương.

Đứng trên triền đê lộng gió, hít căng lồng ngực mùi thơm ngọt ngào của rơm rạ mới và hương lúa nếp chín quyện vào nhau, lòng tôi lại dâng lên một tình yêu quê hương da diết. Đất nước mình đẹp biết bao trong mùa gặt no ấm, thanh bình!`;
  }

  // Grade 5
  return `Con sông quê hương chảy qua bao làng mạc trù phú, tựa như một dải lụa đào mềm mại vắt ngang qua bức tranh đồng quê thanh bình. Buổi sáng tinh sương, mặt sông phẳng lặng như một tấm gương khổng lồ phản chiếu mây trời lãng đãng. Khi ông mặt trời nhô lên khỏi rặng tre xanh, dát những vệt nắng vàng rực rỡ xuống dòng nước, dòng sông bừng tỉnh sau một giấc ngủ dài.

Dọc hai bên bờ, những hàng phi lao rì rào ca hát trong gió sớm, che chở cho những mái nhà ngói đỏ tươi ẩn hiện dưới những vườn cây ăn quả xum xuê trĩu trịt. Dưới bến nước, từng đàn thuyền chài gác mái chèo nằm nghỉ ngơi sau một đêm dài buông lưới trên sông. Tiếng đập nước bì bõm, tiếng gọi nhau í ới của những người đi chợ sớm làm cho khúc sông trở nên nhộn nhịp, đầy sức sống.

Dòng sông không chỉ bồi đắp phù sa màu mỡ cho những bãi ngô, nương dâu thêm tươi tốt, mà còn gắn liền với biết bao kỷ niệm tuổi thơ tắm mát, câu cá, chèo thuyền của lũ trẻ chúng tôi. Dù mai này đi đâu xa, hình bóng dòng sông hiền hòa, êm dịu vẫn mãi in đậm trong tâm trí, nâng đỡ tâm hồn tôi trên mọi nẻo đường đời.`;
}
