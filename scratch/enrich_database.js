// ============================================================
// VĂN 12 PRO LAB — ENRICHED & PARAPHRASED DATABASE BUILDER
// Tránh đạo văn, nâng tầm câu từ học thuật, chuẩn xác 100% theo tác phẩm
// ============================================================

const fs = require('fs');
const path = require('path');

// 1. COMPARATIVE LITERARY TOPICS (So sánh văn học nâng cao điểm 8-9+)
const COMPARISONS_DATA = [
  {
    id: 'song-da-vs-song-huong',
    title: 'Vẻ đẹp hai dòng sông: Sông Đà (Nguyễn Tuân) và Sông Hương (Hoàng Phủ Ngọc Tường)',
    workA: 'Người lái đò Sông Đà',
    authorA: 'Nguyễn Tuân',
    workB: 'Ai đã đặt tên cho dòng sông?',
    authorB: 'Hoàng Phủ Ngọc Tường',
    similarity: [
      'Cả hai tác phẩm đều là những kiệt tác đỉnh cao của thể loại văn xuôi ký – tùy bút hiện đại Việt Nam, khắc họa bức tranh non sông gấm vóc bằng ngòi bút tài hoa và tình yêu quê hương xứ sở tha thiết.',
      'Cả Sông Đà và Sông Hương đều được cá thể hóa, nhân hóa như những sinh thể sống động mang tâm hồn, tính cách và số phận độc đáo riêng biệt, vượt thoát khỏi mô tả địa lý thuần túy.',
      'Hai nhà văn đều vận dụng vốn tri thức liên ngành uyên bác (lịch sử, địa lý, thi ca, hội họa, điện ảnh) để khám phá đối tượng thẩm mỹ ở chiều sâu văn hóa và nghệ thuật.'
    ],
    differenceA: {
      heading: 'Sông Đà (Nguyễn Tuân) — Vẻ đẹp Kỳ vĩ, Dữ dội, Gai góc và Thơ mộng',
      points: [
        'Tính cách lưỡng diện đối lập sâu sắc: Một bên là diện mạo hung bạo, dữ dằn của đá bờ sông dựng vách thành, hút nước xoáy tít ghê rợn, trùng vi thạch trận hiểm ác; một bên là vẻ thơ mộng trữ tình với dòng chảy êm đềm, sắc nước biến ảo theo mùa và bờ bãi cổ tích.',
        'Sông Đà được tạo dựng như một "kẻ thù số một" đầy mưu mô, hiểm độc nhằm tôn vinh bản lĩnh, trí dũng phi thường và phẩm chất người nghệ sĩ chèo đò của người lao động mới.',
        'Văn phong góc cạnh, sắc bén, câu chữ gân guốc, vận dụng nhịp điệu dồn dập của ngôn từ quân sự, võ thuật và nghệ thuật tạo hình điện ảnh.'
      ]
    },
    differenceB: {
      heading: 'Sông Hương (Hoàng Phủ Ngọc Tường) — Vẻ đẹp Trầm mặc, Dịu dàng, Mê đắm và Trầm tích Văn hóa',
      points: [
        'Dòng sông của cái đẹp trữ tình, thơ mộng, gắn liền máu thịt với mảnh đất và tâm hồn xứ Huế mộng mơ qua các khúc biến tấu: cô gái Di-gan phóng khoáng giữa đại ngàn, người mẹ phù sa bao dung, người tình dịu dàng e ấp tìm về người tình trong mộng (thành phố Huế).',
        'Sông Hương được soi chiếu dưới góc nhìn lịch sử, thi ca và âm nhạc dân gian, mang dáng dấp của bản tình ca thủy chung son sắt và bề dày văn hóa cố đô trầm mặc.',
        'Văn phong mềm mại, mượt mà, giàu nhạc điệu, câu văn trải dài thi vị, hòa quyện giữa chất triết luận trầm sâu và cảm quan duy mỹ tinh tế.'
      ]
    },
    conclusion: 'Sự khác biệt bắt nguồn từ sự phân hóa về đối tượng cảnh sắc (miền Tây Bắc hiểm trở hoang sơ vs xứ Huế cổ kính trầm mặc) cùng cá tính sáng tạo độc đáo của mỗi tác giả: Nguyễn Tuân là người lữ khách suốt đời khao khát cái đẹp tuyệt đối ở mức tột cùng mãnh liệt, trong khi Hoàng Phủ Ngọc Tường là người con tri âm trọn đời đắm say trong chất thơ và bề dày trầm tích văn hóa của quê hương xứ Huế.'
  },
  {
    id: 'mi-vs-thi',
    title: 'Vẻ đẹp tâm hồn và khát vọng sống: Nhân vật Mị (Vợ chồng A Phủ) và Thị (Vợ nhặt)',
    workA: 'Vợ chồng A Phủ (Nhân vật Mị)',
    authorA: 'Tô Hoài',
    workB: 'Vợ nhặt (Nhân vật Thị)',
    authorB: 'Kim Lân',
    similarity: [
      'Cả Mị và Thị đều là những người phụ nữ nghèo khổ dưới đáy xã hội cũ, nạn nhân trực tiếp của cường quyền phong kiến và thảm họa nạn đói khủng khiếp năm 1945.',
      'Dù bị hoàn cảnh vùi dập và tước đoạt quyền sống, sâu thẳm trong tâm hồn họ vẫn âm ỉ ngọn lửa của sức sống tiềm tàng và khát vọng hạnh phúc mãnh liệt không gì dập tắt nổi.',
      'Cả hai nhân vật đều trải qua quá trình hồi sinh kỳ diệu: được thức tỉnh bởi tình người, tình thương và chủ động tìm đường vượt thoát khỏi bóng tối để hướng về tương lai ánh sáng.'
    ],
    differenceA: {
      heading: 'Nhân vật Mị (Vợ chồng A Phủ) — Sự trỗi dậy của sức sống quật khởi',
      points: [
        'Bi kịch thân phận: Làm dâu gạt nợ, bị đày đọa thể xác và trói buộc tinh thần bởi thần quyền ma quỷ nhà thống lí Pá Tra, sống cam chịu trơ lì như "con rùa nuôi trong xó cửa".',
        'Sự hồi sinh diễn ra qua các chặng tâm lý phức tạp: từ sự thức tỉnh trong đêm tình mùa xuân theo tiếng sáo gọi bạn, đến sự đồng cảm tột độ khi nhìn thấy giọt nước mắt A Phủ, dẫn tới hành động cởi trói cứu người và tự giải thoát đầy quả cảm.',
        'Bút pháp nghệ thuật: Tô Hoài đi sâu miêu tả diễn biến tâm lý nội tâm tinh vi, kết hợp phong vị phong tục Tây Bắc giàu chất thơ và đậm khuynh hướng hiện thực nhân đạo.'
      ]
    },
    differenceB: {
      heading: 'Nhân vật Thị (Vợ nhặt) — Sự hồi sinh của thiên tính nữ và tình mẫu tử',
      points: [
        'Bi kịch thân phận: Nạn nhân trần trụi của nạn đói năm Ất Dậu, bị cái đói bóp nghẹt cả tên tuổi, dung nhan xơ xác, tính cách trở nên chao chát, chỏng lỏn vì miếng ăn.',
        'Sự hồi sinh bừng nở khi tìm được bến đỗ gia đình: từ người đàn bà liều lĩnh theo không về làm vợ, Thị nhanh chóng chuyển hóa thành người dâu hiền, vợ thảo, ý tứ, vun vén nếp nhà và gieo niềm hy vọng đổi đời với hình ảnh lá cờ đỏ sao vàng.',
        'Bút pháp nghệ thuật: Kim Lân sử dụng tình huống truyện độc đáo "nhặt vợ", ngôn ngữ mộc mạc đậm chất khẩu ngữ nông thôn Bắc Bộ và ngòi bút đôn hậu, thấm đẫm tình người ấm áp.'
      ]
    },
    conclusion: 'Cả hai tác phẩm đều thể hiện tư tưởng nhân đạo sâu sắc của văn xuôi hiện đại Việt Nam: khẳng định dù trong nghịch cảnh tăm tối nhất, phẩm giá và sức sống của người phụ nữ vẫn ngời sáng, sẵn sàng vượt lên số phận để kiếm tìm tự do và hạnh phúc đích thực.'
  },
  {
    id: 'linh-tay-tien-vs-linh-dong-chi',
    title: 'Hình tượng người lính kháng chiến: Tây Tiến (Quang Dũng) và Đồng chí (Chính Hữu)',
    workA: 'Tây Tiến (Quang Dũng)',
    authorA: 'Quang Dũng',
    workB: 'Đồng chí (Chính Hữu)',
    authorB: 'Chính Hữu',
    similarity: [
      'Đều khắc họa chân thực và xúc động tượng đài người lính vệ quốc trong những năm đầu kháng chiến chống thực dân Pháp gian khổ, thiếu thốn.',
      'Đều ngời sáng lý tưởng chiến đấu cao đẹp vì độc lập tự do của Tổ quốc và tinh thần dũng cảm, coi thường gian lao thử thách.',
      'Tình đồng đội đồng chí gắn bó keo sơn, cùng chia ngọt sẻ bùi giữa chiến trường khốc liệt là điểm tựa tinh thần vững chắc nhất cho người lính.'
    ],
    differenceA: {
      heading: 'Lính Tây Tiến (Quang Dũng) — Vẻ đẹp Hào hoa, Lãng mạn và Bi tráng',
      points: [
        'Xuất thân: Đa phần là thanh niên, học sinh, trí thức Hà thành mang tâm hồn lãng tử hào hoa, bước vào cuộc chiến với khí phách trượng phu cổ điển.',
        'Vẻ đẹp hình tượng: Ngoại hình khác thường dữ dội ("không mọc tóc", "dữ oai hùm"), tâm hồn mộng mơ ("đêm mơ Hà Nội dáng kiều thơm"), lý tưởng cống hiến ngang tàng ("chiến trường đi chẳng tiếc đời xanh").',
        'Bút pháp: Cảm hứng lãng mạn kết hợp âm hưởng bi tráng, ngôn từ Hán Việt cổ kính ("áo bào", "biên cương", "viễn xứ", "độc hành") tôn vinh sự hy sinh lên tầm sử thi vũ trụ.'
      ]
    },
    differenceB: {
      heading: 'Lính Đồng chí (Chính Hữu) — Vẻ đẹp Mộc mạc, Bình dị và Hiện thực',
      points: [
        'Xuất thân: Những người nông dân nghèo khó từ các miền quê "nước mặn đồng chua", "đất cày lên sỏi đá", rời lũy tre xanh cầm súng bảo vệ quê hương.',
        'Vẻ đẹp hình tượng: Mộc mạc, chân chất, cùng san sẻ những cơn sốt rét rừng rét buốt, manh áo rách vai, nụ cười buốt giá giữa đêm đông hoang vắng ("Đầu súng trăng treo").',
        'Bút pháp: Hiện thực nghiêm ngặt, ngôn ngữ chắt lọc, hàm súc, mộc mạc đậm phong vị ca dao thôn quê, giàu tính khái quát biểu tượng.'
      ]
    },
    conclusion: 'Hai bức tượng đài nghệ thuật bổ sung cho nhau, tạo nên diện mạo hoàn chỉnh và phong phú về chân dung anh bộ đội Cụ Hồ thời kỳ chống Pháp: vừa mộc mạc chân chất như cội rễ đồng quê, vừa hào hoa bi tráng như khí phách kinh kỳ ngàn năm văn hiến.'
  }
];

// 2. EXPRESSION MODES DATA (6 Phương thức biểu đạt chuyên sâu)
const EXPRESSION_MODES_DATA = [
  {
    id: 'bieu-cam',
    name: 'Phương thức Biểu cảm',
    badge: 'Trọng tâm Thơ 12',
    purpose: 'Bộc lộ trực tiếp hoặc gián tiếp tình cảm, cảm xúc, nỗi nhớ thương, niềm tự hào và thái độ của chủ thể trữ tình trước con người, thiên nhiên và cuộc đời.',
    recognitionSigns: [
      'Xuất hiện mật độ cao từ ngữ chỉ cảm xúc: nhớ, thương, ôi, xiết bao, đau đớn, trăn trở, thiết tha...',
      'Thường dùng thể thơ (lục bát, thất ngôn, ngũ ngôn, tự do) hoặc các đoạn văn tùy bút, bút ký trữ tình đậm chất cái tôi.',
      'Sử dụng nhiều câu cảm thán, câu hỏi tu từ, điệp ngữ, điệp cấu trúc và ẩn dụ chuyển đổi cảm giác.'
    ],
    commonGenres: ['Thơ trữ tình', 'Trường ca', 'Tùy bút', 'Bút ký trữ tình'],
    grade12Examples: [
      'Tây Tiến (Quang Dũng) — Biểu cảm nỗi nhớ Tây Bắc hào hoa, bi tráng của người lính',
      'Việt Bắc (Tố Hữu) — Biểu cảm nghĩa tình cách mạng thủy chung son sắt qua khúc hát đối đáp',
      'Sóng (Xuân Quỳnh) — Biểu cảm khát vọng tình yêu nồng nàn, đằm thắm nữ tính',
      'Vội vàng (Xuân Diệu) — Biểu cảm niềm khát khao giao cảm trần thế và nỗi tiếc nuối thời gian'
    ],
    examTip: 'Nếu ngữ liệu Đọc hiểu là một bài thơ hoặc đoạn thơ trữ tình, phương thức biểu đạt chính chắc chắn là BIỂU CẢM (trừ thơ tự sự kể chuyện). Khi đề hỏi "các phương thức biểu đạt", thường trả lời: Biểu cảm kết hợp Miêu tả và Tự sự.'
  },
  {
    id: 'tu-su',
    name: 'Phương thức Tự sự',
    badge: 'Trọng tâm Truyện & Kịch',
    purpose: 'Trình bày một chuỗi các sự việc, hành động, biến cố có khởi đầu, diễn biến, cao trào và kết thúc nhằm khắc họa tính cách nhân vật và gửi gắm tư tưởng nhân sinh.',
    recognitionSigns: [
      'Có cốt truyện, sự kiện cụ thể, tình huống xung đột và mạch thời gian phát triển rõ ràng.',
      'Có hệ thống nhân vật với ngoại hình, hành động, lời thoại đối thoại và độc thoại nội tâm.',
      'Có người kể chuyện (ngôi thứ nhất xưng "tôi" hoặc ngôi thứ ba giấu mình bao quát).'
    ],
    commonGenres: ['Truyện ngắn', 'Tiểu thuyết', 'Kịch bản văn học', 'Ký sự', 'Truyện truyền kỳ'],
    grade12Examples: [
      'Xuân Tóc Đỏ cứu quốc (Vũ Trọng Phụng) — Tự sự trào phúng xoay quanh trận đấu quần vợt',
      'Muối của rừng (Nguyễn Huy Thiệp) — Tự sự hành trình đi săn và thức tỉnh lương tri của ông Diểu',
      'Hải khẩu linh từ (Đoàn Thị Điểm) — Tự sự truyền kỳ đan xen lịch sử và yếu tố kì ảo',
      'Trở về (Ernest Hemingway) — Tự sự về cuộc cập bến và giấc mơ của ông lão Santiago'
    ],
    examTip: 'Trong các đoạn trích truyện ngắn, tiểu thuyết, truyện ký, phương thức biểu đạt chính luôn là TỰ SỰ; các phương thức phụ trợ kết hợp thường là Miêu tả (ngoại cảnh, tâm lý) và Biểu cảm.'
  },
  {
    id: 'nghi-luan',
    name: 'Phương thức Nghị luận',
    badge: 'Trọng tâm Chính luận & Đọc hiểu',
    purpose: 'Dùng hệ thống luận điểm, lý lẽ chặt chẽ và dẫn chứng thực tế thuyết phục để bàn bạc, chứng minh, giải thích hoặc thuyết phục người đọc về một tư tưởng, đạo lý hay hiện tượng đời sống.',
    recognitionSigns: [
      'Có luận đề rõ ràng, các luận điểm phân minh bằng câu khẳng định, phủ định dứt khoát.',
      'Sử dụng các từ nối logic lập luận: bởi vì, do đó, tuy nhiên, trước hết, tóm lại, thật vậy...',
      'Vận dụng nhuần nhuyễn các thao tác lập luận: giải thích, phân tích, chứng minh, bình luận, bác bỏ, so sánh.'
    ],
    commonGenres: ['Tuyên ngôn chính trị', 'Tiểu luận phê bình', 'Văn chính luận', 'Bài phát biểu xã luận'],
    grade12Examples: [
      'Tuyên ngôn Độc lập (Hồ Chí Minh) — Áng văn chính luận mẫu mực bậc thầy',
      'Nhìn về vốn văn hóa dân tộc (Trần Đình Hượu) — Nghị luận văn hóa khách quan, sâu sắc',
      'Năng lực sáng tạo (Phan Đình Diệu) — Nghị luận khoa học khúc chiết, thời sự',
      'Mấy ý nghĩ về thơ (Nguyễn Đình Thi) — Tiểu luận phê bình nghệ thuật sâu sắc'
    ],
    examTip: 'Các văn bản bàn luận về kỹ năng sống, thái độ ứng xử, đạo lý, lòng biết ơn trong Phần I Đọc hiểu (3.0 điểm) có phương thức biểu đạt chính là NGHỊ LUẬN.'
  },
  {
    id: 'mieu-ta',
    name: 'Phương thức Miêu tả',
    badge: 'Phương thức kết hợp đắt giá',
    purpose: 'Dùng từ ngữ tạo hình, âm thanh, màu sắc, đường nét để tái hiện sinh động diện mạo của cảnh vật, con người, giúp người đọc hình dung như đang hiện ra trước mắt.',
    recognitionSigns: [
      'Mật độ tính từ chỉ màu sắc, hình khối, trạng thái và từ láy tượng hình, tượng thanh dày đặc.',
      'Khai thác đa giác quan: thị giác, thính giác, xúc giác, khứu giác, vị giác.',
      'Thường đi kèm làm nền cho Tự sự trong truyện hoặc làm chất liệu cho Biểu cảm trong thơ.'
    ],
    commonGenres: ['Đoạn văn tả cảnh / tả người trong truyện', 'Tùy bút cảnh sắc', 'Bút ký'],
    grade12Examples: [
      'Đoạn tả cảnh thiên nhiên Tây Bắc hùng vĩ hiểm trở trong "Tây Tiến" (Quang Dũng)',
      'Miêu tả thao tác băm thịt gà sắc lẹm trong "Nghệ thuật băm thịt gà" (Ngô Tất Tố)',
      'Bức tranh chiều 30 Tết khói hương trầm ấm trong "Mùa lá rụng trong vườn" (Ma Văn Kháng)'
    ],
    examTip: 'Miêu tả hiếm khi là phương thức chính duy nhất trong đề thi tốt nghiệp mà thường đóng vai trò phương thức kết hợp đắc lực, tăng tính gợi hình và sức sống cho tác phẩm.'
  },
  {
    id: 'thuyet-minh',
    name: 'Phương thức Thuyết minh',
    badge: 'Nhận biết văn bản thông tin',
    purpose: 'Cung cấp tri thức khách quan, xác thực, chuẩn mực về đặc điểm, tính chất, nguyên nhân, nguồn gốc hoặc quy trình của sự vật, hiện tượng trong tự nhiên và đời sống.',
    recognitionSigns: [
      'Chứa nhiều số liệu thống kê, mốc thời gian, thuật ngữ khoa học, địa lý, lịch sử chính xác.',
      'Lời văn khách quan, rõ ràng, trung hòa về cảm xúc, trật tự trình bày mạch lạc.',
      'Sử dụng phương pháp định nghĩa, phân loại, giải thích, nêu ví dụ và đưa số liệu cụ thể.'
    ],
    commonGenres: ['Văn bản thông tin', 'Bài báo khoa học', 'Bút ký nhân học thực địa', 'Giới thiệu di tích'],
    grade12Examples: [
      'Pa-ra-ma / Pa-ra-na (Claude Lévi-Strauss) — Dữ liệu địa lý, sinh thái và cư dân Nam Mỹ',
      'Giáo dục khai phóng nhìn từ Đông Kinh Nghĩa Thục (Nguyễn Nam) — Dữ liệu lịch sử giáo dục',
      'Đời muối (Mark Kurlansky) — Tri thức lịch sử, kinh tế, hóa học về hạt muối toàn cầu'
    ],
    examTip: 'Trong chương trình mới 2026 (Bài 8 - Dữ liệu trong văn bản thông tin), phương thức biểu đạt chính của các bài báo cáo, văn bản thông tin chính là THUYẾT MINH.'
  },
  {
    id: 'hanh-chinh',
    name: 'Phương thức Hành chính - Công vụ',
    badge: 'Văn bản quy phạm',
    purpose: 'Truyền đạt ý chí, mệnh lệnh quản lý hoặc nguyện vọng pháp lý giữa Nhà nước với công dân, giữa các cơ quan, tổ chức theo khuôn mẫu pháp quy định sẵn.',
    recognitionSigns: [
      'Bố cục chuẩn mẫu (quốc hiệu, tiêu ngữ, căn cứ pháp lý, điều khoản, người ký, con dấu).',
      'Ngôn ngữ trang nghiêm, đơn nghĩa, mang tính chuẩn xác pháp lý tuyệt đối, không hàm ẩn tu từ.'
    ],
    commonGenres: ['Hiến pháp', 'Nghị định', 'Thông tư', 'Biên bản', 'Công văn', 'Đơn từ'],
    grade12Examples: [
      'Lời tuyên bố pháp lý đanh thép trước thế giới ở phần kết "Tuyên ngôn Độc lập" (Hồ Chí Minh)'
    ],
    examTip: 'Phương thức Hành chính - công vụ không xuất hiện độc lập làm ngữ liệu Đọc hiểu chính trong đề thi THPT, nhưng học sinh cần nắm để nhận diện các yếu tố trích dẫn pháp quy.'
  }
];

// 3. FORMULA EXPRESSIONS (Biểu thức công thức chuẩn chỉ barem Bộ GD&ĐT)
const LITERARY_EXPRESSIONS_FORMULAS = [
  {
    id: 'expr-ptbd',
    category: 'doc-hieu',
    categoryLabel: 'Đọc Hiểu (Câu 1 - 0.75đ)',
    title: 'Biểu Thức Xác Định Phương Thức Biểu Đạt & Thể Thơ Chuẩn Barem',
    expressionFormula: '[Đề hỏi: "chính / chủ yếu" = 01 đáp án duy nhất] | [Đề hỏi: "các / những" = 02 đến 03 đáp án theo thứ tự chi phối]',
    stepByStep: [
      'Bước 1: Đọc kỹ từ khóa hạn định trong đề thi: Đề hỏi "phương thức biểu đạt chính" (chỉ ghi 1) hay "các phương thức biểu đạt" (ghi 2 - 3 phương thức).',
      'Bước 2: Căn cứ đặc trưng thể loại ngữ liệu: Thơ trữ tình -> Biểu cảm; Truyện ngắn, hồi ký, kịch bản -> Tự sự; Văn bản bàn luận tư tưởng đạo lý -> Nghị luận; Văn bản cung cấp dữ liệu khoa học -> Thuyết minh.',
      'Bước 3: Trình bày trọn vẹn trong đúng 1 dòng: "Phương thức biểu đạt chính của đoạn trích là: [Tên phương thức]." Không viết lan man giải thích.'
    ],
    applicationExample: 'Đề hỏi: Xác định phương thức biểu đạt chính của đoạn trích thơ "Vội vàng" (Xuân Diệu). -> Trả lời chuẩn barem: Phương thức biểu đạt chính của đoạn trích là: Biểu cảm.',
    scoreWeight: '0.5 – 0.75 điểm (Ăn trọn điểm trong 30 giây đầu tiên)'
  },
  {
    id: 'expr-bptt',
    category: 'doc-hieu',
    categoryLabel: 'Đọc Hiểu (Câu 3 - 1.0đ)',
    title: 'Biểu Thức Phân Tích Tác Dụng Biện Pháp Tu Từ 3 Tầng (Công thức "Chỉ - Nghĩa - Cảm")',
    expressionFormula: 'Tác dụng BPTT = [Tầng 1: Chỉ diện tên BPTT + Trích từ ngữ cụ thể (0.25đ)] + [Tầng 2: Làm nổi bật nội dung hình tượng + Thái độ tác giả (0.50đ)] + [Tầng 3: Tăng sức gợi hình, gợi cảm và giá trị biểu đạt (0.25đ)]',
    stepByStep: [
      'Tầng 1 (Chỉ diện): Gọi chính xác tên biện pháp tu từ (so sánh, nhân hóa, ẩn dụ, hoán dụ, điệp ngữ, đảo ngữ...) và trích dẫn dẫn chứng từ ngữ cụ thể trong ngoặc kép.',
      'Tầng 2 (Nội dung & Tư tưởng): Biện pháp giúp khắc họa/nhấn mạnh điều gì về đối tượng? Qua đó thể hiện tình cảm, thái độ, sự trân trọng hay phê phán gì của tác giả?',
      'Tầng 3 (Nghệ thuật): Làm cho câu thơ/câu văn giàu nhạc điệu, tăng sức gợi hình gợi cảm, gây ấn tượng thị giác sâu sắc và tạo chiều sâu dư ba cho tác phẩm.'
    ],
    applicationExample: 'Ví dụ câu thơ: "Heo hút cồn mây súng ngửi trời": (1) Biện pháp nhân hóa "súng ngửi trời" và đảo ngữ "heo hút cồn mây". (2) Khắc họa độ cao chót vót, hiểm trở của đèo dốc Tây Bắc; đồng thời làm bật lên nét tinh nghịch, tâm hồn lạc quan yêu đời và tư thế hiên ngang làm chủ vũ trụ của người lính Tây Tiến. (3) Làm cho câu thơ giàu tính tạo hình thẩm mỹ, mang vẻ đẹp lãng mạn bay bổng độc đáo.',
    scoreWeight: '1.0 điểm chuẩn barem chấm thi THPT Quốc gia'
  },
  {
    id: 'expr-nlxh',
    category: 'nlxh',
    categoryLabel: 'Nghị Luận Xã Hội (2.0đ)',
    title: 'Biểu Thức Cấu Trúc Đoạn Văn 200 Chữ "G - B - C - P - R" Không Tách Đoạn',
    expressionFormula: 'Đoạn 200 chữ (01 đoạn duy nhất) = Mở đoạn trực tiếp (1 câu) + Giải thích (1-2 câu) + Bàn luận 3 chiều (6-8 câu) + Dẫn chứng tiêu biểu (2-3 câu) + Phản biện (1-2 câu) + Bài học nhận thức & hành động (2 câu)',
    stepByStep: [
      'G - Giải thích (0.25đ): Nêu ngắn gọn bản chất cốt lõi của vấn đề nghị luận (là gì? biểu hiện ra sao?).',
      'B - Bàn luận (0.75đ): Trả lời câu hỏi "Tại sao?" và phân tích ý nghĩa theo 3 chiều: Đối với sự hoàn thiện nhân cách cá nhân -> Đối với mối quan hệ giữa con người với con người -> Đối với sự phát triển văn minh của cộng đồng/đất nước.',
      'C - Chứng minh (0.25đ): Nêu 01 dẫn chứng người thật việc thật tiêu biểu, có sức lan tỏa thời sự hoặc truyền cảm hứng mạnh mẽ (phân tích dẫn chứng gắn liền với luận điểm, không kể lể dông dài).',
      'P - Phản biện (0.25đ): Mở rộng lật ngược vấn đề, phê phán những biểu hiện lệch lạc trái ngược (thói vô cảm, ích kỷ, ỷ lại, lối sống hời hợt...).',
      'R - Rút bài học (0.25đ): Đúc kết bài học nhận thức (nhận thức được điều gì?) và bài học hành động cụ thể cho bản thân người trẻ hôm nay.'
    ],
    applicationExample: 'Ví dụ đề "Ý nghĩa của lòng dũng cảm khi đối mặt với thất bại": Mở đoạn trực diện -> Giải thích dũng cảm đối mặt thất bại là bản lĩnh nhìn thẳng vào sai lầm -> Bàn luận: thất bại là cơ hội tôi luyện ý chí, mở ra bài học trưởng thành, khẳng định giá trị bản thân -> Dẫn chứng: Nhà khoa học hoặc nhân vật vượt khó -> Phản biện: phê phán kẻ nản lòng, đổ lỗi hoàn cảnh -> Bài học: kiên trì nỗ lực và học cách đứng dậy sau vấp ngã.',
    scoreWeight: '2.0 điểm (Chiếm 20% tổng điểm toàn bài)'
  },
  {
    id: 'expr-nlvh',
    category: 'nlvh',
    categoryLabel: 'Nghị Luận Văn Học (5.0đ)',
    title: 'Biểu Thức Kỹ Thuật Phân Tích Đoạn Trích Điểm 9+ (Đi từ Hình thức sang Nội dung)',
    expressionFormula: 'Luận điểm 9+ = [Dẫn dắt & Xác định vị trí đoạn trích] + [Phân tích chi tiết nghệ thuật, ngôn từ, nhịp điệu] + [Làm sáng tỏ nội dung tư tưởng & vẻ đẹp hình tượng] + [Lồng ghép nhận định lý luận / So sánh đối chiếu mở rộng]',
    stepByStep: [
      'Mở bài & Khái quát (0.75đ - 1.0đ): Dẫn dắt hấp dẫn, giới thiệu tác giả (vị thế, phong cách), tác phẩm (hoàn cảnh sáng tác, xuất xứ), vị trí đoạn trích và trích dẫn đề bài.',
      'Triển khai các Luận điểm thân bài (2.5đ - 3.0đ): Tuyệt đối không diễn xuôi câu chữ mà phải đi từ thủ pháp nghệ thuật (từ ngữ, hình ảnh, nhãn tự, phối thanh, tu từ, giọng điệu) để suy ra chiều sâu nội dung tư tưởng và cảm xúc của nhân vật/tác giả.',
      'Đánh giá đặc sắc Nghệ thuật & Nội dung (0.5đ): Khái quát phong cách tác giả, thể loại, giọng điệu và đóng góp mới mẻ của tác phẩm đối với nền văn học.',
      'Giải quyết Yêu cầu phụ & Mở rộng so sánh (0.5đ - 1.0đ): Trả lời thấu đáo nhận xét nâng cao trong đề thi, liên hệ đối chiếu với một tác phẩm cùng đề tài hoặc lồng ghép 1 nhận định lý luận văn học đắt giá.',
      'Kết bài (0.5đ): Đúc kết lại giá trị vĩnh cửu của tác phẩm và gửi gắm cảm xúc, bài học nhân văn sâu sắc.'
    ],
    applicationExample: 'Khi phân tích đoạn thơ "Tây Tiến", triển khai theo trục: Từ Hán Việt + Phối thanh Bằng/Trắc + Bút pháp đối lập -> Làm bật vẻ đẹp bi tráng & hào hoa của người lính -> Đối chiếu với nét mộc mạc của người nông dân mặc áo lính trong "Đồng chí" (Chính Hữu) -> Lồng nhận định của nhà thơ Vũ Quần Phương.',
    scoreWeight: '5.0 điểm (Chiếm 50% tổng điểm toàn bài thi)'
  }
];

// 4. LITERARY CRITIC QUOTES (Kho nhận định lý luận văn học đắt giá)
const LITERARY_QUOTES = [
  {
    quote: 'Văn học là nhân học — văn chương chân chính muôn đời là câu chuyện về tình thương và phẩm giá con người.',
    author: 'M. Gorki',
    application: 'Dùng cho phần mở bài, đánh giá chiều sâu giá trị nhân đạo trong Vợ chồng A Phủ, Vợ nhặt, Chiếc thuyền ngoài xa, Muối của rừng.'
  },
  {
    quote: 'Thơ là tiếng lòng của một người đi tìm những tâm hồn đồng điệu giữa trần gian.',
    author: 'Tố Hữu',
    application: 'Vận dụng khi phân tích vẻ đẹp cảm xúc trong các thi phẩm trữ tình như Tây Tiến, Việt Bắc, Sóng, Vội vàng.'
  },
  {
    quote: 'Nghệ thuật không phải là ánh trăng lừa dối, không nên là ánh trăng lừa dối; nghệ thuật chỉ có thể là tiếng đau khổ kia thoát ra từ những kiếp lầm than.',
    author: 'Nam Cao',
    application: 'Rất đắt giá khi bình luận về giá trị hiện thực sắc lạnh trong Chiếc thuyền ngoài xa (Nguyễn Minh Châu) hoặc Vợ nhặt (Kim Lân).'
  },
  {
    quote: 'Mỗi công dân có một dạng vân tay, mỗi nhà văn thứ thiệt có một dạng vân chữ.',
    author: 'Lê Đạt',
    application: 'Sử dụng khi phân tích và đánh giá phong cách nghệ thuật độc đáo, không trộn lẫn của Nguyễn Tuân, Quang Dũng hay Vũ Trọng Phụng.'
  },
  {
    quote: 'Chi tiết nhỏ làm nên nhà văn lớn — hạt cát bé nhỏ cũng phản chiếu cả vầng thái dương.',
    author: 'M. Gorki',
    application: 'Dùng khi phân tích các chi tiết nghệ thuật đắt giá: bát cháo cám (Vợ nhặt), giọt nước mắt A Phủ (Vợ chồng A Phủ), hoa tử huyền (Muối của rừng), chiếc cột buồm (Trở về).'
  },
  {
    quote: 'Thơ là rượu của thế gian, cất lên từ men say của tâm hồn và kết tinh từ giọt mồ hôi của người nghệ sĩ.',
    author: 'Huy Cận',
    application: 'Bình luận về vẻ đẹp bay bổng lãng mạn, sự tinh túy ngôn từ trong thơ Mới (Vội vàng) và thơ kháng chiến (Tây Tiến).'
  }
];

// 5. INTRO FORMULAS (3 Công thức mở bài 9+)
const INTRO_FORMULAS = [
  {
    name: 'Công thức 1: Mở bài từ đề tài & dòng chảy văn học',
    pattern: 'Trong dòng chảy bất tận của nền văn học dân tộc, đề tài [Tên đề tài: người lính / tình yêu / người nông dân / khát vọng sống...] luôn là nguồn cảm hứng dạt dào cho bao thế hệ cầm bút. Nếu như [Tác giả khác] đưa người đọc đến với vẻ đẹp [...], thì đến với [Tác giả], ta lại bắt gặp một tiếng nói riêng đầy ấn tượng qua tác phẩm [Tên tác phẩm]...',
    example: 'Trong dòng chảy bất tận của văn học kháng chiến chống Pháp, đề tài người lính luôn là khúc tráng ca chói lọi. Nếu như Chính Hữu tìm về nét đẹp mộc mạc chân chất của người nông dân mặc áo lính trong "Đồng chí", thì Quang Dũng lại tạc nên bức tượng đài bi tráng, hào hoa đầy kiêu hãnh trong tuyệt phẩm "Tây Tiến"...'
  },
  {
    name: 'Công thức 2: Mở bài bằng nhận định lý luận văn học',
    pattern: 'Nhà văn / nhà lý luận [Tên danh nhân] từng đúc kết: "[Câu nhận định]". Thật vậy, giá trị đích thực của một tác phẩm nghệ thuật chính là ở chiều sâu tư tưởng và sự lay động lương tri. Đến với [Tên tác phẩm] của [Tác giả], độc giả không khỏi thổn thức trước...',
    example: 'Đại văn hào M. Gorki từng khẳng định: "Văn học là nhân học". Thật vậy, trang văn chân chính muôn đời là câu chuyện về tình thương và sự tôn vinh phẩm giá con người. Đọc truyện ngắn "Vợ nhặt" của Kim Lân, ta càng thấm thía hơn ngọn lửa tình người ấm áp rực cháy giữa đêm đen đói khát...'
  },
  {
    name: 'Công thức 3: Mở bài từ phong cách tác giả & thời đại',
    pattern: '[Tác giả] là một trong những gương mặt tiêu biểu nhất của nền văn học Việt Nam với phong cách [Đặc trưng phong cách sáng tạo]. Trong toàn bộ sự nghiệp cầm bút của ông/bà, [Tên tác phẩm] được coi là đỉnh cao kết tinh tài năng nghệ thuật và chiều sâu tư tưởng...',
    example: 'Được mệnh danh là bậc thầy của ngôn từ và thể loại tùy bút, Nguyễn Tuân suốt đời là một lữ khách tài hoa đi tìm cái Đẹp tuyệt đối. Tùy bút "Người lái đò Sông Đà" chính là khúc tráng ca trác tuyệt, nơi ngòi bút uyên bác của ông thăng hoa để tôn vinh sự kỳ vĩ của thiên nhiên Tây Bắc và chất vàng mười nơi người lao động...'
  }
];

console.log('Comparative topics, Expression modes, Formulas, Quotes, and Intros defined successfully.');
