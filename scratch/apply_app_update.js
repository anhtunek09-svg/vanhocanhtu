const fs = require('fs');
const { module2Code } = require('./new_app_module2.js');

const appFile = 'js/app.js';
let content = fs.readFileSync(appFile, 'utf8');

// Replace Module 2
const startMarker = '// ──────────────────────────────────────────\n    // Module 2:';
const endMarker = '// ──────────────────────────────────────────\n    // Module 3: Máy Phân Tích Bài Viết';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  throw new Error(`Markers not found: start=${startIndex}, end=${endIndex}`);
}

content = content.substring(0, startIndex) + module2Code.trim() + '\n\n    ' + content.substring(endIndex);

// Add button to renderExamsBank
// Look for `<button class="btn btn-sm btn-ghost" onclick="app.copyExamFull(${exam.id})"`
const btnSearch = '<button class="btn btn-sm btn-ghost" onclick="app.copyExamFull(${exam.id})"';
if (content.includes(btnSearch)) {
  const replacementBtn = `<button class="btn btn-sm btn-primary" onclick="app.launchExamRoomFromBank(\${exam.id})">
                  <i data-lucide="play-circle"></i> Vào phòng thi thử
                </button>
                <button class="btn btn-sm btn-ghost" onclick="app.copyExamFull(\${exam.id})"`;
  content = content.replace(btnSearch, replacementBtn);
}

fs.writeFileSync(appFile, content, 'utf8');
console.log('Successfully updated js/app.js with Module 2 and Exam Bank launch button!');
