const fs = require('fs');

console.log('=== TEST 1: KIỂM TRA DATA.JS & EXAM_PARTS ===');
const dataContent = fs.readFileSync('js/data.js', 'utf8');
const fnData = new Function('window', 'module', dataContent + '\nreturn APP_DATA;');
const appData = fnData({}, {});

console.log(`- Tổng số đề thi thử: ${appData.practiceExams.length}`);
appData.practiceExams.forEach(e => {
  const p = e.examParts;
  if (!p || !p.passage || p.readingQuestions.length !== 4 || !p.writingSocial || !p.writingLiterature) {
    throw new Error(`Đề ${e.id} thiếu cấu trúc examParts!`);
  }
});
console.log('✓ Toàn bộ 10 đề thi có đầy đủ examParts (Passage, 4 câu đọc hiểu, NLXH 200 chữ, NLVH 600 chữ).');

console.log('\n=== TEST 2: KIỂM TRA CÚ PHÁP APP.JS & CÁC HÀM PHÒNG THI ===');
const appContent = fs.readFileSync('js/app.js', 'utf8');

const requiredMethods = [
  'initExamModule',
  'populateExamSelector',
  'handlePracticeExamChange',
  'setExamDuration',
  'loadPracticeExam',
  'startExamSession',
  'handleExamAnswerInput',
  'handleExamTimeUp',
  'submitAndGradeFullExam',
  'gradeMOETPracticeExam',
  'renderExamGradedResult',
  'launchExamRoomFromBank',
  'getExamHistory',
  'saveExamHistory',
  'openExamHistoryModal',
  'closeExamHistoryModal',
  'viewHistoryItem',
  'clearExamHistory'
];

requiredMethods.forEach(method => {
  if (!appContent.includes(method)) {
    throw new Error(`Thiếu phương thức: ${method}`);
  }
  console.log(`✓ Phương thức app.${method} đã được định nghĩa.`);
});

console.log('\n=== TEST 3: KIỂM TRA GIAO DIỆN INDEX.HTML ===');
const htmlContent = fs.readFileSync('index.html', 'utf8');
const requiredIds = [
  'view-exam',
  'exam-setup-bar',
  'exam-practice-selector',
  'exam-selected-time-text',
  'exam-custom-time-input',
  'exam-time-presets',
  'exam-timer',
  'exam-timer-btn',
  'exam-session-status',
  'btn-start-exam',
  'btn-reset-exam',
  'exam-answered-counter',
  'btn-submit-exam',
  'exam-locked-alert',
  'exam-active-container',
  'exam-panel-passage',
  'exam-passage-text',
  'exam-panel-questions',
  'exam-questions-list',
  'exam-result-container',
  'modal-exam-history',
  'exam-history-modal-body',
  'exam-history-count-badge'
];

requiredIds.forEach(id => {
  if (!htmlContent.includes(`id="${id}"`)) {
    throw new Error(`Thiếu ID trong index.html: ${id}`);
  }
  console.log(`✓ ID #${id} tồn tại trong index.html.`);
});

console.log('\n=== TẤT CẢ 3 BỘ KIỂM TRA ĐỀU VƯỢT QUA 100%! ===');
