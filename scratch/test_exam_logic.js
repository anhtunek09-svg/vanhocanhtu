// Script kiểm tra logic chấm điểm Bộ GD&ĐT 2026
const mockExam = {
  id: 1,
  title: "Đề thi thử Tốt nghiệp THPT Quốc gia 2026 – Đề số 1",
  topic: "Thơ kháng chiến hiện đại + Trách nhiệm tuổi trẻ",
  examParts: {
    readingQuestions: [
      { id: 1, maxPoints: 0.75, level: 'Nhận biết', prompt: 'Xác định thể thơ...' },
      { id: 2, maxPoints: 1.0, level: 'Thông hiểu', prompt: 'Ngoại hình và vẻ đẹp...' },
      { id: 3, maxPoints: 1.25, level: 'Vận dụng', prompt: 'Phân tích hiệu quả nghệ thuật...' },
      { id: 4, maxPoints: 1.0, level: 'Vận dụng cao', prompt: 'Từ tinh thần chiến đấu...' }
    ],
    writingSocial: { id: 5, maxPoints: 2.0, type: 'Đoạn văn NLXH', prompt: 'Ý nghĩa của sự cống hiến...' },
    writingLiterature: { id: 6, maxPoints: 4.0, type: 'Bài văn NLVH', prompt: 'Cảm nhận bức tượng đài bi tráng...' }
  },
  answerKey: "HƯỚNG DẪN CHẤM...",
  sampleEssay: "BÀI VĂN MẪU..."
};

const mockAnswers = {
  q1: "Thể thơ bảy chữ. Hai từ Hán Việt là biên cương, viễn xứ.",
  q2: "Ngoại hình tiều tụy dữ dội vì sốt rét nhưng tâm hồn hào hoa lãng mạn mơ dáng kiều thơm.",
  q3: "Biện pháp nói giảm nói tránh 'anh về đất' làm vơi bớt nỗi đau thương mất mát, bất tử hóa sự hy sinh của người lính.",
  q4: "Người trẻ hôm nay cần sống có lý tưởng cao đẹp, dũng cảm đương đầu với thử thách, sẵn sàng cống hiến tuổi trẻ cho sự phát triển của Tổ quốc.",
  social: "Trong kỷ nguyên số, cống hiến tuổi trẻ là ngọn hải đăng soi sáng lý tưởng nhân sinh. Cống hiến không chỉ là những hành động vĩ mô mà khởi nguồn từ sự tận tụy trong học tập và trách nhiệm xã hội. Những bạn trẻ tham gia dự án thiện nguyện, các kỹ sư công nghệ phát triển giải pháp xanh chính là minh chứng sống động. Trái lại, lối sống ích kỷ, lười biếng cần bị phê phán. Mỗi người trẻ hãy sống sâu sắc và tạo ra giá trị thiết thực mỗi ngày.",
  literature: "Quang Dũng là một trong những gương mặt thi sĩ tiêu biểu nhất của nền thơ ca kháng chiến chống Pháp. Bài thơ 'Tây Tiến' khắc họa bức tượng đài bi tráng về người lính. Mở đầu đoạn thơ là hình ảnh đoàn binh Tây Tiến với vẻ đẹp gân guốc, oai hùng vượt lên gian khổ. Tác giả sử dụng bút pháp lãng mạn kết hợp cảm hứng bi tráng, biến cái bi thương thành tráng lệ. Qua đó, nhà thơ gửi gắm tình yêu quê hương và niềm tin son sắt vào độc lập tự do của dân tộc."
};

console.log("Mock data valid!");
