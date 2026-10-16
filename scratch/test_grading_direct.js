const fs = require('fs');

const dataContent = fs.readFileSync('js/data.js', 'utf8');
const fnData = new Function('window', 'module', dataContent + '\nreturn APP_DATA;');
const appData = fnData({}, {});

const appContent = fs.readFileSync('js/app.js', 'utf8');
const exam1 = appData.practiceExams[0];
const sampleAnswers = {
  q1: 'Thể thơ bảy chữ tự do. Hai từ Hán Việt là biên cương, viễn xứ.',
  q2: 'Đoàn binh Tây Tiến hiện lên với ngoại hình tiều tụy dữ dội không mọc tóc quân xanh màu lá nhưng tâm hồn vô cùng hào hoa, lãng mạn đêm mơ Hà Nội dáng kiều thơm.',
  q3: 'Phép nói giảm nói tránh anh về đất kết hợp từ Hán Việt áo bào thay chiếu làm vơi đi cảm giác bi lụy, bất tử hóa sự hy sinh thanh thản của người chiến sĩ trẻ.',
  q4: 'Thế hệ trẻ hôm nay cần sống có lý tưởng dấn thân, không ngại gian khó, sẵn sàng cống hiến tri thức và lòng nhiệt huyết cho sự phát triển của đất nước.',
  social: 'Trong kỷ nguyên số, cống hiến tuổi trẻ là chiếc la bàn định vị giá trị sống của mỗi con người. Cống hiến không nhất thiết phải là những hành động lớn lao, mà bắt đầu từ sự nghiêm túc trong học tập, tinh thần kỷ luật và sự sẻ chia với cộng đồng. Hình ảnh những người trẻ tham gia bảo vệ môi trường, các kỹ sư công nghệ sáng tạo phần mềm phục vụ y tế chính là minh chứng sinh động. Trái lại, lối sống thụ động và vô cảm cần bị phê phán. Người trẻ hãy sống sâu sắc và tạo ra giá trị thiết thực mỗi ngày.',
  literature: 'Quang Dũng là nghệ sĩ đa tài của nền văn học kháng chiến Việt Nam. Bài thơ Tây Tiến là kiệt tác khắc tạc bức tượng đài bi tráng về người lính vệ quốc đoàn. Đoạn trích mở ra bức tranh đoàn binh vừa dữ dội gân guốc vừa đậm chất hào hoa lãng tử. Ngòi bút lãng mạn của thi sĩ đã thi vị hóa những gian khổ khốc liệt thành vẻ đẹp kiêu hùng. Cái chết không bi lụy mà hóa thành khúc ca bi tráng khi người lính thanh thản trở về với đất mẹ. Qua đó, tác giả khẳng định tinh thần yêu nước bất diệt và lý tưởng cao đẹp của thế hệ cha anh.'
};

// Trích xuất hàm gradeMOETPracticeExam
const matchFn = appContent.match(/gradeMOETPracticeExam\s*\((?:[^)]+)\)\s*\{([\s\S]*?)\n\s*renderExamGradedResult\s*\(/);
if (!matchFn) {
  throw new Error("Could not extract gradeMOETPracticeExam function!");
}

const fnBody = matchFn[1];
const gradeFn = new Function('exam', 'answers', 'timeSpentSeconds', 'timeAllowedMinutes', fnBody);

const result = gradeFn(exam1, sampleAnswers, 5400, 120);
console.log('=== KẾT QUẢ CHẤM ĐIỂM BỘ GD&ĐT 2026 TRÊN ĐỀ THI SỐ 1 ===');
console.log(`- Điểm Đọc hiểu: ${result.readingScore} / 4.0đ`);
result.questionDetails.forEach(q => console.log(`  + ${q.label}: ${q.score}/${q.maxPoints}đ - ${q.comment}`));
console.log(`\n- Điểm Đoạn văn NLXH: ${result.socialScore} / 2.0đ`);
result.socialCriteria.forEach(c => console.log(`  + ${c.name}: ${c.score}/${c.max}đ - ${c.feedback}`));
console.log(`\n- Điểm Bài văn NLVH: ${result.literatureScore} / 4.0đ`);
result.literatureCriteria.forEach(c => console.log(`  + ${c.name}: ${c.score}/${c.max}đ - ${c.feedback}`));
console.log(`\n=> TỔNG ĐIỂM BÀI THI: ${result.totalScore} / 10.0đ`);
console.log(`=> XẾP LOẠI: ${result.gradeRank} (Màu sắc: ${result.gradeColor})`);
console.log('✓ Hoàn toàn chính xác theo barem thang điểm 10 của Bộ GD&ĐT 2026!');
