import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import { ExamDocument } from '../types/exam';

export async function exportExamToDocx(exam: ExamDocument): Promise<Blob> {
  const isLowerPrimary = exam.grade <= 3;

  // Header tables & Information
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: exam.schoolName.toUpperCase(), bold: true, size: 22, font: 'Times New Roman' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Họ và tên: .................................................', size: 22, font: 'Times New Roman' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Lớp: ${exam.grade}...`, size: 22, font: 'Times New Roman' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: exam.title.toUpperCase(), bold: true, size: 22, font: 'Times New Roman' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `MÔN: ${exam.subject.toUpperCase()} - LỚP ${exam.grade}`, bold: true, size: 22, font: 'Times New Roman' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Thời gian làm bài: ${exam.durationMinutes} phút`, italics: true, size: 20, font: 'Times New Roman' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `(${exam.schoolYear})`, size: 20, font: 'Times New Roman' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Score Box
  const scoreBox = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'ĐIỂM SỐ', bold: true, size: 22, font: 'Times New Roman' })],
              }),
              new Paragraph({ text: '' }),
              new Paragraph({ text: '' }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'LỜI NHẬN XÉT CỦA GIÁO VIÊN', bold: true, size: 22, font: 'Times New Roman' })],
              }),
              new Paragraph({ text: '' }),
              new Paragraph({ text: '' }),
            ],
          }),
        ],
      }),
    ],
  });

  // Reading passage if Tiếng Việt
  const passageParagraphs: Paragraph[] = [];
  if (exam.passage) {
    passageParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({ text: exam.passage.title.toUpperCase(), bold: true, size: 24, font: 'Times New Roman' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 150 },
        children: [
          new TextRun({ text: `(${exam.passage.author} - Độ dài: ${exam.passage.wordCount} chữ)`, italics: true, size: 20, font: 'Times New Roman' }),
        ],
      })
    );

    const lines = exam.passage.content.split('\n\n');
    lines.forEach((line) => {
      passageParagraphs.push(
        new Paragraph({
          indent: { firstLine: 720 }, // 1 tab
          spacing: { after: 120 },
          children: [
            new TextRun({ text: line, size: 22, font: 'Times New Roman' }),
          ],
        })
      );
    });

    passageParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 150, after: 200 },
        children: [
          new TextRun({ text: '-----------------------o0o-----------------------', size: 20, font: 'Times New Roman' }),
        ],
      })
    );
  }

  // Questions formatting:
  // Câu số (in đậm), điểm (chữ nghiêng và không đậm) liền câu số, câu hỏi (chữ không đậm)
  // VD: Câu 1(0,5 điểm): CÂU HỎI ĐỂ C KO ĐẬM
  // Câu số và ý (a,b,…) bằng lề - không tab
  // Phương án (A, B, C, D) lùi vào 1 tab (1cm ~ 567 twips)
  const questionParagraphs: Paragraph[] = [];

  exam.questions.forEach((q) => {
    // Main question prompt line
    const pointStr = q.points.toString().replace('.', ',');
    const promptRuns: TextRun[] = [
      new TextRun({ text: `Câu ${q.number}`, bold: true, size: 22, font: 'Times New Roman' }),
      new TextRun({ text: ` (${pointStr} điểm): `, italics: true, bold: false, size: 22, font: 'Times New Roman' }),
      new TextRun({ text: q.prompt, bold: false, size: 22, font: 'Times New Roman' }),
    ];

    questionParagraphs.push(
      new Paragraph({
        spacing: { before: 180, after: 80 },
        children: promptRuns,
      })
    );

    // Options for MCQ (indented 1 tab ~ 567 twips)
    if (q.options && q.options.length > 0) {
      const letters = ['A', 'B', 'C', 'D'];
      q.options.forEach((opt, idx) => {
        const letter = letters[idx];
        questionParagraphs.push(
          new Paragraph({
            indent: { left: 567 }, // 1 tab indentation
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `${letter}. `, bold: true, size: 22, font: 'Times New Roman' }),
              new TextRun({ text: opt, size: 22, font: 'Times New Roman' }),
            ],
          })
        );
      });
    }

    // Sub-items for True/False (bằng lề)
    if (q.subItems && q.subItems.length > 0) {
      q.subItems.forEach((sub) => {
        questionParagraphs.push(
          new Paragraph({
            indent: { left: 200 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `${sub.label}) `, bold: true, size: 22, font: 'Times New Roman' }),
              new TextRun({ text: sub.statement, size: 22, font: 'Times New Roman' }),
              new TextRun({ text: '  [......]', bold: true, size: 22, font: 'Times New Roman' }),
            ],
          })
        );
      });
    }

    // Matching pairs
    if (q.matchingPairs && q.matchingPairs.length > 0) {
      q.matchingPairs.forEach((pair) => {
        questionParagraphs.push(
          new Paragraph({
            indent: { left: 567 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `${pair.leftNumber}. ${pair.leftText}`, bold: true, size: 22, font: 'Times New Roman' }),
              new TextRun({ text: `  ----------  `, size: 22, font: 'Times New Roman' }),
              new TextRun({ text: `${pair.rightLetter}. ${pair.rightText}`, size: 22, font: 'Times New Roman' }),
            ],
          })
        );
      });
    }

    // Blanks prompt
    if (q.blanksPrompt) {
      const bLines = q.blanksPrompt.split('\n');
      bLines.forEach((bl) => {
        questionParagraphs.push(
          new Paragraph({
            indent: { left: 567 },
            spacing: { after: 60 },
            children: [new TextRun({ text: bl, size: 22, font: 'Times New Roman' })],
          })
        );
      });
    }

    // Essay space for answers
    if (q.format === 'essay' || q.format === 'practice') {
      questionParagraphs.push(
        new Paragraph({
          indent: { left: 567 },
          spacing: { before: 80, after: 120 },
          children: [
            new TextRun({ text: 'Bài làm:', italics: true, size: 20, font: 'Times New Roman' }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '................................................................................................................................................................', size: 20, font: 'Times New Roman' })],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '................................................................................................................................................................', size: 20, font: 'Times New Roman' })],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '................................................................................................................................................................', size: 20, font: 'Times New Roman' })],
        })
      );
    }
  });

  // --- SECTION 2: MA TRẬN ĐỀ KIỂM TRA (Table) ---
  const matrixHeaderRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mạch kiến thức / Chủ đề', bold: true, size: 18, font: 'Times New Roman' })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mức 1 (Biết)', bold: true, size: 18, font: 'Times New Roman' })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mức 2 (Hiểu)', bold: true, size: 18, font: 'Times New Roman' })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mức 3 (Vận dụng)', bold: true, size: 18, font: 'Times New Roman' })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Tổng cộng', bold: true, size: 18, font: 'Times New Roman' })] })] }),
    ],
  });

  const matrixDataRows = exam.matrix.map((row) => {
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.topic, bold: true, size: 18, font: 'Times New Roman' })] })] }),
        new TableCell({
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `TN: ${row.m1_tn_count} (${row.m1_tn_points}đ)`, size: 18, font: 'Times New Roman' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `TL: ${row.m1_tl_count} (${row.m1_tl_points}đ)`, size: 18, font: 'Times New Roman' })] }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `TN: ${row.m2_tn_count} (${row.m2_tn_points}đ)`, size: 18, font: 'Times New Roman' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `TL: ${row.m2_tl_count} (${row.m2_tl_points}đ)`, size: 18, font: 'Times New Roman' })] }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `TL: ${row.m3_tl_count} (${row.m3_tl_points}đ)`, size: 18, font: 'Times New Roman' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Không có TN M3)', italics: true, size: 16, font: 'Times New Roman' })] }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${row.total_questions} câu (${row.total_points}đ)`, bold: true, size: 18, font: 'Times New Roman' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Tỷ lệ: ${row.percentage}%`, italics: true, size: 16, font: 'Times New Roman' })] }),
          ],
        }),
      ],
    });
  });

  const matrixTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [matrixHeaderRow, ...matrixDataRows],
  });

  // --- SECTION 3: BẢN ĐẶC TẢ ĐỀ KIỂM TRA (Table) ---
  const specHeaderRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Câu số', bold: true, size: 18, font: 'Times New Roman' })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Chủ đề / Mạch KT', bold: true, size: 18, font: 'Times New Roman' })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mức độ', bold: true, size: 18, font: 'Times New Roman' })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Hình thức', bold: true, size: 18, font: 'Times New Roman' })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Yêu cầu cần đạt chuẩn GDPT 2018', bold: true, size: 18, font: 'Times New Roman' })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Điểm', bold: true, size: 18, font: 'Times New Roman' })] })] }),
    ],
  });

  const specDataRows = exam.specifications.map((s) => {
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Câu ${s.questionNumber}`, bold: true, size: 18, font: 'Times New Roman' })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.topic, size: 18, font: 'Times New Roman' })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.level, size: 18, font: 'Times New Roman' })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.formatName, size: 18, font: 'Times New Roman' })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.competencyRequired, size: 18, font: 'Times New Roman' })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${s.points}đ`, size: 18, font: 'Times New Roman' })] })] }),
      ],
    });
  });

  const specTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [specHeaderRow, ...specDataRows],
  });

  // --- SECTION 4: ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM ---
  const answerParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 150 },
      children: [
        new TextRun({ text: 'HƯỚNG DẪN CHẤM VÀ ĐÁP ÁN CHI TIẾT', bold: true, size: 24, font: 'Times New Roman' }),
      ],
    }),
  ];

  exam.questions.forEach((q) => {
    answerParagraphs.push(
      new Paragraph({
        spacing: { before: 100, after: 40 },
        children: [
          new TextRun({ text: `Câu ${q.number} (${q.points} điểm): `, bold: true, size: 22, font: 'Times New Roman' }),
        ],
      }),
      new Paragraph({
        indent: { left: 567 },
        spacing: { after: 80 },
        children: [
          new TextRun({ text: q.answerGuide || 'Theo biểu điểm chuẩn.', size: 22, font: 'Times New Roman' }),
        ],
      })
    );
  });

  // Construct final Document
  const doc = new Document({
    sections: [
      // Section 1: ĐỀ KIỂM TRA
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2cm
              bottom: 1134,
              left: 1417, // 2.5cm
              right: 1134, // 2cm
            },
          },
        },
        children: [
          headerTable,
          new Paragraph({ text: '' }),
          scoreBox,
          new Paragraph({ text: '' }),
          ...passageParagraphs,
          ...questionParagraphs,
        ],
      },
      // Section 2: MA TRẬN VÀ BẢN ĐẶC TẢ
      {
        properties: {
          page: {
            margin: {
              top: 1134,
              bottom: 1134,
              left: 1134,
              right: 1134,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 150 },
            children: [
              new TextRun({ text: 'MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ', bold: true, size: 24, font: 'Times New Roman' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: `Môn: ${exam.subject} - Lớp ${exam.grade} (${exam.semester})`, italics: true, size: 20, font: 'Times New Roman' }),
            ],
          }),
          matrixTable,
          new Paragraph({ text: '' }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({ text: 'BẢN ĐẶC TẢ MA TRẬN ĐỀ KIỂM TRA', bold: true, size: 24, font: 'Times New Roman' }),
            ],
          }),
          specTable,
        ],
      },
      // Section 3: ĐÁP ÁN VÀ BIỂU ĐIỂM
      {
        properties: {
          page: {
            margin: {
              top: 1134,
              bottom: 1134,
              left: 1417,
              right: 1134,
            },
          },
        },
        children: answerParagraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
