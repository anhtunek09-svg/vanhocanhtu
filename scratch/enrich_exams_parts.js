const fs = require('fs');

const dataFile = 'js/data.js';
const dataContent = fs.readFileSync(dataFile, 'utf8');

const fn = new Function('window', 'module', dataContent + '\nreturn APP_DATA;');
const appData = fn({}, {});

appData.practiceExams.forEach((e) => {
  const content = e.examContent;

  // Extract Passage
  const passageMatch = content.match(/Đọc (?:đoạn trích|đoạn thơ|văn bản) sau và thực hiện các yêu cầu:[\s\S]*?\n\n([\s\S]*?)(?=\n\n\*\*Câu 1)/);
  const passage = passageMatch ? passageMatch[1].trim() : '';

  // Extract Question 1
  const q1Match = content.match(/\*\*Câu 1 \(([^)]+)\):\*\*\s*([\s\S]*?)(?=\n\*\*Câu 2)/);
  // Extract Question 2
  const q2Match = content.match(/\*\*Câu 2 \(([^)]+)\):\*\*\s*([\s\S]*?)(?=\n\*\*Câu 3)/);
  // Extract Question 3
  const q3Match = content.match(/\*\*Câu 3 \(([^)]+)\):\*\*\s*([\s\S]*?)(?=\n\*\*Câu 4)/);
  // Extract Question 4
  const q4Match = content.match(/\*\*Câu 4 \(([^)]+)\):\*\*\s*([\s\S]*?)(?=\n\n---\n\n### PHẦN II)/);

  // Extract Writing Social
  const wsMatch = content.match(/### PHẦN II: VIẾT[^\n]*\n+[\s\S]*?\*\*Câu 1 \(([^)]+)\):\*\*\s*([\s\S]*?)(?=\n\n\*\*Câu 2)/);
  // Extract Writing Literature
  const wlMatch = content.match(/### PHẦN II: VIẾT[^\n]*\n+[\s\S]*?\*\*Câu 2 \(([^)]+)\):\*\*\s*([\s\S]*?)$/);

  e.examParts = {
    passage: passage,
    readingQuestions: [
      {
        id: 1,
        questionNumber: 1,
        pointsLabel: q1Match ? q1Match[1] : '0,75 điểm',
        maxPoints: 0.75,
        level: 'Nhận biết',
        prompt: q1Match ? q1Match[2].trim() : ''
      },
      {
        id: 2,
        questionNumber: 2,
        pointsLabel: q2Match ? q2Match[1] : '1,0 điểm',
        maxPoints: 1.0,
        level: 'Thông hiểu',
        prompt: q2Match ? q2Match[2].trim() : ''
      },
      {
        id: 3,
        questionNumber: 3,
        pointsLabel: q3Match ? q3Match[1] : '1,25 điểm',
        maxPoints: 1.25,
        level: 'Vận dụng',
        prompt: q3Match ? q3Match[2].trim() : ''
      },
      {
        id: 4,
        questionNumber: 4,
        pointsLabel: q4Match ? q4Match[1] : '1,0 điểm',
        maxPoints: 1.0,
        level: 'Vận dụng cao',
        prompt: q4Match ? q4Match[2].trim() : ''
      }
    ],
    writingSocial: {
      id: 5,
      questionNumber: 1,
      pointsLabel: wsMatch ? wsMatch[1] : '2,0 điểm',
      maxPoints: 2.0,
      type: 'Đoạn văn Nghị luận xã hội (khoảng 200 chữ)',
      prompt: wsMatch ? wsMatch[2].trim() : ''
    },
    writingLiterature: {
      id: 6,
      questionNumber: 2,
      pointsLabel: wlMatch ? wlMatch[1] : '4,0 điểm',
      maxPoints: 4.0,
      type: 'Bài văn Nghị luận văn học (khoảng 600 chữ)',
      prompt: wlMatch ? wlMatch[2].trim() : ''
    }
  };
});

const newFileContent = `// ============================================================
// VĂN 12 PRO LAB – Data Module (Chương trình mới 2026)
// Toàn bộ 18 tác phẩm Ngữ văn 12 mới nhất theo Bộ Giáo dục & Đào tạo
// Dữ liệu học thuật chuyên sâu: Tránh đạo văn, nâng tầm câu từ, chuẩn barem 9+
// Tuyển tập 10 đề thi thử Tốt nghiệp THPT 2026 + 4 Cẩm nang ôn thi 9+
// ============================================================

const APP_DATA = ${JSON.stringify(appData, null, 2)};

if (typeof window !== 'undefined') {
  window.APP_DATA = APP_DATA;
}
if (typeof module !== 'undefined') {
  module.exports = APP_DATA;
}
`;

fs.writeFileSync(dataFile, newFileContent, 'utf8');
console.log('Successfully enriched practice exams with structured examParts!');
