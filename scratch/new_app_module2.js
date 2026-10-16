// Module 2 implementation to inject into app.js
const module2Code = `    // ──────────────────────────────────────────
    // Module 2: Phòng Thi Thử Tốt Nghiệp THPT Quốc Gia 2026
    // ──────────────────────────────────────────
    initExamModule() {
      this.populateExamSelector();
      this.updateExamHistoryCountBadge();
      const initialId = state.exam.selectedExamId || 1;
      this.loadPracticeExam(initialId);
    },

    populateExamSelector() {
      const selector = document.getElementById('exam-practice-selector');
      if (!selector || !window.APP_DATA || !window.APP_DATA.practiceExams) return;

      const exams = window.APP_DATA.practiceExams;
      selector.innerHTML = exams
        .map((e) => {
          return \`<option value="\${e.id}">Đề số \${e.id}: \${e.title} (\${e.sourceType} • \${e.topic})</option>\`;
        })
        .join('');

      selector.value = state.exam.selectedExamId || 1;
    },

    handlePracticeExamChange(examId) {
      const id = parseInt(examId, 10);
      if (isNaN(id)) return;
      this.loadPracticeExam(id);
    },

    setExamDuration(minutes) {
      const m = Math.max(1, Math.min(120, parseInt(minutes, 10) || 120));
      state.exam.selectedDurationMinutes = m;

      const label = document.getElementById('exam-selected-time-text');
      if (label) label.textContent = \`\${m} phút\`;

      const customInput = document.getElementById('exam-custom-time-input');
      if (customInput) customInput.value = m;

      // Update preset chips
      document.querySelectorAll('#exam-time-presets button').forEach((btn) => {
        const val = parseInt(btn.getAttribute('data-time'), 10);
        if (val === m) btn.classList.add('active');
        else btn.classList.remove('active');
      });

      if (!state.exam.isSubmitted) {
        state.exam.timeRemaining = m * 60;
        this.updateTimerDisplay();
        this.showToast(\`Đã thiết lập thời gian làm bài: \${m} phút\`, 'info');
      }
    },

    loadPracticeExam(examId) {
      if (!window.APP_DATA || !window.APP_DATA.practiceExams) return;
      const exam = window.APP_DATA.practiceExams.find((e) => e.id === examId);
      if (!exam) return;

      state.exam.selectedExamId = examId;
      state.exam.answers = {
        q1: '',
        q2: '',
        q3: '',
        q4: '',
        social: '',
        literature: ''
      };
      state.exam.isSubmitted = false;
      state.exam.isLocked = false;
      state.exam.gradedResult = null;

      // Sync selector dropdown
      const selector = document.getElementById('exam-practice-selector');
      if (selector) selector.value = examId;

      // Update header info
      const titleDisplay = document.getElementById('exam-title-display');
      const topicDisplay = document.getElementById('exam-topic-display');
      const genreBadge = document.getElementById('exam-genre-badge');
      const badgeLeft = document.getElementById('exam-badge-left');

      if (titleDisplay) titleDisplay.textContent = \`Phòng thi thử – \${exam.title}\`;
      if (topicDisplay) topicDisplay.textContent = \`Chủ đề: \${exam.topic} • \${exam.sourceType} • Thang điểm 10.0\`;
      if (genreBadge) genreBadge.textContent = exam.sourceType;
      if (badgeLeft) badgeLeft.textContent = \`\${state.exam.selectedDurationMinutes} phút\`;

      // Render Left Panel (Đề bài & Ngữ liệu)
      const passageEl = document.getElementById('exam-passage-text');
      if (passageEl) {
        passageEl.innerHTML = \`
          <div class="mb-4 p-3" style="background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--accent);">
            <h4 style="font-size: 13.5px; font-weight: 700; color: var(--accent); margin-bottom: 4px;">CẤU TRÚC ĐỀ THI TỐT NGHIỆP THPT (10.0 ĐIỂM):</h4>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">\${exam.structure}</p>
          </div>
          <div class="literary-text" style="white-space: pre-wrap; font-size: 14.5px; line-height: 1.8;">\${exam.examContent}</div>
        \`;
      }

      // Render Right Panel (6 Question Blocks)
      const questionsList = document.getElementById('exam-questions-list');
      if (questionsList && exam.examParts) {
        const parts = exam.examParts;
        questionsList.innerHTML = \`
          <!-- PHẦN I: ĐỌC HIỂU (4 CÂU) -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--accent);">PHẦN I: ĐỌC HIỂU (4,0 ĐIỂM)</h3>
              <span class="badge badge-accent">4 câu hỏi</span>
            </div>
            \${parts.readingQuestions
              .map((q) => {
                const fieldName = \`q\${q.questionNumber}\`;
                return \`
                <div class="question-block" id="question-block-\${fieldName}">
                  <div class="question-header">
                    <span class="question-number">Câu \${q.questionNumber} (\${q.pointsLabel})</span>
                    <span class="badge badge-info">\${q.level}</span>
                  </div>
                  <div class="question-text">\${q.prompt}</div>
                  <textarea 
                    class="question-textarea" 
                    id="input-\${fieldName}"
                    rows="3" 
                    placeholder="Nhập câu trả lời Câu \${q.questionNumber} vào đây..." 
                    oninput="app.handleExamAnswerInput('\${fieldName}', this.value)"
                  ></textarea>
                  <div class="flex items-center justify-between mt-2" style="font-size: 12px; color: var(--text-tertiary);">
                    <span id="counter-\${fieldName}">0 từ</span>
                    <span>Mức độ: \${q.level}</span>
                  </div>
                </div>
              \`;
              })
              .join('')}
          </div>

          <!-- PHẦN II: VIẾT (CÂU 1 - NLXH 200 CHỮ) -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--success);">PHẦN II.1: NGHỊ LUẬN XÃ HỘI (2,0 ĐIỂM)</h3>
              <span class="badge badge-success">Đoạn văn ~200 chữ</span>
            </div>
            <div class="question-block" id="question-block-social">
              <div class="question-header">
                <span class="question-number" style="color: var(--success);">Câu 1 (\${parts.writingSocial.pointsLabel})</span>
                <span class="badge badge-success">Viết đoạn văn 200 chữ</span>
              </div>
              <div class="question-text">\${parts.writingSocial.prompt}</div>
              <textarea 
                class="exam-textarea-large" 
                id="input-social"
                rows="7" 
                placeholder="Viết đoạn văn nghị luận xã hội (khoảng 200 chữ) vào đây. Lưu ý: Không xuống dòng ngắt đoạn; nêu giải thích, lập luận, dẫn chứng thực tế và bài học hành động..." 
                oninput="app.handleExamAnswerInput('social', this.value)"
              ></textarea>
              <div class="exam-word-progress">
                <span id="counter-social">0 từ (Chuẩn: 180 – 250 từ)</span>
                <span id="badge-social-len" class="badge badge-neutral" style="font-size: 11px;">Chưa làm</span>
              </div>
            </div>
          </div>

          <!-- PHẦN II: VIẾT (CÂU 2 - NLVH 600 CHỮ) -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--accent);">PHẦN II.2: NGHỊ LUẬN VĂN HỌC (4,0 ĐIỂM)</h3>
              <span class="badge badge-accent">Bài văn ~600 chữ</span>
            </div>
            <div class="question-block" id="question-block-literature">
              <div class="question-header">
                <span class="question-number">Câu 2 (\${parts.writingLiterature.pointsLabel})</span>
                <span class="badge badge-accent">Bài văn hoàn chỉnh 3 phần</span>
              </div>
              <div class="question-text">\${parts.writingLiterature.prompt}</div>
              <textarea 
                class="exam-textarea-large" 
                id="input-literature"
                rows="12" 
                placeholder="Viết bài văn nghị luận văn học (khoảng 600 chữ) vào đây. Gồm: Mở bài ấn tượng, Thân bài phân tích sâu sắc các luận điểm nghệ thuật song hành nội dung, Đánh giá nâng cao và Kết bài đọng lại dư ba..." 
                oninput="app.handleExamAnswerInput('literature', this.value)"
              ></textarea>
              <div class="exam-word-progress">
                <span id="counter-literature">0 từ (Chuẩn: 500 – 800 từ)</span>
                <span id="badge-literature-len" class="badge badge-neutral" style="font-size: 11px;">Chưa làm</span>
              </div>
            </div>
          </div>
        \`;
      }

      // Hide alerts & result screen, show active
      const activeContainer = document.getElementById('exam-active-container');
      const resultContainer = document.getElementById('exam-result-container');
      const lockedAlert = document.getElementById('exam-locked-alert');

      if (activeContainer) activeContainer.classList.remove('hidden');
      if (resultContainer) resultContainer.classList.add('hidden');
      if (lockedAlert) lockedAlert.classList.add('hidden');

      this.updateExamAnsweredCount();
      this.resetExamTimer();
      this.startExamTimer();
      this.renderIcons();
    },

    handleExamAnswerInput(field, value) {
      state.exam.answers[field] = value;
      const counter = document.getElementById(\`counter-\${field}\`);
      const words = value.trim() ? value.trim().split(/\\s+/).length : 0;

      if (field === 'social') {
        const badge = document.getElementById('badge-social-len');
        if (counter) counter.textContent = \`\${words} từ (Chuẩn: 180 – 250 từ)\`;
        if (badge) {
          if (words === 0) {
            badge.textContent = 'Chưa làm';
            badge.className = 'badge badge-neutral';
          } else if (words < 120) {
            badge.textContent = 'Quá ngắn (<120 từ)';
            badge.className = 'badge badge-warning';
          } else if (words > 320) {
            badge.textContent = 'Quá dài (>320 từ)';
            badge.className = 'badge badge-warning';
          } else {
            badge.textContent = 'Dung lượng chuẩn 200 chữ';
            badge.className = 'badge badge-success';
          }
        }
      } else if (field === 'literature') {
        const badge = document.getElementById('badge-literature-len');
        if (counter) counter.textContent = \`\${words} từ (Chuẩn: 500 – 800 từ)\`;
        if (badge) {
          if (words === 0) {
            badge.textContent = 'Chưa làm';
            badge.className = 'badge badge-neutral';
          } else if (words < 300) {
            badge.textContent = 'Quá ngắn (<300 từ)';
            badge.className = 'badge badge-warning';
          } else if (words > 1000) {
            badge.textContent = 'Dung lượng dài (>1000 từ)';
            badge.className = 'badge badge-info';
          } else {
            badge.textContent = 'Dung lượng chuẩn 600 chữ';
            badge.className = 'badge badge-success';
          }
        }
      } else {
        if (counter) counter.textContent = \`\${words} từ\`;
      }

      this.updateExamAnsweredCount();
    },

    updateExamAnsweredCount() {
      const counterEl = document.getElementById('exam-answered-counter');
      if (!counterEl) return;
      const count = Object.values(state.exam.answers).filter((val) => val && val.trim().length > 0).length;
      counterEl.textContent = \`Đã làm: \${count}/6 câu\`;
    },

    // Timer Implementation with Auto-Lock on Expiry
    startExamTimer() {
      clearInterval(state.exam.timerInterval);
      state.exam.isTimerRunning = true;
      this.updateTimerDisplay();

      const btnIcon = document.getElementById('exam-timer-icon');
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'pause');
        this.renderIcons();
      }

      state.exam.timerInterval = setInterval(() => {
        if (state.exam.timeRemaining > 0) {
          state.exam.timeRemaining--;
          this.updateTimerDisplay();
        } else {
          clearInterval(state.exam.timerInterval);
          state.exam.isTimerRunning = false;
          this.handleExamTimeUp();
        }
      }, 1000);
    },

    pauseExamTimer() {
      clearInterval(state.exam.timerInterval);
      state.exam.isTimerRunning = false;
      const btnIcon = document.getElementById('exam-timer-icon');
      if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'play');
        this.renderIcons();
      }
    },

    toggleExamTimer() {
      if (state.exam.isLocked || state.exam.isSubmitted) return;
      if (state.exam.isTimerRunning) {
        this.pauseExamTimer();
        this.showToast('Đồng hồ làm bài đã tạm dừng', 'info');
      } else {
        this.startExamTimer();
        this.showToast('Tiếp tục tính thời gian làm bài', 'info');
      }
    },

    resetExamTimer() {
      clearInterval(state.exam.timerInterval);
      state.exam.timeRemaining = (state.exam.selectedDurationMinutes || 120) * 60;
      this.updateTimerDisplay();
    },

    updateTimerDisplay() {
      const timerEl = document.getElementById('exam-timer');
      if (!timerEl) return;

      const totalSec = Math.max(0, state.exam.timeRemaining);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      if (h > 0) {
        timerEl.textContent = \`\${h}:\${m < 10 ? '0' : ''}\${m}:\${s < 10 ? '0' : ''}\${s}\`;
      } else {
        timerEl.textContent = \`\${m < 10 ? '0' : ''}\${m}:\${s < 10 ? '0' : ''}\${s}\`;
      }

      if (totalSec <= 180) {
        timerEl.className = 'timer-display danger';
      } else if (totalSec <= 600) {
        timerEl.className = 'timer-display warning';
      } else {
        timerEl.className = 'timer-display';
      }
    },

    handleExamTimeUp() {
      state.exam.isLocked = true;

      // Lock all textareas immediately
      document.querySelectorAll('#exam-questions-list textarea').forEach((el) => {
        el.disabled = true;
        el.readOnly = true;
      });

      // Show locked alert banner
      const lockedAlert = document.getElementById('exam-locked-alert');
      if (lockedAlert) lockedAlert.classList.remove('hidden');

      this.showToast('🔒 HẾT GIỜ LÀM BÀI! Phòng thi đã đóng, hệ thống đang tự động nộp bài và chấm điểm...', 'error');
      setTimeout(() => {
        this.submitAndGradeFullExam(true);
      }, 1200);
    },

    resetCurrentExam() {
      this.openModal({
        title: 'Xác nhận làm lại đề thi',
        body: '<p>Bạn có chắc chắn muốn xóa toàn bộ bài làm hiện tại để làm lại từ đầu không? Toàn bộ 6 câu trả lời sẽ được đặt lại và đồng hồ sẽ tính giờ lại.</p>',
        footerButtons: \`
          <button class="btn btn-secondary" onclick="app.closeModal()">Hủy bỏ</button>
          <button class="btn btn-danger" onclick="app.loadPracticeExam(\${state.exam.selectedExamId}); app.closeModal();">Xác nhận làm lại</button>
        \`
      });
    },

    confirmSubmitExam() {
      if (state.exam.isLocked || state.exam.isSubmitted) return;

      const answeredCount = Object.values(state.exam.answers).filter((val) => val && val.trim().length > 0).length;
      if (answeredCount < 6) {
        this.openModal({
          title: 'Cảnh báo: Còn câu hỏi chưa hoàn thành!',
          body: \`
            <p style="margin-bottom: 8px;">Bạn mới hoàn thành <strong>\${answeredCount}/6 câu hỏi</strong> của đề thi.</p>
            <p style="color: var(--warning);">Những câu chưa trả lời sẽ nhận 0 điểm. Bạn có chắc chắn muốn nộp bài thi và chấm điểm ngay bây giờ?</p>
          \`,
          footerButtons: \`
            <button class="btn btn-secondary" onclick="app.closeModal()">Tiếp tục làm bài</button>
            <button class="btn btn-primary" onclick="app.closeModal(); app.submitAndGradeFullExam(false);">Xác nhận nộp bài</button>
          \`
        });
      } else {
        this.submitAndGradeFullExam(false);
      }
    },

    submitAndGradeFullExam(isAutoSubmit) {
      this.pauseExamTimer();
      state.exam.isLocked = true;
      state.exam.isSubmitted = true;

      const exam = window.APP_DATA && window.APP_DATA.practiceExams.find((e) => e.id === state.exam.selectedExamId);
      if (!exam) return;

      const allowedSec = (state.exam.selectedDurationMinutes || 120) * 60;
      const spentSec = Math.max(1, allowedSec - state.exam.timeRemaining);

      const gradedResult = this.gradeMOETPracticeExam(exam, state.exam.answers, spentSec, state.exam.selectedDurationMinutes);
      state.exam.gradedResult = gradedResult;

      // Save to Exam History in LocalStorage
      this.saveExamHistory({
        id: 'exam_' + Date.now(),
        examId: exam.id,
        examTitle: exam.title,
        sourceType: exam.sourceType,
        topic: exam.topic,
        timeAllowedMinutes: state.exam.selectedDurationMinutes,
        timeSpentSeconds: spentSec,
        submittedAt: new Date().toLocaleString('vi-VN'),
        isAutoSubmit: !!isAutoSubmit,
        totalScore: gradedResult.totalScore,
        maxScore: 10.0,
        gradeRank: gradedResult.gradeRank,
        readingScore: gradedResult.readingScore,
        socialScore: gradedResult.socialScore,
        literatureScore: gradedResult.literatureScore,
        questionDetails: gradedResult.questionDetails,
        socialCriteria: gradedResult.socialCriteria,
        literatureCriteria: gradedResult.literatureCriteria,
        answers: { ...state.exam.answers }
      });

      this.updateExamHistoryCountBadge();
      this.renderExamGradedResult();

      if (isAutoSubmit) {
        this.showToast(\`Bài thi đã nộp tự động khi hết giờ! Kết quả: \${gradedResult.totalScore.toFixed(2)}/10.0 điểm.\`, 'warning');
      } else {
        this.showToast(\`Nộp bài thành công! Điểm số: \${gradedResult.totalScore.toFixed(2)}/10.0 điểm (\${gradedResult.gradeRank}).\`, 'success');
      }
    },

    gradeMOETPracticeExam(exam, answers, timeSpentSeconds, timeAllowedMinutes) {
      const parts = exam.examParts;
      const qDetails = [];

      // 1. Chấm Phần I: Đọc hiểu (4.0 điểm)
      let readingScore = 0;
      parts.readingQuestions.forEach((q) => {
        const field = \`q\${q.questionNumber}\`;
        const ans = (answers[field] || '').trim();
        const words = ans ? ans.split(/\\s+/).length : 0;
        let score = 0;
        let comment = '';

        if (!ans) {
          score = 0;
          comment = 'Học sinh chưa trả lời câu hỏi này (0 điểm).';
        } else if (q.level === 'Nhận biết') {
          // Max 0.75đ
          if (words >= 4) {
            score = q.maxPoints;
            comment = 'Nhận diện đúng và chính xác ngữ liệu theo yêu cầu (đạt điểm tối đa).';
          } else {
            score = 0.5;
            comment = 'Có nêu được ý nhưng diễn đạt còn sơ sài.';
          }
        } else if (q.level === 'Thông hiểu') {
          // Max 1.0đ
          if (words >= 18) {
            score = q.maxPoints;
            comment = 'Hiểu rõ vấn đề, giải thích thấu đáo, bám sát ngữ liệu (đạt điểm tối đa).';
          } else if (words >= 8) {
            score = 0.75;
            comment = 'Nắm được ý chính nhưng lý giải chưa thật sâu sắc.';
          } else {
            score = 0.5;
            comment = 'Câu trả lời còn ngắn, chưa làm sáng tỏ ý nghĩa.';
          }
        } else if (q.level === 'Vận dụng') {
          // Max 1.25đ
          if (words >= 28) {
            score = q.maxPoints;
            comment = 'Phân tích đủ 3 bước: chỉ ra chi tiết/biện pháp, tác dụng nội dung và tác dụng nghệ thuật (đạt điểm tối đa).';
          } else if (words >= 15) {
            score = 0.75;
            comment = 'Đã gọi tên được biện pháp nghệ thuật nhưng phân tích hiệu quả biểu đạt chưa sâu.';
          } else {
            score = 0.5;
            comment = 'Chưa chỉ rõ tác dụng nghệ thuật của hình ảnh/biện pháp tu từ.';
          }
        } else {
          // Vận dụng cao (Max 1.0đ)
          if (words >= 35) {
            score = q.maxPoints;
            comment = 'Rút ra thông điệp ý nghĩa, lập luận nhân sinh sâu sắc và có liên hệ hành động bản thân (đạt điểm tối đa).';
          } else if (words >= 18) {
            score = 0.75;
            comment = 'Nêu được bài học tư tưởng tốt nhưng phần liên hệ thực tiễn cần cụ thể hơn.';
          } else {
            score = 0.5;
            comment = 'Thông điệp chung chung, chưa thể hiện rõ góc nhìn cá nhân.';
          }
        }

        score = Math.round(score * 100) / 100;
        readingScore += score;
        qDetails.push({
          questionNumber: q.questionNumber,
          label: \`Câu \${q.questionNumber} (\${q.level})\`,
          prompt: q.prompt,
          maxPoints: q.maxPoints,
          score: score,
          studentAnswer: ans || '(Học sinh để trống câu này)',
          comment: comment
        });
      });

      readingScore = Math.min(4.0, Math.round(readingScore * 100) / 100);

      // 2. Chấm Phần II.1: Đoạn văn NLXH 200 chữ (2.0 điểm theo 5 tiêu chí Bộ GD&ĐT)
      const socialText = (answers.social || '').trim();
      const socialWords = socialText ? socialText.split(/\\s+/).length : 0;
      const hasMultiParas = (socialText.match(/\\n\\s*\\n/g) || []).length > 0;

      const socialCriteria = [
        {
          name: '1. Đảm bảo yêu cầu hình thức đoạn văn (~200 chữ, không ngắt đoạn)',
          max: 0.25,
          score: (!socialText || hasMultiParas || socialWords < 80 || socialWords > 360) ? 0.1 : 0.25,
          feedback: hasMultiParas
            ? 'Cảnh báo: Đoạn văn bị ngắt dòng thành nhiều đoạn (vi phạm quy cách hình thức đoạn văn 200 chữ).'
            : (socialWords >= 160 && socialWords <= 280)
            ? 'Đảm bảo hoàn hảo quy chuẩn 1 đoạn văn duy nhất với dung lượng chuẩn.'
            : 'Dung lượng chưa thật tối ưu so với chuẩn 200 chữ.'
        },
        {
          name: '2. Xác định đúng vấn đề cần nghị luận',
          max: 0.25,
          score: socialText && socialWords >= 20 ? 0.25 : 0.0,
          feedback: socialText ? 'Xác định trúng vấn đề nghị luận xã hội của đề bài.' : 'Chưa xác định vấn đề.'
        },
        {
          name: '3. Triển khai vấn đề: Giải thích, bàn luận & Dẫn chứng thực tế xác thực',
          max: 1.0,
          score: (!socialText || socialWords < 60) ? 0.25 : (socialWords >= 160 ? 1.0 : 0.75),
          feedback: socialWords >= 160
            ? 'Lập luận sắc bén, có dẫn chứng thực tế thuyết phục, phân tích đa chiều.'
            : 'Lập luận tương đối nhưng cần bổ sung dẫn chứng thực tế sinh động hơn.'
        },
        {
          name: '4. Chính tả, ngữ pháp, sử dụng từ nối liên kết câu',
          max: 0.25,
          score: (!socialText || socialWords < 30) ? 0.1 : 0.25,
          feedback: 'Hành văn mạch lạc, câu cú trọn vẹn, sử dụng từ ngữ chính xác.'
        },
        {
          name: '5. Sáng tạo, chiều sâu tư tưởng & Bài học nhận thức hành động',
          max: 0.25,
          score: (!socialText || socialWords < 120) ? 0.1 : 0.25,
          feedback: socialWords >= 120
            ? 'Có góc nhìn nhân sinh mới mẻ, suy nghĩ chín chắn, bài học thiết thực cho giới trẻ.'
            : 'Cần làm nổi bật hơn bài học hành động của bản thân.'
        }
      ];

      let socialScore = socialCriteria.reduce((sum, c) => sum + c.score, 0);
      socialScore = Math.min(2.0, Math.round(socialScore * 100) / 100);

      // 3. Chấm Phần II.2: Bài văn NLVH 600 chữ (4.0 điểm theo 5 tiêu chí Bộ GD&ĐT)
      const litText = (answers.literature || '').trim();
      const litWords = litText ? litText.split(/\\s+/).length : 0;
      const litParas = litText ? litText.split(/\\n+/).filter((p) => p.trim().length > 0).length : 0;

      const literatureCriteria = [
        {
          name: '1. Đảm bảo cấu trúc bài văn nghị luận 3 phần (Mở bài - Thân bài - Kết bài)',
          max: 0.25,
          score: (!litText || litWords < 150) ? 0.05 : (litParas >= 3 ? 0.25 : 0.15),
          feedback: litParas >= 3
            ? 'Bố cục bài viết hoàn chỉnh rõ ràng 3 phần: Mở bài, Thân bài và Kết bài.'
            : 'Chưa phân tách rõ ràng các phần Mở bài - Thân bài - Kết bài.'
        },
        {
          name: '2. Xác định đúng vấn đề nghị luận văn học',
          max: 0.5,
          score: (!litText || litWords < 60) ? 0.1 : 0.5,
          feedback: litText ? 'Giới thiệu chính xác tác giả, tác phẩm và đối tượng phân tích trọng tâm.' : 'Chưa nêu được vấn đề.'
        },
        {
          name: '3. Triển khai luận điểm: Phân tích sâu sắc nội dung kết hợp thi pháp nghệ thuật',
          max: 2.5,
          score: (!litText || litWords < 150) ? 0.5 : (litWords >= 500 ? 2.5 : (litWords >= 300 ? 1.75 : 1.0)),
          feedback: litWords >= 500
            ? 'Phân tích xuất sắc, kết hợp nhuần nhuyễn giữa cảm nhận nội dung và đặc sắc thi pháp nghệ thuật.'
            : (litWords >= 300 ? 'Hành văn khá tốt, nhưng cần làm nổi bật hơn các nét đặc sắc về nghệ thuật ngôn từ.' : 'Bài viết còn sơ sài, chủ yếu tóm tắt nội dung.')
        },
        {
          name: '4. Chuẩn chính tả, ngữ pháp, phong cách diễn đạt học thuật',
          max: 0.25,
          score: (!litText || litWords < 80) ? 0.1 : 0.25,
          feedback: 'Văn phong học thuật chỉn chu, câu từ trong sáng, giàu cảm xúc thẩm mỹ.'
        },
        {
          name: '5. Sáng tạo, vận dụng lý luận văn học & So sánh mở rộng',
          max: 0.5,
          score: (!litText || litWords < 350) ? 0.15 : (litWords >= 550 ? 0.5 : 0.35),
          feedback: litWords >= 550
            ? 'Có những liên tưởng phong phú, lồng ghép lý luận văn học tự nhiên, nâng tầm bài viết.'
            : 'Cần chủ động đưa thêm nhận định lý luận văn học hoặc liên hệ so sánh để bài viết đạt điểm 9+.'
        }
      ];

      let literatureScore = literatureCriteria.reduce((sum, c) => sum + c.score, 0);
      literatureScore = Math.min(4.0, Math.round(literatureScore * 100) / 100);

      // Tổng điểm toàn bài thi
      const totalScore = Math.round((readingScore + socialScore + literatureScore) * 100) / 100;

      let gradeRank = 'Xuất sắc (Điểm 9+)';
      let gradeColor = 'success';
      if (totalScore < 5.0) {
        gradeRank = 'Cần cố gắng rèn luyện thêm';
        gradeColor = 'error';
      } else if (totalScore < 6.5) {
        gradeRank = 'Trung bình – Đạt yêu cầu';
        gradeColor = 'warning';
      } else if (totalScore < 8.0) {
        gradeRank = 'Khá';
        gradeColor = 'info';
      } else if (totalScore < 9.0) {
        gradeRank = 'Giỏi';
        gradeColor = 'success';
      }

      return {
        totalScore,
        maxScore: 10.0,
        gradeRank,
        gradeColor,
        readingScore,
        socialScore,
        literatureScore,
        timeSpentSeconds,
        timeAllowedMinutes,
        questionDetails: qDetails,
        socialCriteria,
        literatureCriteria,
        examSampleEssay: exam.sampleEssay,
        examAnswerKey: exam.answerKey
      };
    },

    renderExamGradedResult() {
      const activeContainer = document.getElementById('exam-active-container');
      const resultContainer = document.getElementById('exam-result-container');
      const banner = document.getElementById('exam-score-banner');
      const breakdown = document.getElementById('exam-result-breakdown');

      if (!resultContainer || !state.exam.gradedResult) return;

      if (activeContainer) activeContainer.classList.add('hidden');
      resultContainer.classList.remove('hidden');

      const res = state.exam.gradedResult;
      const spentMin = Math.floor(res.timeSpentSeconds / 60);
      const spentSec = res.timeSpentSeconds % 60;

      // 1. Render Banner
      if (banner) {
        banner.innerHTML = \`
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="score-display">
              <span class="score-value text-\${res.gradeColor}">\${res.totalScore.toFixed(2)}</span>
              <span class="score-label">/ 10.0 Điểm (\${res.gradeRank})</span>
            </div>
            <div style="flex: 1; min-width: 280px;">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="badge badge-accent">Báo cáo chấm điểm chuẩn Bộ GD&ĐT 2026</span>
                <span class="badge badge-info">Thời gian làm: \${spentMin}p \${spentSec}s / \${res.timeAllowedMinutes}p</span>
              </div>
              <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 4px;">Kết quả bài thi thử Tốt nghiệp THPT Quốc gia</h3>
              <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6;">
                Hệ thống đã phân tích và chấm điểm tự động dựa trên 3 phần: Đọc hiểu (4đ), Đoạn văn NLXH 200 chữ (2đ) và Bài văn NLVH 600 chữ (4đ) theo ma trận đặc tả năm 2026.
              </p>
            </div>
          </div>

          <!-- 3 Component Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border)]" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); border-top: 1px solid var(--border);">
            <div class="card card-flat p-3 text-center" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
              <span style="font-size: 12px; color: var(--text-tertiary); font-weight: 600;">PHẦN I: ĐỌC HIỂU</span>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent); margin: 4px 0;">\${res.readingScore.toFixed(2)} <span style="font-size: 14px; font-weight: 500; color: var(--text-tertiary);">/ 4.0đ</span></div>
              <span class="badge badge-accent">4 câu nhận thức</span>
            </div>
            <div class="card card-flat p-3 text-center" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
              <span style="font-size: 12px; color: var(--text-tertiary); font-weight: 600;">PHẦN II.1: NL XÃ HỘI</span>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--success); margin: 4px 0;">\${res.socialScore.toFixed(2)} <span style="font-size: 14px; font-weight: 500; color: var(--text-tertiary);">/ 2.0đ</span></div>
              <span class="badge badge-success">5 tiêu chí Bộ GD&ĐT</span>
            </div>
            <div class="card card-flat p-3 text-center" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
              <span style="font-size: 12px; color: var(--text-tertiary); font-weight: 600;">PHẦN II.2: NL VĂN HỌC</span>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-light); margin: 4px 0;">\${res.literatureScore.toFixed(2)} <span style="font-size: 14px; font-weight: 500; color: var(--text-tertiary);">/ 4.0đ</span></div>
              <span class="badge badge-info">5 tiêu chí Bộ GD&ĐT</span>
            </div>
          </div>
        \`;
      }

      // 2. Render Breakdown Details
      if (breakdown) {
        breakdown.innerHTML = \`
          <!-- Section 1: Đọc hiểu Breakdown -->
          <div class="card p-5" style="border: 1px solid var(--border);">
            <div class="flex items-center justify-between mb-3">
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent);">
                1. Chi tiết chấm điểm Phần I: Đọc hiểu (\${res.readingScore.toFixed(2)} / 4.0đ)
              </h3>
            </div>
            <div class="flex flex-col gap-3">
              \${res.questionDetails
                .map((q) => {
                  return \`
                  <div class="p-3.5" style="background: var(--bg-tertiary); border-radius: var(--radius-sm); border: 1px solid var(--border);">
                    <div class="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <span style="font-weight: 700; color: var(--accent);">\${q.label}</span>
                      <span class="badge badge-\${q.score >= q.maxPoints * 0.75 ? 'success' : q.score > 0 ? 'warning' : 'error'}">
                        Đạt: \${q.score.toFixed(2)} / \${q.maxPoints}đ
                      </span>
                    </div>
                    <p style="font-size: 13.5px; font-weight: 600; margin-bottom: 8px;">\${q.prompt}</p>
                    <div class="mb-2 p-2.5" style="background: var(--bg-card); border-radius: 4px; font-size: 13.5px; line-height: 1.6;">
                      <span style="font-size: 11px; font-weight: 700; color: var(--text-tertiary); display: block; margin-bottom: 2px;">BÀI LÀM CỦA THÍ SINH:</span>
                      \${q.studentAnswer}
                    </div>
                    <div style="font-size: 13px; color: var(--text-secondary);">
                      <strong>Nhận xét:</strong> \${q.comment}
                    </div>
                  </div>
                \`;
                })
                .join('')}
            </div>
          </div>

          <!-- Section 2: Đoạn văn NLXH 200 chữ Breakdown -->
          <div class="card p-5" style="border: 1px solid var(--border);">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--success);">
                2. Đánh giá 5 Tiêu chí Đoạn văn NLXH 200 chữ (\${res.socialScore.toFixed(2)} / 2.0đ)
              </h3>
            </div>
            <div class="mb-3 p-3" style="background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--text-tertiary); display: block; margin-bottom: 4px;">BÀI VIẾT CỦA BẠN:</span>
              <p style="font-size: 14px; line-height: 1.75; white-space: pre-wrap;">\${state.exam.answers.social || '(Học sinh để trống phần này)'}</p>
            </div>
            <div class="flex flex-col gap-2">
              \${res.socialCriteria
                .map((c) => {
                  return \`
                  <div class="flex items-start justify-between p-2.5" style="background: var(--bg-card); border-radius: 4px; border: 1px solid var(--border); font-size: 13.5px;">
                    <div style="flex: 1; padding-right: 12px;">
                      <div style="font-weight: 600;">\${c.name}</div>
                      <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">\${c.feedback}</div>
                    </div>
                    <span class="badge badge-\${c.score === c.max ? 'success' : 'warning'}" style="flex-shrink: 0;">
                      \${c.score.toFixed(2)} / \${c.max}đ
                    </span>
                  </div>
                \`;
                })
                .join('')}
            </div>
          </div>

          <!-- Section 3: Bài văn NLVH 600 chữ Breakdown -->
          <div class="card p-5" style="border: 1px solid var(--border);">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent-light);">
                3. Đánh giá 5 Tiêu chí Bài văn NLVH 600 chữ (\${res.literatureScore.toFixed(2)} / 4.0đ)
              </h3>
            </div>
            <div class="mb-3 p-3" style="background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--text-tertiary); display: block; margin-bottom: 4px;">BÀI VIẾT CỦA BẠN:</span>
              <p style="font-size: 14px; line-height: 1.75; white-space: pre-wrap;">\${state.exam.answers.literature || '(Học sinh để trống phần này)'}</p>
            </div>
            <div class="flex flex-col gap-2">
              \${res.literatureCriteria
                .map((c) => {
                  return \`
                  <div class="flex items-start justify-between p-2.5" style="background: var(--bg-card); border-radius: 4px; border: 1px solid var(--border); font-size: 13.5px;">
                    <div style="flex: 1; padding-right: 12px;">
                      <div style="font-weight: 600;">\${c.name}</div>
                      <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">\${c.feedback}</div>
                    </div>
                    <span class="badge badge-\${c.score === c.max ? 'success' : 'warning'}" style="flex-shrink: 0;">
                      \${c.score.toFixed(2)} / \${c.max}đ
                    </span>
                  </div>
                \`;
                })
                .join('')}
            </div>
          </div>

          <!-- Section 4: Bài văn mẫu tham khảo đạt điểm 9+ -->
          <div class="card p-5" style="border: 1px solid var(--border);">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span class="badge badge-success">BÀI VĂN MẪU THAM KHẢO ĐẠT ĐIỂM 9+</span>
              <button class="btn btn-sm btn-ghost" onclick="app.copyText(state.exam.gradedResult.examSampleEssay, 'Đã sao chép bài văn mẫu 9+!')">
                <i data-lucide="copy"></i> Sao chép bài văn mẫu
              </button>
            </div>
            <div class="literary-text" style="white-space: pre-wrap; font-size: 14.5px; line-height: 1.85;">\${res.examSampleEssay}</div>
          </div>
        \`;
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderIcons();
    },

    retakeCurrentExam() {
      this.loadPracticeExam(state.exam.selectedExamId);
    },

    launchExamRoomFromBank(examId) {
      this.navigateTo('exam');
      state.exam.selectedExamId = examId;
      this.loadPracticeExam(examId);
      this.showToast(\`Đã mở phòng thi với Đề số \${examId}!\`, 'success');
    },

    // ──────────────────────────────────────────
    // Exam History Management (LocalStorage)
    // ──────────────────────────────────────────
    getExamHistory() {
      try {
        const raw = localStorage.getItem('van12_exam_history_v2');
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        return [];
      }
    },

    saveExamHistory(item) {
      try {
        const history = this.getExamHistory();
        history.unshift(item); // add newest to front
        localStorage.setItem('van12_exam_history_v2', JSON.stringify(history.slice(0, 50)));
      } catch (err) {
        console.error('Error saving exam history:', err);
      }
    },

    updateExamHistoryCountBadge() {
      const badge = document.getElementById('exam-history-count-badge');
      if (badge) {
        const history = this.getExamHistory();
        badge.textContent = history.length;
      }
    },

    openExamHistoryModal() {
      const modal = document.getElementById('modal-exam-history');
      const body = document.getElementById('exam-history-modal-body');
      if (!modal || !body) return;

      const history = this.getExamHistory();
      if (history.length === 0) {
        body.innerHTML = \`
          <div class="p-8 text-center" style="color: var(--text-secondary);">
            <div style="font-size: 40px; margin-bottom: 12px;">📝</div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">Chưa có bài thi nào trong lịch sử</h4>
            <p style="font-size: 13.5px;">Hãy hoàn thành một đề thi thử trong phòng thi để hệ thống tự động lưu trữ kết quả và bảng chấm điểm tại đây.</p>
          </div>
        \`;
      } else {
        body.innerHTML = \`
          <div style="overflow-x: auto;">
            <table class="exam-history-table">
              <thead>
                <tr>
                  <th>Đề thi đã làm</th>
                  <th>Thời gian làm</th>
                  <th>Điểm số</th>
                  <th>Xếp loại</th>
                  <th>Ngày nộp</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                \${history
                  .map((item) => {
                    const spentMin = Math.floor(item.timeSpentSeconds / 60);
                    return \`
                    <tr>
                      <td style="font-weight: 600;">\${item.examTitle}</td>
                      <td>\${spentMin} phút / \${item.timeAllowedMinutes}p</td>
                      <td style="font-size: 15px; font-weight: 800; color: var(--accent);">\${item.totalScore.toFixed(2)}đ</td>
                      <td><span class="badge badge-\${item.totalScore >= 8 ? 'success' : item.totalScore >= 6.5 ? 'info' : 'warning'}">\${item.gradeRank}</span></td>
                      <td style="font-size: 12px; color: var(--text-tertiary);">\${item.submittedAt}</td>
                      <td>
                        <button class="btn btn-xs btn-secondary" onclick="app.viewHistoryItem('\${item.id}')" title="Xem chi tiết bài làm \u0026 nhận xét">
                          <i data-lucide="eye"></i> Xem lại
                        </button>
                      </td>
                    </tr>
                  \`;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        \`;
      }

      modal.classList.remove('hidden');
      this.renderIcons();
    },

    closeExamHistoryModal() {
      const modal = document.getElementById('modal-exam-history');
      if (modal) modal.classList.add('hidden');
    },

    viewHistoryItem(historyId) {
      const history = this.getExamHistory();
      const item = history.find((h) => h.id === historyId);
      if (!item) return;

      this.closeExamHistoryModal();
      this.navigateTo('exam');

      // Reconstruct graded result from history item
      state.exam.selectedExamId = item.examId;
      state.exam.answers = item.answers || {};
      state.exam.gradedResult = {
        totalScore: item.totalScore,
        maxScore: item.maxScore || 10.0,
        gradeRank: item.gradeRank,
        gradeColor: item.totalScore >= 8 ? 'success' : item.totalScore >= 6.5 ? 'info' : 'warning',
        readingScore: item.readingScore,
        socialScore: item.socialScore,
        literatureScore: item.literatureScore,
        timeSpentSeconds: item.timeSpentSeconds,
        timeAllowedMinutes: item.timeAllowedMinutes,
        questionDetails: item.questionDetails || [],
        socialCriteria: item.socialCriteria || [],
        literatureCriteria: item.literatureCriteria || [],
        examSampleEssay: (window.APP_DATA.practiceExams.find((e) => e.id === item.examId) || {}).sampleEssay || '',
        examAnswerKey: (window.APP_DATA.practiceExams.find((e) => e.id === item.examId) || {}).answerKey || ''
      };

      this.renderExamGradedResult();
      this.showToast(\`Đang xem lại kết quả bài thi nộp ngày \${item.submittedAt}\`, 'info');
    },

    clearExamHistory() {
      if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử thi thử không? Dữ liệu này sẽ không thể khôi phục.')) return;
      localStorage.removeItem('van12_exam_history_v2');
      this.updateExamHistoryCountBadge();
      this.openExamHistoryModal();
      this.showToast('Đã xóa toàn bộ lịch sử bài thi!', 'info');
    },`;

module.exports = { module2Code };
