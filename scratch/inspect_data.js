const fs = require('fs');
const content = fs.readFileSync('js/data.js', 'utf8');

// evaluate APP_DATA
let sandbox = {};
try {
  const fn = new Function('window', 'module', content + '\nreturn APP_DATA;');
  const appData = fn(sandbox, {});
  console.log('Works count:', appData.works ? appData.works.length : 0);
  console.log('Works titles:');
  appData.works.forEach((w, i) => console.log(`${i+1}. ${w.title} (${w.author}) [${w.genre}]`));
  console.log('\nPractice Exams count:', appData.practiceExams ? appData.practiceExams.length : 0);
  appData.practiceExams.forEach(e => console.log(`- Đề ${e.id}: ${e.title} [${e.sourceType}]`));
} catch (err) {
  console.error('Error evaluating data.js:', err);
}
