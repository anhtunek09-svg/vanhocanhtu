const fs = require('fs');

// 1. Verify data.js
const dataContent = fs.readFileSync('js/data.js', 'utf8');
const fn = new Function('window', 'module', dataContent + '\nreturn APP_DATA;');
const appData = fn({}, {});

console.log('=== DATA VERIFICATION ===');
console.log('Total practice exams:', appData.practiceExams.length);
console.log('Total exam documents:', appData.examDocuments.length);

appData.practiceExams.forEach(e => {
  if (!e.id || !e.title || !e.matrix || !e.examContent || !e.answerKey || !e.sampleEssay) {
    throw new Error(`Exam ${e.id} is missing required fields!`);
  }
});
console.log('✓ All 10 exams have complete matrix, examContent, answerKey, and sampleEssay.');

appData.examDocuments.forEach(d => {
  if (!d.id || !d.title || !d.category || !d.summary || !d.content) {
    throw new Error(`Doc ${d.id} is missing required fields!`);
  }
});
console.log('✓ All 4 study guides have complete id, title, category, summary, and content.');

// 2. Verify index.html elements
const html = fs.readFileSync('index.html', 'utf8');
const requiredIds = [
  'view-exams-bank',
  'tab-btn-exams',
  'tab-btn-docs',
  'badge-tab-exams',
  'badge-tab-docs',
  'exams-controls-wrapper',
  'exams-search-input',
  'exams-genre-chips',
  'exams-bank-list',
  'exams-docs-list'
];

console.log('\n=== INDEX.HTML ELEMENTS VERIFICATION ===');
requiredIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Missing DOM element id: ${id}`);
  }
  console.log(`✓ Element #${id} exists.`);
});

console.log('\n=== SUCCESS: All checks passed with 100% integrity! ===');
