// Script to update js/app.js with new tab handlers and modals
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'js', 'app.js');
let appCode = fs.readFileSync(appPath, 'utf8');

// 1. In openWorkDetail, update heroEl rendering
const oldHeroCode = `      // Update Hero Header
      const heroEl = document.getElementById('work-detail-hero');
      if (heroEl) {
        const theme = getGenreTheme(work.genre);
        const authorImg = work.authorImage || 'img/authors/vu_trong_phung.jpg';
        heroEl.innerHTML = \`
          <div class="flex items-center gap-4 flex-wrap">
            <div class="work-detail-author-avatar-box">
              <img src="\${authorImg}" alt="Chân dung tác giả \${work.author}" class="work-detail-author-avatar" onerror="this.onerror=null;this.src='img/authors/vu_trong_phung.jpg';">
            </div>
            <div class="flex-1" style="min-width: 260px;">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="badge \${theme.badgeClass}">\${work.genre}</span>
                <span class="badge badge-accent">Tập \${work.volume} • Bài \${work.lesson}</span>
                <span class="badge badge-success">Năm \${work.year}</span>
              </div>
              <h2 style="font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800; margin-bottom: 4px; color: var(--text-primary); line-height: 1.25;">
                \${work.title}
              </h2>
              <p style="font-size: 15px; color: var(--text-secondary); font-weight: 500;">
                Tác giả: <strong class="text-accent" style="font-size: 16px;">\${work.author}</strong>
              </p>
            </div>
          </div>
        \`;
      }`;

const newHeroCode = `      // Update Hero Header
      const heroEl = document.getElementById('work-detail-hero');
      if (heroEl) {
        const theme = getGenreTheme(work.genre);
        const authorImg = work.authorImage || 'img/authors/vu_trong_phung.jpg';
        const pInfo = work.authorPortraitInfo || {};
        heroEl.innerHTML = \`
          <div class="flex items-start gap-4 flex-wrap">
            <div class="work-detail-author-avatar-box">
              <img src="\${authorImg}" alt="Chân dung tác giả \${work.author}" class="work-detail-author-avatar" onerror="this.onerror=null;this.src='img/authors/vu_trong_phung.jpg';">
            </div>
            <div class="flex-1" style="min-width: 260px;">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="badge \${theme.badgeClass}">\${work.genre}</span>
                <span class="badge badge-accent">Tập \${work.volume} • Bài \${work.lesson}</span>
                <span class="badge badge-success">Năm \${work.year}</span>
                \${pInfo.literaryTitle ? \`<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 11.5px;"><i data-lucide="award" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle;"></i> \${pInfo.literaryTitle}</span>\` : ''}
              </div>
              <h2 style="font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800; margin-bottom: 4px; color: var(--text-primary); line-height: 1.25;">
                \${work.title}
              </h2>
              <p style="font-size: 15px; color: var(--text-secondary); font-weight: 500; margin-bottom: 4px;">
                Tác giả: <strong class="text-accent" style="font-size: 16px;">\${work.author}</strong>
                \${pInfo.birthDeathYears ? \` <span class="text-xs text-slate-400">(\${pInfo.birthDeathYears})</span>\` : ''}
                \${pInfo.hometown ? \` • <span class="text-xs text-slate-400">Quê quán: \${pInfo.hometown}</span>\` : ''}
              </p>
              \${pInfo.caption ? \`<p style="font-size: 13px; color: var(--text-tertiary); font-style: italic; margin-top: 2px;">\${pInfo.caption}</p>\` : ''}
            </div>
          </div>
        \`;
      }`;

if (appCode.includes(oldHeroCode)) {
  appCode = appCode.replace(oldHeroCode, newHeroCode);
  console.log('Hero header in openWorkDetail updated.');
} else {
  console.warn('Could not match oldHeroCode directly, checking alternatives...');
}

// 2. In switchWorkTab, replace the whole switchWorkTab implementation
const oldSwitchTabStart = `    switchWorkTab(tabName) {`;
const oldSwitchTabEnd = `      this.renderIcons();\n    },`;

const switchTabRegex = /switchWorkTab\(tabName\) \{[\s\S]*?this\.renderIcons\(\);\s*\},/;

const newSwitchTabCode = `switchWorkTab(tabName) {
      state.works.activeTab = tabName;
      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === state.works.activeWorkId);
      if (!work) return;

      // Update Tab Buttons UI
      document.querySelectorAll('#work-detail-tabs .tab-btn').forEach((btn) => {
        if (btn.getAttribute('data-tab') === tabName) btn.classList.add('active');
        else btn.classList.remove('active');
      });

      const container = document.getElementById('work-tab-content');
      if (!container) return;

      if (tabName === 'author') {
        const theme = getGenreTheme(work.genre);
        const authorImg = work.authorImage || 'img/authors/vu_trong_phung.jpg';
        const pInfo = work.authorPortraitInfo || {};
        container.innerHTML = \`
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="user-check" style="color: var(--accent);"></i>
                Tiểu sử & Phong cách nghệ thuật: \${work.author}
              </h3>
              <button class="copy-btn" onclick="app.copyTextById('author-info-content', 'Đã sao chép kiến thức tác giả!')">
                <i data-lucide="copy"></i> Sao chép
              </button>
            </div>

            <!-- Author Card Portrait & Snapshot -->
            <div class="card card-flat p-4 mb-4 flex items-center gap-4 flex-wrap" style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-md);">
              <div style="width: 88px; height: 88px; border-radius: 12px; overflow: hidden; border: 2px solid var(--accent); flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
                <img src="\${authorImg}" alt="\${work.author}" style="width: 100%; height: 100%; object-fit: cover; object-position: top center;" onerror="this.onerror=null;this.src='img/authors/vu_trong_phung.jpg';">
              </div>
              <div class="flex-1" style="min-width: 220px;">
                <h4 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">\${work.author}</h4>
                <p style="font-size: 13.5px; color: var(--accent-light); font-weight: 500; margin-bottom: 6px;">
                  Thời kỳ: Năm \${work.year || 'Hiện đại'} · \${pInfo.birthDeathYears ? \`Năm sinh: \${pInfo.birthDeathYears} · \` : ''}Thể loại: \${work.genre}
                </p>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="badge \${theme.badgeClass}">\${work.genre}</span>
                  <span class="badge badge-accent">Tập \${work.volume} • Bài \${work.lesson}</span>
                  \${pInfo.literaryTitle ? \`<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 11px;">\${pInfo.literaryTitle}</span>\` : ''}
                </div>
              </div>
            </div>

            <div class="literary-text mb-4" id="author-info-content" style="font-size: 15px; line-height: 1.85; color: var(--text-primary);">
              <p>\${work.authorBio || work.authorInfo}</p>
            </div>

            \${work.authorAesthetics ? \`
              <div class="card card-flat p-4" style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid var(--success); border-radius: var(--radius-sm); margin-top: 16px;">
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--success); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="feather" style="width: 18px; height: 18px;"></i> Quan niệm sáng tác & Tuyên ngôn nghệ thuật
                </h4>
                <p style="font-size: 14.5px; line-height: 1.8; color: var(--text-primary);">\${work.authorAesthetics}</p>
              </div>
            \` : ''}
          </div>
        \`;
      } else if (tabName === 'work') {
        container.innerHTML = \`
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-3">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="book" style="color: var(--accent);"></i>
                Hoàn cảnh sáng tác & Xuất xứ: "\${work.title}"
              </h3>
              <button class="copy-btn" onclick="app.copyTextById('work-info-content', 'Đã sao chép hoàn cảnh sáng tác!')">
                <i data-lucide="copy"></i> Sao chép
              </button>
            </div>
            
            <div class="literary-text mb-4" id="work-info-content" style="font-size: 15px; line-height: 1.8; color: var(--text-primary);">
              <p>\${work.workInfo}</p>
            </div>

            \${work.context ? \`
              <div class="card card-flat p-4 mb-4" style="background: rgba(99, 102, 241, 0.06); border-left: 4px solid var(--accent); border-radius: var(--radius-sm);">
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--accent); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="history" style="width: 18px; height: 18px;"></i> Bối cảnh lịch sử, văn hóa & thời đại
                </h4>
                <p style="font-size: 14.5px; line-height: 1.8; color: var(--text-primary);">\${work.context}</p>
              </div>
            \` : ''}

            \${work.mainThemes && work.mainThemes.length > 0 ? \`
              <div class="mt-4">
                <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="layers" style="color: var(--warning); width: 18px; height: 18px;"></i> Hệ thống chủ đề tư tưởng cốt lõi
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  \${work.mainThemes.map((th, idx) => \`
                    <div class="card p-3 flex items-start gap-3" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
                      <span class="badge badge-accent" style="flex-shrink: 0; font-size: 11px;">0\${idx + 1}</span>
                      <p style="font-size: 13.5px; line-height: 1.6; color: var(--text-primary); margin: 0;">\${th}</p>
                    </div>
                  \`).join('')}
                </div>
              </div>
            \` : ''}

            \${work.quotes && work.quotes.length > 0 ? \`
              <div class="mt-6">
                <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="quote" style="color: var(--accent); width: 18px; height: 18px;"></i> Các trích dẫn / câu thơ đắt giá
                </h4>
                <div class="flex flex-col gap-2">
                  \${work.quotes.map(q => \`
                    <div class="p-3" style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid var(--warning); border-radius: var(--radius-sm); font-size: 14px; font-style: italic; color: #fde68a;">
                      "\${q}"
                    </div>
                  \`).join('')}
                </div>
              </div>
            \` : ''}
          </div>
        \`;
      } else if (tabName === 'analysis') {
        container.innerHTML = \`
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-4">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="file-text" style="color: var(--accent);"></i>
                Nội dung chi tiết & Đặc sắc nghệ thuật (\${work.contentAnalysis.length} luận điểm)
              </h3>
              <button class="btn btn-sm btn-ghost" onclick="app.copyAnalysisContent(\${work.id})">
                <i data-lucide="copy"></i> Sao chép toàn bộ phân tích
              </button>
            </div>
            <div class="flex flex-col gap-4">
              \${work.contentAnalysis
                .map(
                  (item, idx) => \`
                <div class="card card-glass" style="border-left: 4px solid var(--accent); padding: 20px 24px;">
                  <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 10px;">
                    \${item.heading}
                  </h4>
                  <div class="literary-text" style="font-size: 14.5px; line-height: 1.85; color: var(--text-primary); margin-bottom: 10px;">
                    <p>\${item.content}</p>
                  </div>
                  \${item.evidence ? \`
                    <div class="p-3 my-2" style="background: rgba(99, 102, 241, 0.1); border-left: 3px solid var(--accent); border-radius: 4px; font-size: 13.5px; color: #c7d2fe; font-style: italic;">
                      <strong style="color: var(--accent); font-style: normal;">Dẫn chứng văn bản:</strong> \${item.evidence}
                    </div>
                  \` : ''}
                  \${item.literaryCommentary ? \`
                    <div class="p-3 my-2" style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--success); border-radius: 4px; font-size: 13.5px; color: #a7f3d0;">
                      <strong style="color: var(--success);">Lời bình giảng 9+:</strong> \${item.literaryCommentary}
                    </div>
                  \` : ''}
                </div>
              \`
                )
                .join('')}
            </div>

            \${work.artisticValues && work.artisticValues.length > 0 ? \`
              <div class="card mt-6 p-4" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
                <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="award" style="color: var(--warning); width: 18px; height: 18px;"></i> Đúc kết giá trị nghệ thuật đặc sắc
                </h4>
                <ul class="flex flex-col gap-2" style="padding-left: 20px; list-style-type: disc;">
                  \${work.artisticValues.map(v => \`<li style="font-size: 14px; line-height: 1.7; color: var(--text-secondary);">\${v}</li>\`).join('')}
                </ul>
              </div>
            \` : ''}
          </div>
        \`;
      } else if (tabName === 'questions') {
        container.innerHTML = \`
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-4">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="help-circle" style="color: var(--accent);"></i>
                Hướng dẫn trả lời câu hỏi SGK (\${work.textbookQuestions.length} câu)
              </h3>
              <button class="btn btn-sm btn-ghost" onclick="app.copyQuestionsContent(\${work.id})">
                <i data-lucide="copy"></i> Sao chép toàn bộ câu hỏi SGK
              </button>
            </div>
            <div class="flex flex-col gap-4">
              \${work.textbookQuestions
                .map(
                  (q, idx) => \`
                <div class="card" style="border: 1px solid var(--border); padding: 20px;">
                  <div class="flex items-center justify-between mb-2">
                    <span class="badge badge-accent">Câu hỏi \${idx + 1} (SGK)</span>
                    <button class="copy-btn" onclick="app.copyTextById('q-answer-\${idx}', 'Đã sao chép câu trả lời \${idx + 1}!')">
                      <i data-lucide="copy"></i>
                    </button>
                  </div>
                  <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary);">
                    \${q.question}
                  </h4>
                  <div class="p-3" style="background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--success);">
                    <span style="font-weight: 600; font-size: 13px; color: var(--success); display: block; margin-bottom: 4px;">
                      Đáp án gợi ý:
                    </span>
                    <div class="literary-text" id="q-answer-\${idx}" style="font-size: 14px; line-height: 1.75; color: var(--text-primary);">
                      <p>\${q.answer}</p>
                    </div>
                  </div>
                </div>
              \`
                )
                .join('')}
            </div>
          </div>
        \`;
      } else if (tabName === 'essay') {
        const outline = work.essayOutline || {};
        container.innerHTML = \`
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="pen-tool" style="color: var(--accent);"></i>
                Dàn ý bài văn mẫu 9+ & Nhận định phê bình văn học
              </h3>
              <button class="btn btn-sm btn-ghost" onclick="app.copyEssayOutline(\${work.id})">
                <i data-lucide="copy"></i> Sao chép dàn ý 9+
              </button>
            </div>

            <!-- Essay Outline Card -->
            <div class="card p-5 mb-5" style="border: 1px solid var(--border); background: var(--bg-card);">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--accent); margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="list-ordered" style="width: 18px; height: 18px;"></i> Cấu trúc dàn ý chuẩn điểm 9+
              </h4>

              <!-- Mở bài -->
              <div class="mb-4 p-3.5 rounded" style="background: var(--bg-tertiary); border-left: 4px solid var(--accent);">
                <span class="badge badge-accent mb-2" style="font-size: 11px;">A. MỞ BÀI (0.5đ – 0.75đ)</span>
                <p style="font-size: 14.5px; line-height: 1.75; color: var(--text-primary); margin: 0;">\${outline.introduction || 'Dẫn dắt trực tiếp hoặc gián tiếp, giới thiệu tác giả, tác phẩm, vị trí đoạn trích và nêu vấn đề nghị luận.'}</p>
              </div>

              <!-- Thân bài -->
              <div class="mb-4 p-3.5 rounded" style="background: var(--bg-tertiary); border-left: 4px solid var(--warning);">
                <span class="badge badge-warning mb-2" style="font-size: 11px;">B. THÂN BÀI (3.0đ – 3.5đ)</span>
                <div class="flex flex-col gap-2.5 mt-2">
                  \${outline.body && outline.body.length > 0 ? outline.body.map(b => \`
                    <div class="p-3 rounded bg-slate-900/60 border border-slate-700/60 text-slate-200 text-sm leading-relaxed">
                      \${b}
                    </div>
                  \`).join('') : '<p class="text-sm text-slate-300">Triển khai 3 luận điểm chính từ hình thức nghệ thuật sang nội dung tư tưởng.</p>'}
                </div>
              </div>

              <!-- Kết bài -->
              <div class="p-3.5 rounded" style="background: var(--bg-tertiary); border-left: 4px solid var(--success);">
                <span class="badge badge-success mb-2" style="font-size: 11px;">C. KẾT BÀI (0.5đ)</span>
                <p style="font-size: 14.5px; line-height: 1.75; color: var(--text-primary); margin: 0;">\${outline.conclusion || 'Khẳng định lại giá trị tác phẩm, phong cách tác giả và mở rộng bài học nhân sinh.'}</p>
              </div>
            </div>

            <!-- Scholarly Quotes -->
            \${work.scholarlyQuotes && work.scholarlyQuotes.length > 0 ? \`
              <div class="card p-5 mb-5" style="border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.05);">
                <h4 style="font-size: 1.1rem; font-weight: 800; color: #fbbf24; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="quote" style="width: 18px; height: 18px;"></i> Nhận định của các nhà nghiên cứu, phê bình lớn
                </h4>
                <div class="flex flex-col gap-3">
                  \${work.scholarlyQuotes.map(sq => \`
                    <div class="p-3.5 rounded bg-slate-900/80 border border-amber-500/30">
                      <div class="flex items-center justify-between mb-1.5">
                        <strong class="text-amber-400 text-sm">\${sq.critic}:</strong>
                        <span class="badge badge-accent" style="font-size: 10px;">Lý luận 9+</span>
                      </div>
                      <p class="text-slate-200 text-sm italic leading-relaxed m-0">"\${sq.quote}"</p>
                    </div>
                  \`).join('')}
                </div>
              </div>
            \` : ''}

            <!-- Exam Prompts -->
            \${work.examPrompts && work.examPrompts.length > 0 ? \`
              <div class="card p-5" style="border: 1px solid var(--border); background: var(--bg-card);">
                <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="help-circle" style="color: var(--info); width: 18px; height: 18px;"></i> Các dạng đề thi trọng tâm rèn luyện
                </h4>
                <div class="flex flex-col gap-2.5">
                  \${work.examPrompts.map((ep, idx) => \`
                    <div class="p-3.5 rounded bg-slate-800/80 border border-slate-700 flex items-start gap-3">
                      <span class="badge badge-info" style="flex-shrink: 0; font-size: 11px;">Đề \${idx + 1}</span>
                      <p class="text-slate-200 text-sm font-medium leading-relaxed m-0">\${ep}</p>
                    </div>
                  \`).join('')}
                </div>
              </div>
            \` : ''}
          </div>
        \`;
      } else if (tabName === 'expression') {
        const spec = work.expressionSpec || {};
        container.innerHTML = \`
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="sparkles" style="color: var(--accent);"></i>
                Đặc trưng Bút pháp & Phương thức biểu đạt chuyên sâu
              </h3>
              <button class="btn btn-sm btn-ghost" onclick="app.copyExpressionSpec(\${work.id})">
                <i data-lucide="copy"></i> Sao chép thông số biểu đạt
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <!-- Primary Expression -->
              <div class="card p-4" style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.3);">
                <div class="flex items-center gap-2 mb-2">
                  <i data-lucide="target" style="color: var(--accent); width: 18px; height: 18px;"></i>
                  <strong class="text-accent text-sm uppercase tracking-wide">Phương thức biểu đạt chính</strong>
                </div>
                <h4 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
                  \${spec.primaryExpression || 'Biểu cảm'}
                </h4>
                <p class="text-xs text-slate-400 m-0">Phương thức giữ vai trò nòng cốt định hình thể loại và giọng điệu toàn tác phẩm.</p>
              </div>

              <!-- Combined Expressions -->
              <div class="card p-4" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3);">
                <div class="flex items-center gap-2 mb-2">
                  <i data-lucide="layers" style="color: var(--success); width: 18px; height: 18px;"></i>
                  <strong class="text-success text-sm uppercase tracking-wide">Phương thức kết hợp</strong>
                </div>
                <div class="flex items-center gap-2 flex-wrap mb-2">
                  \${(spec.combinedExpressions || []).map(ce => \`<span class="badge badge-success">\${ce}</span>\`).join('')}
                </div>
                <p class="text-xs text-slate-400 m-0">Tăng tính gợi hình, sinh động và làm phong phú thêm tầng nghĩa cho tác phẩm.</p>
              </div>

              <!-- Language Style -->
              <div class="card p-4" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
                <div class="flex items-center gap-2 mb-2">
                  <i data-lucide="type" style="color: var(--warning); width: 18px; height: 18px;"></i>
                  <strong class="text-warning text-sm uppercase tracking-wide">Phong cách ngôn ngữ</strong>
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                  \${spec.languageStyle || 'Phong cách ngôn ngữ Nghệ thuật'}
                </h4>
              </div>

              <!-- Dominant Tone -->
              <div class="card p-4" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
                <div class="flex items-center gap-2 mb-2">
                  <i data-lucide="music" style="color: var(--info); width: 18px; height: 18px;"></i>
                  <strong class="text-info text-sm uppercase tracking-wide">Giọng điệu chủ đạo</strong>
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                  \${spec.dominantTone || 'Hào hùng, bi tráng'}
                </h4>
              </div>
            </div>

            <!-- Form & Structure -->
            <div class="card p-4 mb-4" style="background: var(--bg-card); border: 1px solid var(--border);">
              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="layout" style="color: var(--accent); width: 18px; height: 18px;"></i> Kết cấu thể loại & Bố cục nghệ thuật
              </h4>
              <p class="text-slate-300 text-sm leading-relaxed m-0">\${spec.formAndStructure || 'Kết cấu chặt chẽ theo mạch phát triển của hình tượng nghệ thuật.'}</p>
            </div>

            <!-- Core Rhetorical Devices -->
            <div class="card p-4 mb-4" style="background: var(--bg-card); border: 1px solid var(--border);">
              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="zap" style="color: var(--warning); width: 18px; height: 18px;"></i> Biện pháp tu từ nòng cốt tạo đòn bẩy thẩm mỹ
              </h4>
              <div class="flex flex-wrap gap-2">
                \${(spec.coreRhetoricalDevices || []).map(rd => \`
                  <span class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold">
                    \${rd}
                  </span>
                \`).join('')}
              </div>
            </div>

            <!-- Key Expression Value -->
            <div class="card p-4" style="background: rgba(99, 102, 241, 0.08); border-left: 4px solid var(--accent); border-radius: var(--radius-sm);">
              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--accent); margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="check-circle" style="width: 18px; height: 18px;"></i> Giá trị biểu đạt cốt lõi
              </h4>
              <p class="text-slate-200 text-sm leading-relaxed m-0">\${spec.keyExpressionValue || ''}</p>
            </div>
          </div>
        \`;
      }

      this.renderIcons();
    },`;

if (switchTabRegex.test(appCode)) {
  appCode = appCode.replace(switchTabRegex, newSwitchTabCode);
  console.log('switchWorkTab replaced successfully with all 6 tabs.');
} else {
  console.warn('Could not match switchWorkTab via regex, trying alternative.');
}

// 3. Add copyEssayOutline and copyExpressionSpec helper methods
const copyHelpers = `    copyEssayOutline(workId) {
      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === workId);
      if (!work || !work.essayOutline) return;
      const o = work.essayOutline;
      let text = \`DÀN Ý BÀI VĂN NGHỊ LUẬN 9+: \${work.title.toUpperCase()}\\n\\n\`;
      text += \`A. MỞ BÀI:\\n\${o.introduction}\\n\\n\`;
      text += \`B. THÂN BÀI:\\n\`;
      (o.body || []).forEach((b) => {
        text += \`- \${b}\\n\\n\`;
      });
      text += \`C. KẾT BÀI:\\n\${o.conclusion}\\n\`;
      this.copyText(text, 'Đã sao chép dàn ý 9+!');
    },

    copyExpressionSpec(workId) {
      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === workId);
      if (!work || !work.expressionSpec) return;
      const s = work.expressionSpec;
      let text = \`THÔNG SỐ BÚT PHÁP & BIỂU ĐẠT: \${work.title.toUpperCase()}\\n\\n\`;
      text += \`- Phương thức biểu đạt chính: \${s.primaryExpression}\\n\`;
      text += \`- Phương thức kết hợp: \${(s.combinedExpressions || []).join(', ')}\\n\`;
      text += \`- Phong cách ngôn ngữ: \${s.languageStyle}\\n\`;
      text += \`- Giọng điệu chủ đạo: \${s.dominantTone}\\n\`;
      text += \`- Kết cấu thể loại: \${s.formAndStructure}\\n\`;
      text += \`- Biện pháp tu từ nòng cốt: \${(s.coreRhetoricalDevices || []).join(', ')}\\n\`;
      text += \`- Giá trị biểu đạt: \${s.keyExpressionValue}\\n\`;
      this.copyText(text, 'Đã sao chép thông số biểu đạt!');
    },

    // ──────────────────────────────────────────
    // Comparison Topics Modal (So sánh văn học)
    // ──────────────────────────────────────────
    openComparisonModal(topicId = 'song-da-vs-song-huong') {
      const comparisons = (window.APP_DATA && window.APP_DATA.comparisons) || [];
      if (comparisons.length === 0) return;

      const current = comparisons.find(c => c.id === topicId) || comparisons[0];

      const navPills = comparisons.map(c => \`
        <button class="chip \${c.id === current.id ? 'active' : ''}" onclick="app.openComparisonModal('\${c.id}')" style="font-size: 12.5px;">
          \${c.id === 'song-da-vs-song-huong' ? 'Sông Đà vs Sông Hương' : c.id === 'mi-vs-thi' ? 'Nhân vật Mị vs Thị' : 'Lính Tây Tiến vs Đồng chí'}
        </button>
      \`).join('');

      const bodyHtml = \`
        <div>
          <!-- Sub Nav Pills -->
          <div class="flex items-center gap-2 flex-wrap mb-4 pb-3" style="border-bottom: 1px solid var(--border);">
            \${navPills}
          </div>

          <!-- Comparison Title -->
          <div class="card card-flat p-4 mb-4" style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.3);">
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-accent">Dạng đề so sánh 9+</span>
              <span class="text-xs text-slate-400">Câu phân hóa điểm giỏi</span>
            </div>
            <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
              \${current.title}
            </h3>
            <p style="font-size: 13.5px; color: var(--accent-light); margin: 0;">
              Đối chiếu: <strong>\${current.workA} (\${current.authorA})</strong> & <strong>\${current.workB} (\${current.authorB})</strong>
            </p>
          </div>

          <!-- 1. Tương đồng -->
          <div class="mb-4">
            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--accent); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i> 1. Điểm tương đồng giữa hai tác phẩm
            </h4>
            <div class="flex flex-col gap-2">
              \${current.similarity.map(s => \`
                <div class="p-3 rounded bg-slate-800/80 border border-slate-700 text-slate-200 text-sm leading-relaxed">
                  • \${s}
                </div>
              \`).join('')}
            </div>
          </div>

          <!-- 2. Khác biệt -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <!-- Diff A -->
            <div class="card p-3.5" style="background: var(--bg-tertiary); border-left: 3px solid var(--warning);">
              <h5 style="font-size: 0.95rem; font-weight: 700; color: #fbbf24; margin-bottom: 8px;">
                \${current.differenceA.heading}
              </h5>
              <ul class="flex flex-col gap-2" style="padding-left: 16px; list-style-type: disc;">
                \${current.differenceA.points.map(p => \`<li class="text-xs text-slate-300 leading-relaxed">\${p}</li>\`).join('')}
              </ul>
            </div>

            <!-- Diff B -->
            <div class="card p-3.5" style="background: var(--bg-tertiary); border-left: 3px solid var(--success);">
              <h5 style="font-size: 0.95rem; font-weight: 700; color: #34d399; margin-bottom: 8px;">
                \${current.differenceB.heading}
              </h5>
              <ul class="flex flex-col gap-2" style="padding-left: 16px; list-style-type: disc;">
                \${current.differenceB.points.map(p => \`<li class="text-xs text-slate-300 leading-relaxed">\${p}</li>\`).join('')}
              </ul>
            </div>
          </div>

          <!-- 3. Kết luận lý giải -->
          <div class="p-3.5 rounded" style="background: rgba(99, 102, 241, 0.1); border-left: 4px solid var(--accent);">
            <h5 style="font-size: 0.95rem; font-weight: 700; color: var(--accent); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="help-circle" style="width: 16px; height: 16px;"></i> Khái quát & Lý giải nguyên nhân sự khác biệt
            </h5>
            <p class="text-slate-200 text-sm leading-relaxed m-0">\${current.conclusion}</p>
          </div>
        </div>
      \`;

      this.openModal({
        title: 'Chuyên Đề So Sánh Văn Học Điểm 9+',
        body: bodyHtml,
        footerButtons: \`
          <button class="btn btn-ghost" onclick="app.copyComparisonText('\${current.id}')">
            <i data-lucide="copy"></i> Sao chép chuyên đề
          </button>
          <button class="btn btn-secondary" onclick="app.closeModal()">Đóng</button>
        \`
      });
      this.renderIcons();
    },

    copyComparisonText(topicId) {
      const comparisons = (window.APP_DATA && window.APP_DATA.comparisons) || [];
      const current = comparisons.find(c => c.id === topicId);
      if (!current) return;
      let text = \`CHUYÊN ĐỀ SO SÁNH VĂN HỌC: \${current.title.toUpperCase()}\\n\\n\`;
      text += \`1. ĐIỂM TƯƠNG ĐỒNG:\\n\`;
      current.similarity.forEach(s => text += \`- \${s}\\n\`);
      text += \`\\n2. NÉT ĐỘC ĐÁO TÁC PHẨM A (\${current.differenceA.heading}):\\n\`;
      current.differenceA.points.forEach(p => text += \`- \${p}\\n\`);
      text += \`\\n3. NÉT ĐỘC ĐÁO TÁC PHẨM B (\${current.differenceB.heading}):\\n\`;
      current.differenceB.points.forEach(p => text += \`- \${p}\\n\`);
      text += \`\\n4. KHÁI QUÁT LÝ GIẢI NGUYÊN NHÂN:\\n\${current.conclusion}\\n\`;
      this.copyText(text, 'Đã sao chép nội dung so sánh văn học!');
    },

    // ──────────────────────────────────────────
    // Expression Modes & Formulas Modal
    // ──────────────────────────────────────────
    openExpressionModal(tab = 'modes') {
      const modes = (window.APP_DATA && window.APP_DATA.expressionModes) || [];
      const formulas = (window.APP_DATA && window.APP_DATA.expressionFormulas) || [];
      const quotes = (window.APP_DATA && window.APP_DATA.literaryQuotes) || [];
      const intros = (window.APP_DATA && window.APP_DATA.introFormulas) || [];

      const tabsHeader = \`
        <div class="flex items-center gap-2 flex-wrap mb-4 pb-3" style="border-bottom: 1px solid var(--border);">
          <button class="chip \${tab === 'modes' ? 'active' : ''}" onclick="app.openExpressionModal('modes')">
            <i data-lucide="book-open" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> 6 Phương thức biểu đạt
          </button>
          <button class="chip \${tab === 'formulas' ? 'active' : ''}" onclick="app.openExpressionModal('formulas')">
            <i data-lucide="zap" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> 4 Biểu thức công thức 9+
          </button>
          <button class="chip \${tab === 'quotes' ? 'active' : ''}" onclick="app.openExpressionModal('quotes')">
            <i data-lucide="quote" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> Kho nhận định lý luận
          </button>
        </div>
      \`;

      let tabBody = '';
      if (tab === 'modes') {
        tabBody = \`
          <div class="flex flex-col gap-4">
            \${modes.map(m => \`
              <div class="card p-4" style="background: var(--bg-card); border: 1px solid var(--border);">
                <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--accent); margin: 0;">\${m.name}</h4>
                  <span class="badge badge-accent">\${m.badge}</span>
                </div>
                <p style="font-size: 13.5px; color: var(--text-primary); margin-bottom: 8px;"><strong>Mục đích:</strong> \${m.purpose}</p>
                <div class="p-2.5 rounded bg-slate-900/60 border border-slate-700/60 mb-2">
                  <span class="text-xs font-semibold text-amber-400 block mb-1">Dấu hiệu nhận biết đặc trưng:</span>
                  <ul style="padding-left: 16px; margin: 0; list-style-type: disc;">
                    \${m.recognitionSigns.map(rs => \`<li class="text-xs text-slate-300 leading-relaxed">\${rs}</li>\`).join('')}
                  </ul>
                </div>
                <div class="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 mb-2">
                  <span class="text-xs font-semibold text-emerald-400 block mb-1">Ví dụ tác phẩm Ngữ văn 12:</span>
                  <ul style="padding-left: 16px; margin: 0; list-style-type: circle;">
                    \${m.grade12Examples.map(ge => \`<li class="text-xs text-emerald-200 leading-relaxed">\${ge}</li>\`).join('')}
                  </ul>
                </div>
                <div class="p-2.5 rounded bg-sky-950/30 border border-sky-500/30 text-xs text-sky-200">
                  <strong class="text-sky-400">Mẹo thi Đọc hiểu:</strong> \${m.examTip}
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
      } else if (tab === 'formulas') {
        tabBody = \`
          <div class="flex flex-col gap-4">
            \${formulas.map(f => \`
              <div class="card p-4" style="background: var(--bg-card); border: 1px solid var(--border);">
                <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span class="badge badge-accent">\${f.categoryLabel}</span>
                  <span class="badge badge-warning">\${f.scoreWeight}</span>
                </div>
                <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">\${f.title}</h4>
                <div class="p-3 rounded bg-indigo-950/40 border border-indigo-500/40 font-mono text-xs text-indigo-200 mb-3 leading-relaxed">
                  \${f.expressionFormula}
                </div>
                <div class="mb-3">
                  <span class="text-xs font-semibold text-slate-300 block mb-1">Các bước triển khai chuẩn barem:</span>
                  <ol style="padding-left: 18px; margin: 0; list-style-type: decimal;">
                    \${f.stepByStep.map(s => \`<li class="text-xs text-slate-300 leading-relaxed mb-1">\${s}</li>\`).join('')}
                  </ol>
                </div>
                <div class="p-2.5 rounded bg-slate-900/80 border border-slate-700 text-xs text-slate-300">
                  <strong class="text-amber-400">Ví dụ thực chiến:</strong> \${f.applicationExample}
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
      } else if (tab === 'quotes') {
        tabBody = \`
          <div>
            <div class="mb-4">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--warning); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="quote" style="width: 18px; height: 18px;"></i> Nhận định lý luận văn học đắt giá ghi điểm 9+
              </h4>
              <div class="flex flex-col gap-3">
                \${quotes.map(q => \`
                  <div class="card p-3.5" style="background: var(--bg-card); border: 1px solid var(--border);">
                    <div class="flex items-center justify-between mb-1.5">
                      <strong class="text-amber-400 text-sm">\${q.author}</strong>
                      <span class="badge badge-accent" style="font-size: 10px;">Lý luận đắt giá</span>
                    </div>
                    <p class="text-slate-100 text-sm italic leading-relaxed mb-2">"\${q.quote}"</p>
                    <div class="text-xs text-slate-400">
                      <strong class="text-slate-300">Ứng dụng thực tế:</strong> \${q.application}
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>

            <div class="mt-6 pt-4" style="border-top: 1px solid var(--border);">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--accent); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="sparkles" style="width: 18px; height: 18px;"></i> 3 Công thức mở bài 9+ kinh điển
              </h4>
              <div class="flex flex-col gap-3">
                \${intros.map(it => \`
                  <div class="card p-3.5" style="background: var(--bg-card); border-left: 3px solid var(--accent);">
                    <h5 style="font-size: 0.95rem; font-weight: 700; color: var(--accent); margin-bottom: 4px;">\${it.name}</h5>
                    <p class="text-xs text-slate-300 font-mono mb-2 bg-slate-900/60 p-2 rounded">\${it.pattern}</p>
                    <p class="text-xs text-slate-200 leading-relaxed m-0"><strong class="text-emerald-400">Ví dụ:</strong> \${it.example}</p>
                  </div>
                \`).join('')}
              </div>
            </div>
          </div>
        \`;
      }

      this.openModal({
        title: 'Cẩm Nang Phương Thức Biểu Đạt & Công Thức 9+',
        body: tabsHeader + tabBody,
        footerButtons: \`
          <button class="btn btn-secondary" onclick="app.closeModal()">Đóng</button>
        \`
      });
      this.renderIcons();
    },
`;

if (appCode.includes('copyQuestionsContent(workId) {')) {
  const insertTarget = 'copyQuestionsContent(workId) {\n      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === workId);\n      if (!work) return;\n      let text = `CÂU HỎI SGK & ĐÁP ÁN: ${work.title}\\n\\n`;\n      work.textbookQuestions.forEach((q, idx) => {\n        text += `Câu ${idx + 1}: ${q.question}\\nĐáp án: ${q.answer}\\n\\n`;\n      });\n      this.copyText(text, \'Đã sao chép hệ thống câu hỏi SGK!\');\n    },';
  
  if (appCode.includes(insertTarget)) {
    appCode = appCode.replace(insertTarget, insertTarget + '\n\n' + copyHelpers);
    console.log('Inserted copy helpers and modal methods.');
  } else {
    // alternative insertion
    console.log('Inserting copy helpers before createIntroForCurrentWork');
    appCode = appCode.replace('createIntroForCurrentWork() {', copyHelpers + '\n\n    createIntroForCurrentWork() {');
  }
}

fs.writeFileSync(appPath, appCode, 'utf8');
console.log('Successfully updated js/app.js!');
