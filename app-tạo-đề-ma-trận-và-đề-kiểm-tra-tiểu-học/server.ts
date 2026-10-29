import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API endpoint to generate or enhance exam matrices and papers
app.post('/api/generate-exam', async (req: Request, res: Response) => {
  try {
    const {
      subject,
      grade,
      semester,
      bookSeries,
      customTopics,
      readingGenre,
      includePassage,
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống.',
        fallback: true,
      });
    }

    const systemPrompt = `Bạn là Chuyên gia Khảo thí và Đo lường Giáo dục Tiểu học hàng đầu Việt Nam, am hiểu sâu sắc Chương trình Giáo dục phổ thông 2018 (GDPT 2018) và Thông tư 27/2020/TT-BGDĐT.
Nhiệm vụ của bạn là xây dựng Ma trận, Bản đặc tả, Đề kiểm tra và Hướng dẫn chấm chi tiết tuyệt đối tuân thủ các quy tắc sau:

1. QUY TẮC CẤU TRÚC ĐỀ VÀ THỨ TỰ CÂU:
- Thứ tự câu đánh số liên tục từ Câu 1 đến câu cuối cùng hết đề kiểm tra.
- TUYỆT ĐỐI KHÔNG GHI tiêu đề "Phần trắc nghiệm", "Phần tự luận" trong đề kiểm tra.
- Các câu hỏi sắp xếp từ Trắc nghiệm đến Tự luận.
- Trắc nghiệm: Mức 1 (Biết) xếp trước -> Mức 2 (Hiểu) xếp sau. Cụ thể:
  + Biết nhiều lựa chọn (NLC) -> Biết đúng sai (ĐS) -> Biết nối cột (NC) -> Biết điền khuyết (ĐK)
  + Hiểu NLC -> Hiểu ĐS -> Hiểu NC -> Hiểu ĐK
- TUYỆT ĐỐI KHÔNG TẠO CÂU TRẮC NGHIỆM Ở MỨC VẬN DỤNG (Mức 3). Mức 3 chỉ dành cho Tự luận (hoặc Thực hành môn Tin học).
- Tự luận: Lần lượt từ Biết (Mức 1) -> Hiểu (Mức 2) -> Vận dụng (Mức 3) để học sinh tư duy từ dễ đến khó.
- Không ghép câu thuộc 2 chủ đề/bài học/mạch kiến thức với nhau.
- Mỗi câu hỏi tương ứng đúng 1 đặc tả yêu cầu cần đạt.

2. CÁCH TRÌNH BÀY ĐỀ:
- Đề mục câu: **Câu X** *(điểm điểm)*: Nội dung câu hỏi (chữ câu hỏi không in đậm). Ví dụ: "Câu 1(0,5 điểm): Kết quả của phép tính 25 + 14 là:"
- Câu số và các ý (a, b, c) bằng lề (không lùi tab).
- Phương án trắc nghiệm (A, B, C, D) lùi vào 1 tab (1cm).
- Số lượng phương án trắc nghiệm nhiều lựa chọn:
  + Lớp 1, 2, 3: Chỉ gồm 3 phương án (A, B, C).
  + Lớp 4, 5: Gồm 4 phương án (A, B, C, D).
- Điểm số:
  + Trắc nghiệm nhiều lựa chọn: 0,5 điểm/câu.
  + Trắc nghiệm Đúng/Sai, Nối cột, Điền khuyết: 0,25 điểm/ý.
  + Tự luận: Mức 1: 0,5 điểm/câu; Mức 2: 1,0 điểm/câu; Mức 3: 1,0 - 2,0 điểm/câu.

3. QUY ĐỊNH RIÊNG TỪNG MÔN:
- TOÁN: Tỉ lệ M1:M2:M3 = 50:30:20%. Tỉ lệ TN = 60% (6đ), TL = 40% (4đ). Mạch kiến thức Số & Phép tính, Hình học & Đo lường, Thống kê & Xác suất đúng theo tỷ lệ từng kỳ. Với hình học có thể mô tả lưới ô vuông.
- TIẾNG VIỆT:
  + Văn bản đọc ngoài chương trình học, có số chữ chuẩn xác theo khối lớp (Lớp 1: 90-130 chữ; Lớp 2: 180-200 chữ; Lớp 3: 200-250 chữ; Lớp 4: 280-330 chữ; Lớp 5: 300-350 chữ).
  + Cấu trúc đọc hiểu: Phân chia rõ Đọc hiểu văn bản và Kiến thức Tiếng Việt.
- TIN HỌC:
  + Lớp 3: Lí thuyết 7đ - Thực hành 3đ (TN 6 câu = 3đ; TL/TH theo kỳ).
  + Lớp 4: Lí thuyết 6đ - Thực hành 4đ (TN 6 câu = 3đ; TL 2 câu, TH 2 bài).
  + Lớp 5: Lí thuyết 5đ - Thực hành 5đ (TN 5 câu = 2.5đ; TL/TH theo kỳ).
- LỊCH SỬ & ĐỊA LÝ, KHOA HỌC, CÔNG NGHỆ: M1:M2:M3 = 50:30:20%, TN 60% - TL 40%.

Hãy xuất kết quả hoàn toàn bằng JSON theo cấu trúc nghiêm ngặt được yêu cầu.`;

    const userPrompt = `Hãy tạo một bộ đề kiểm tra hoàn chỉnh cho:
- Môn: ${subject}
- Lớp: ${grade}
- Kỳ kiểm tra: ${semester}
- Bộ sách: ${bookSeries || 'Bộ sách chuẩn GDPT 2018 (Kết nối tri thức / Cánh Diều / Chân trời sáng tạo)'}
${customTopics ? `- Chủ đề trọng tâm cần tập trung: ${customTopics}` : ''}
${readingGenre ? `- Thể loại văn bản đọc hiểu (cho Tiếng Việt): ${readingGenre}` : ''}

Yêu cầu xuất ra JSON hợp lệ gồm:
{
  "title": "Tên bài kiểm tra chuẩn (Ví dụ: ĐỀ KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ I - NĂM HỌC 2025-2026)",
  "subject": "${subject}",
  "grade": ${grade},
  "semester": "${semester}",
  "duration": "Thời gian làm bài (phút, ví dụ 40 phút)",
  "readingPassage": {
    "title": "Tên bài đọc (nếu là môn Tiếng Việt)",
    "author": "Tên tác giả hoặc Nguồn sưu tầm",
    "wordCount": 180,
    "content": "Nội dung văn bản đọc hiểu ngoài chương trình với độ dài chuẩn số lượng chữ"
  },
  "matrix": [
    {
      "topic": "Tên mạch kiến thức/chủ đề",
      "m1_tn_count": 2,
      "m1_tn_points": 1.0,
      "m1_tl_count": 1,
      "m1_tl_points": 0.5,
      "m2_tn_count": 2,
      "m2_tn_points": 1.0,
      "m2_tl_count": 1,
      "m2_tl_points": 1.0,
      "m3_tn_count": 0,
      "m3_tn_points": 0.0,
      "m3_tl_count": 1,
      "m3_tl_points": 1.0,
      "total_points": 4.5,
      "percentage": 45
    }
  ],
  "matrixSummary": {
    "m1_points": 5.0,
    "m1_percent": 50,
    "m2_points": 3.0,
    "m2_percent": 30,
    "m3_points": 2.0,
    "m3_percent": 20,
    "tn_points": 6.0,
    "tn_percent": 60,
    "tl_points": 4.0,
    "tl_percent": 40,
    "total_points": 10.0
  },
  "specifications": [
    {
      "questionNumber": 1,
      "topic": "Số và phép tính",
      "level": "Mức 1",
      "type": "Trắc nghiệm nhiều lựa chọn",
      "requiredCompetency": "Nhận biết được...",
      "points": 0.5
    }
  ],
  "questions": [
    {
      "number": 1,
      "level": 1,
      "levelName": "Mức 1",
      "format": "multiple_choice",
      "formatName": "Trắc nghiệm nhiều lựa chọn",
      "topic": "Số và phép tính",
      "points": 0.5,
      "rawPrompt": "Nội dung câu hỏi không in đậm",
      "options": ["Phương án A", "Phương án B", "Phương án C"],
      "correctOption": "A",
      "subItems": []
    }
  ],
  "answerKey": [
    {
      "questionNumber": 1,
      "points": 0.5,
      "answer": "A. 35",
      "explanation": "Chi tiết các bước hoặc hướng dẫn chấm..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text || '';
    const examData = JSON.parse(text);

    return res.json({ success: true, data: examData });
  } catch (error: any) {
    console.error('Error generating exam with Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Lỗi khi gọi API Gemini',
      fallback: true,
    });
  }
});

// Setup dev server with Vite middlewares
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
