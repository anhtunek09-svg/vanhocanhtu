const fs = require('fs');
const { module2Code } = require('./new_app_module2.js');

const dataContent = fs.readFileSync('js/data.js', 'utf8');
const fnData = new Function('window', 'module', dataContent + '\nreturn APP_DATA;');
const appData = fnData({}, {});

const exam1 = appData.practiceExams[0];
const sampleAnswers = {
  q1: 'Thể thơ bảy chữ tự do. Hai từ Hán Việt là biên cương, viễn xứ.',
  q2: 'Đoàn binh Tây Tiến hiện lên với ngoại hình tiều tụy dữ dội không mọc tóc quân xanh màu lá nhưng tâm hồn vô cùng hào hoa, lãng mạn đêm mơ Hà Nội dáng kiều thơm.',
  q3: 'Phép nói giảm nói tránh anh về đất kết hợp từ Hán Việt áo bào thay chiếu làm vơi đi cảm giác bi lụy, bất tử hóa sự hy sinh thanh thản của người chiến sĩ trẻ.',
  q4: 'Thế hệ trẻ hôm nay cần sống có lý tưởng dấn thân, không ngại gian khó, sẵn sàng cống hiến tri thức và lòng nhiệt huyết cho sự phát triển của đất nước.',
  social: 'Trong kỷ nguyên số, cống hiến tuổi trẻ là chiếc la bàn định vị giá trị sống của mỗi con người. Cống hiến không nhất thiết phải là những hành động lớn lao, mà bắt đầu từ sự nghiêm túc trong học tập, tinh thần kỷ luật và sự sẻ chia với cộng đồng. Hình ảnh những người trẻ tham gia bảo vệ môi trường, các kỹ sư công nghệ sáng tạo phần mềm phục vụ y tế chính là minh chứng sinh động. Trái lại, lối sống thụ động và vô cảm cần bị phê phán. Người trẻ hãy sống sâu sắc và tạo ra giá trị thiết thực mỗi ngày.',
  literature: 'Quang Dũng là nghệ sĩ đa tài của nền văn học kháng chiến Việt Nam. Bài thơ Tây Tiến là kiệt tác khắc tạc bức tượng đài bi tráng về người lính vệ quốc đoàn. Đoạn trích mở ra bức tranh đoàn binh vừa dữ dội gân guốc vừa đậm chất hào hoa lãng tử. Ngòi bút lãng mạn của thi sĩ đã thi vị hóa những gian khổ khốc liệt thành vẻ đẹp kiêu hùng. Cái chết không bi lụy mà hóa thành khúc ca bi tráng khi người lính thanh thản trở về với đất mẹ. Qua đó, tác giả khẳng định tinh thần yêu nước bất diệt và lý tưởng cao đẹp của thế hệ cha anh.'
};

const dummyObj = new Function(`
  const obj = {
    ${module2Code}
  };
  return obj;
`)();

const res = dummyObj.gradeMOETPracticeExam(exam1, sampleAnswers, 5400, 120);
console.log('=== KẾT QUẢ CHẤM ĐIỂM BỘ GD&ĐT 2026 TRÊN ĐỀ THI SỐ 1 ===');
console.log(`- Điểm Đọc hiểu: ${res.readingScore.toFixed(2)} / 4.0đ`);
res.questionDetails.forEach(q => console.log(`  + ${q.label}: ${q.score.toFixed(2)}/${q.maxPoints}đ - ${q.comment}`));
console.log(`\n- Điểm Đoạn văn NLXH: ${res.socialScore.toFixed(2)} / 2.0đ`);
res.socialCriteria.forEach(c => console.log(`  + ${c.name}: ${c.score.toFixed(2)}/${c.max}đ - ${c.feedback}`));
console.log(`\n- Điểm Bài văn NLVH: ${res.literatureScore.toFixed(2)} / 4.0đ`);
res.literatureCriteria.forEach(c => console.log(`  + ${c.name}: ${c.score.toFixed(2)}/${c.max}đ - ${c.feedback}`));
console.log(`\n=> TỔNG ĐIỂM BÀI THI: ${res.totalScore.toFixed(2)} / 10.0đ`);
console.log(`=> XẾP LOẠI: ${res.gradeRank} (Màu sắc: ${res.gradeColor})`);
console.log('✓ Thuật toán chấm điểm theo tiêu chí Bộ GD&ĐT 2026 chạy thành công 100%!');
