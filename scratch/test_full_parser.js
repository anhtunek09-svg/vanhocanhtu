const fs = require('fs');
const fn = new Function('window', 'module', fs.readFileSync('js/data.js', 'utf8') + '\nreturn APP_DATA;');
const appData = fn({}, {});

appData.practiceExams.forEach((e) => {
  const content = e.examContent;
  
  // Extract Passage: from "Đọc đoạn trích sau" until "Câu 1"
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

  console.log(`Đề ${e.id}:`);
  console.log(' - Passage found:', passage.length > 20);
  console.log(' - Q1 points:', q1Match ? q1Match[1] : 'none');
  console.log(' - Q2 points:', q2Match ? q2Match[1] : 'none');
  console.log(' - Q3 points:', q3Match ? q3Match[1] : 'none');
  console.log(' - Q4 points:', q4Match ? q4Match[1] : 'none');
  console.log(' - WS points:', wsMatch ? wsMatch[1] : 'none');
  console.log(' - WL points:', wlMatch ? wlMatch[1] : 'none');
});
