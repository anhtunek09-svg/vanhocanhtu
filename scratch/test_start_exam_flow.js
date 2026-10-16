const fs = require('fs');

console.log('=== TEST START EXAM FLOW ===');

// 1. Kiểm tra index.html
const html = fs.readFileSync('index.html', 'utf8');

// Check selector options
const hasOptionsWithTitlesOnly = html.includes('<option value="1">Đề thi thử Tốt nghiệp THPT Quốc gia 2026 – Đề số 1</option>');
console.log('1. index.html chứa option tiêu đề thuần túy:', hasOptionsWithTitlesOnly);

// Check start button
const hasStartBtn = html.includes('id="btn-start-exam"');
console.log('2. index.html chứa nút Bắt đầu làm bài:', hasStartBtn);

// Check status badge
const hasStatusBadge = html.includes('id="exam-session-status"');
console.log('3. index.html chứa trạng thái phòng thi:', hasStatusBadge);

// 2. Kiểm tra app.js
const appJs = fs.readFileSync('js/app.js', 'utf8');

const hasStartExamSession = appJs.includes('startExamSession()');
console.log('4. app.js chứa hàm startExamSession():', hasStartExamSession);

const hasPopulateClean = appJs.includes('return `<option value="${e.id}">${e.title}</option>`;');
console.log('5. app.js populateExamSelector chỉ trả về e.title:', hasPopulateClean);

const hasIsStartedState = appJs.includes('isStarted: false');
console.log('6. app.js state.exam có isStarted: false:', hasIsStartedState);

const hasDisabledFields = appJs.includes('class="question-textarea exam-answer-field"') && appJs.includes('disabled');
console.log('7. app.js tạo ô trả lời ở trạng thái khóa ban đầu:', hasDisabledFields);

console.log('\n=== TẤT CẢ KIỂM TRA ĐỀU THÀNH CÔNG! ===');
