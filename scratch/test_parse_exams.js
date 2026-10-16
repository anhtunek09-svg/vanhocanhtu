const fs = require('fs');
const fn = new Function('window', 'module', fs.readFileSync('js/data.js', 'utf8') + '\nreturn APP_DATA;');
const appData = fn({}, {});

appData.practiceExams.forEach((e) => {
  console.log(`\n=== ĐỀ ${e.id}: ${e.title} ===`);
  const c1Match = e.examContent.match(/\*\*Câu 1 \([^)]+\):\*\*\s*([^\n]+)/);
  const c2Match = e.examContent.match(/\*\*Câu 2 \([^)]+\):\*\*\s*([^\n]+)/);
  const c3Match = e.examContent.match(/\*\*Câu 3 \([^)]+\):\*\*\s*([^\n]+)/);
  const c4Match = e.examContent.match(/\*\*Câu 4 \([^)]+\):\*\*\s*([^\n]+)/);
  const p2c1Match = e.examContent.match(/PHẦN II[^\n]*\n+[\s\S]*?\*\*Câu 1 \([^)]+\):\*\*\s*([\s\S]*?)(?=\*\*Câu 2|$)/);
  const p2c2Match = e.examContent.match(/PHẦN II[^\n]*\n+[\s\S]*?\*\*Câu 2 \([^)]+\):\*\*\s*([\s\S]*?)$/);

  console.log('C1:', c1Match ? c1Match[1].substring(0, 60) + '...' : 'none');
  console.log('C2:', c2Match ? c2Match[1].substring(0, 60) + '...' : 'none');
  console.log('C3:', c3Match ? c3Match[1].substring(0, 60) + '...' : 'none');
  console.log('C4:', c4Match ? c4Match[1].substring(0, 60) + '...' : 'none');
  console.log('P2-C1 NLXH:', p2c1Match ? p2c1Match[1].trim().substring(0, 80) + '...' : 'none');
  console.log('P2-C2 NLVH:', p2c2Match ? p2c2Match[1].trim().substring(0, 80) + '...' : 'none');
});
