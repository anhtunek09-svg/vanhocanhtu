const fs = require('fs');
const { newPracticeExams, examDocuments } = require('./new_exams_and_docs.js');

const dataFile = 'js/data.js';
const dataContent = fs.readFileSync(dataFile, 'utf8');

// Evaluate APP_DATA from dataContent
const fn = new Function('window', 'module', dataContent + '\nreturn APP_DATA;');
const appData = fn({}, {});

console.log('Before update:');
console.log('- Works count:', appData.works ? appData.works.length : 0);
console.log('- Practice exams count:', appData.practiceExams ? appData.practiceExams.length : 0);

// Combine practiceExams: keep 1-4 and append 5-10
const existingIds = new Set(appData.practiceExams.map(e => e.id));
const toAdd = newPracticeExams.filter(e => !existingIds.has(e.id));
appData.practiceExams = [...appData.practiceExams, ...toAdd];

// Add examDocuments
appData.examDocuments = examDocuments;

console.log('After update:');
console.log('- Practice exams count:', appData.practiceExams.length);
console.log('- Exam documents count:', appData.examDocuments.length);

// Generate new data.js file
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
console.log('Successfully updated js/data.js!');
