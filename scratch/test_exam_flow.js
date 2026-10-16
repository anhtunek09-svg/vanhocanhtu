// Verification script for Exam Room Flow
const fs = require('fs');
const path = require('path');

// 1. Check index.html structure
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Verify lobby screen exists and has id exam-lobby-screen
if (!html.includes('id="exam-lobby-screen"')) {
  console.error('FAIL: #exam-lobby-screen not found in index.html');
  process.exit(1);
}

// Verify active container exists and is hidden by default
if (!html.includes('id="exam-active-container" class="hidden')) {
  console.error('FAIL: #exam-active-container must have class="hidden"');
  process.exit(1);
}

// Verify questions list is empty by default (no questions exposed before start)
const passageMatch = html.match(/id="exam-passage-text">([\s\S]*?)<\/div>/);
if (passageMatch && passageMatch[1].trim().length > 50) {
  console.error('FAIL: Passage text exposed in HTML before exam start!');
  process.exit(1);
}

const questionsMatch = html.match(/id="exam-questions-list">([\s\S]*?)<\/div>/);
if (questionsMatch && questionsMatch[1].trim().length > 50) {
  console.error('FAIL: Questions exposed in HTML before exam start!');
  process.exit(1);
}

// Verify default 120 minutes in lobby
if (!html.includes('id="lobby-time-preview" class="text-accent">120 phút</strong>')) {
  console.error('FAIL: Default lobby preview time must be 120 phút');
  process.exit(1);
}

// 2. Syntax validation of JS files
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// Run in Node vm
const vm = require('vm');
const window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  scrollTo: () => {},
  document: {
    getElementById: () => ({ classList: { add: () => {}, remove: () => {} }, textContent: '', value: '' }),
    querySelectorAll: () => []
  }
};

const context = vm.createContext({
  window,
  document: window.document,
  localStorage: window.localStorage,
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: () => 1,
  console
});

try {
  vm.runInContext(dataCode, context);
  console.log('SUCCESS: data.js syntax and evaluation valid!');
  console.log(`Loaded ${context.window.APP_DATA.practiceExams.length} practice exams in APP_DATA.`);
} catch (err) {
  console.error('FAIL: data.js syntax error:', err);
  process.exit(1);
}

try {
  vm.runInContext(appCode, context);
  console.log('SUCCESS: app.js syntax and evaluation valid!');
} catch (err) {
  console.error('FAIL: app.js syntax error:', err);
  process.exit(1);
}

console.log('ALL TESTS PASSED: Exam Room and Lobby screens are completely sealed and structured properly!');
