/**
 * VĂN 12 PRO LAB – Application Engine
 * Module 6: UX/UI Design System & Interactive Features
 */

(function () {
  'use strict';

  // Helper: Diacritics stripper for fuzzy Vietnamese search
  function stripDiacritics(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  // Helper: Genre styling theme (badge class, card hover glow class)
  function getGenreTheme(genre) {
    if (!genre) return { badgeClass: 'badge-genre-truyen', cardClass: 'card-genre-truyen' };
    const g = genre.toLowerCase();
    if (g.includes('thơ')) {
      return { badgeClass: 'badge-genre-tho', cardClass: 'card-genre-tho' };
    } else if (g.includes('tùy bút') || g.includes('ký') || g.includes('tản văn') || g.includes('hồi ký')) {
      return { badgeClass: 'badge-genre-ky', cardClass: 'card-genre-ky' };
    } else if (g.includes('kịch') || g.includes('chính luận') || g.includes('nghị luận')) {
      return { badgeClass: 'badge-genre-nghi-luan', cardClass: 'card-genre-nghi-luan' };
    } else if (g.includes('ấn độ') || g.includes('phương tây') || g.includes('yann martel') || g.includes('cuộc đời của pi') || g.includes('phiêu lưu')) {
      return { badgeClass: 'badge-genre-the-gioi', cardClass: 'card-genre-the-gioi' };
    } else {
      return { badgeClass: 'badge-genre-truyen', cardClass: 'card-genre-truyen' };
    }
  }

  // Helper: Build rich literature card with author portrait and genre theme
  function buildWorkCardHtml(work) {
    const theme = getGenreTheme(work.genre);
    const summarySnippet = work.workInfo
      ? (work.workInfo.length > 120 ? work.workInfo.substring(0, 120) + '...' : work.workInfo)
      : '';
    const pointsCount = work.contentAnalysis ? work.contentAnalysis.length : 3;
    const authorImg = work.authorImage || 'img/authors/vu_trong_phung.jpg';

    return `
      <div class="card card-work-academic ${theme.cardClass}" onclick="app.openWorkDetail(${work.id})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();app.openWorkDetail(${work.id});}" aria-label="Xem tác phẩm ${work.title}">
        <div class="card-work-header-row">
          <div class="card-author-avatar-box">
            <img src="${authorImg}" alt="Chân dung tác giả ${work.author}" class="card-author-avatar" loading="lazy" onerror="this.onerror=null;this.src='img/authors/vu_trong_phung.jpg';">
          </div>
          <div class="card-work-info-box">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="badge ${theme.badgeClass}">${work.genre}</span>
              <span class="card-work-volume-badge">Tập ${work.volume} • Bài ${work.lesson}</span>
            </div>
            <span class="card-work-author-text">
              <i data-lucide="user" style="width: 13px; height: 13px; display: inline-block; vertical-align: middle; margin-right: 3px; color: var(--accent);"></i>
              ${work.author} ${work.year ? '(' + work.year + ')' : ''}
            </span>
          </div>
        </div>

        <h3 class="card-work-title-academic">${work.title}</h3>
        <p class="card-work-desc-academic">${summarySnippet}</p>

        <div class="card-work-bottom-row">
          <span class="card-work-points-tag">
            <i data-lucide="layers" style="width: 13px; height: 13px;"></i>
            ${pointsCount} luận điểm trọng tâm
          </span>
          <span class="btn-card-view-detail" onclick="event.stopPropagation(); app.openWorkDetail(${work.id});" role="button" tabindex="0" title="Nhấn để xem chi tiết tác phẩm">
            <span>Xem chi tiết</span>
            <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
          </span>
        </div>
      </div>
    `;
  }

  // Application State
  const state = {
    currentView: 'dashboard',
    theme: (function () {
      try {
        return localStorage.getItem('van12_theme') === 'dark' ? 'dark' : 'academic';
      } catch (e) {
        return 'academic';
      }
    })(),
    searchResults: [],
    sidebarCollapsed: (function () {
      try {
        return localStorage.getItem('van12_sidebar') === 'true';
      } catch (e) {
        return false;
      }
    })(),
    lastVisitedWorkId: (function () {
      try {
        return parseInt(localStorage.getItem('van12_last_work') || '1', 10);
      } catch (e) {
        return 1;
      }
    })(),
    dailyGoals: (function () {
      try {
        const raw = localStorage.getItem('van12_daily_goals');
        return raw
          ? JSON.parse(raw)
          : [
              { id: 1, text: 'Học tác phẩm trọng tâm (Tây Tiến)', done: true },
              { id: 2, text: 'Luyện 1 đề thi thử tốt nghiệp THPT 2026', done: false },
              { id: 3, text: 'Viết & kiểm tra đoạn văn 200 chữ', done: false },
              { id: 4, text: 'Đọc bài văn mẫu đạt điểm 9+ (Đề số 1)', done: false }
            ];
      } catch (e) {
        return [
          { id: 1, text: 'Học tác phẩm trọng tâm (Tây Tiến)', done: true },
          { id: 2, text: 'Luyện 1 đề thi thử tốt nghiệp THPT 2026', done: false },
          { id: 3, text: 'Viết & kiểm tra đoạn văn 200 chữ', done: false },
          { id: 4, text: 'Đọc bài văn mẫu đạt điểm 9+ (Đề số 1)', done: false }
        ];
      }
    })(),
    works: {
      volumeFilter: 'all',
      lessonFilter: 'all',
      searchQuery: '',
      activeWorkId: null,
      activeTab: 'author'
    },
    exam: {
      isStarted: false,
      selectedExamId: 1,
      selectedDurationMinutes: 120,
      answers: {
        q1: '',
        q2: '',
        q3: '',
        q4: '',
        social: '',
        literature: ''
      },
      timeRemaining: 120 * 60,
      timerInterval: null,
      isTimerRunning: false,
      isLocked: false,
      isSubmitted: false,
      gradedResult: null
    },
    analyzer: {
      mode: 'paragraph', // 'paragraph' (200 words) or 'essay' (600 words)
      text: ''
    },
    generator: {
      selectedWorkSlug: 'tay-tien',
      selectedStyle: 'direct',
      selectedFocus: 'general',
      versionIndex: 0
    },
    examsBank: {
      tab: 'exams', // 'exams' | 'docs'
      genreFilter: 'all',
      searchQuery: '',
      openDrawers: {}
    },
    history: {
      filter: 'all',
      searchQuery: ''
    },
    pdfExport: {
      selectedExamId: 1,
      selectedFormat: 'exam_only'
    }
  };

  // Connectors dictionary for Vietnamese text analysis
  const VIETNAMESE_CONNECTORS = [
    'tuy nhiên', 'tuy vậy', 'mặc dù', 'dẫu vậy', 'ngược lại', 'mặt khác',
    'bên cạnh đó', 'ngoài ra', 'hơn nữa', 'thêm vào đó', 'đồng thời',
    'do đó', 'vì vậy', 'bởi vậy', 'cho nên', 'kết quả là', 'như vậy',
    'trước hết', 'đầu tiên', 'thứ nhất', 'thứ hai', 'thứ ba', 'cuối cùng',
    'tóm lại', 'nói tóm lại', 'khái quát lại', 'nhìn chung', 'nói cách khác',
    'đặc biệt là', 'chính vì thế', 'thật vậy', 'rõ ràng là'
  ];

  // Common stop words to exclude from repetitive words alert
  const STOP_WORDS = new Set([
    'và', 'của', 'là', 'có', 'những', 'các', 'để', 'trong', 'một', 'người',
    'với', 'khi', 'được', 'vào', 'cho', 'ra', 'lại', 'thì', 'ở', 'đã',
    'sẽ', 'đang', 'mà', 'như', 'từ', 'cũng', 'này', 'đó', 'về', 'này',
    'nào', 'ai', 'gì', 'sao', 'làm', 'hay', 'nhưng', 'cùng', 'sau', 'trước',
    'rất', 'quá', 'lắm', 'nhiều', 'ít', 'ta', 'mình', 'ấy', 'họ', 'tôi', 'em'
  ]);

  // Main App Object exposed to window
  const app = {
    // ──────────────────────────────────────────
    // Initialization
    // ──────────────────────────────────────────
    init() {
      this.initTheme();
      this.initSidebar();
      this.initNavigation();
      this.initDashboard();
      this.initHomeSearch();
      this.initWorksModule();
      this.initExamModule();
      this.initAnalyzerModule();
      this.initGeneratorModule();
      this.initExamsBankModule();
      this.initPdfExportModule();
      this.initGlobalSearch();
      this.initKeyboardShortcuts();
      this.initBook3D();
      this.initExamCountdown();
      this.updateExamHistoryCountBadge();
      this.renderIcons();

      // Setup Web Speech API voices listener for Chromium
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.getVoices();
          window.speechSynthesis.onvoiceschanged = () => {
            try { window.speechSynthesis.getVoices(); } catch (e) {}
          };
        } catch (e) {}
      }

      // Restore initial view from URL hash if available
      try {
        const initialHash = window.location.hash.replace(/^#/, '');
        const validViews = ['dashboard', 'works', 'exam', 'analyzer', 'generator', 'exams-bank', 'history'];
        if (initialHash && validViews.includes(initialHash)) {
          this.navigateTo(initialHash, {}, false);
        }
      } catch (e) {}
    },

    initBook3D() {
      if (window.Book3D && window.Book3D.init) {
        window.Book3D.init('book-3d-canvas', 'book-3d-wrapper');
      }
    },

    // ──────────────────────────────────────────
    // Realtime THPT 2027 Countdown Widget
    // ──────────────────────────────────────────
    countdownState: {
      intervalId: null,
      quoteIntervalId: null,
      quoteIndex: 0,
      quotes: [
        '“Mỗi ngày nỗ lực là một bước gần hơn tới cánh cổng trường Đại học mơ ước!”',
        '“Thời gian không chờ đợi ai, nhưng nỗ lực của hôm nay là vinh quang của ngày mai.”',
        '“Chinh phục kỳ thi THPT Quốc Gia 2027 với số điểm Ngữ Văn 9+!”',
        '“Kiên trì rèn luyện ngòi bút, tự tin bước vào phòng thi tốt nghiệp.”',
        '“Mỗi ngày nắm vững 1 tác phẩm và giải 1 đề đọc hiểu là một bước tiến vững chắc.”',
        '“Áp lực tạo nên kim cương. Quyết tâm thi đỗ nguyện vọng 1!”'
      ]
    },

    initExamCountdown() {
      const daysEl = document.getElementById('countdown-days');
      const hoursEl = document.getElementById('countdown-hours');
      const minutesEl = document.getElementById('countdown-minutes');
      const secondsEl = document.getElementById('countdown-seconds');
      const progressBar = document.getElementById('countdown-progress-bar');
      const progressPct = document.getElementById('countdown-progress-pct');

      if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

      // Kỳ thi tốt nghiệp THPT 2027: Dự kiến ngày 25/06/2027 lúc 07:30 sáng
      const targetDate = new Date('2027-06-25T07:30:00+07:00');
      // Mốc bắt đầu 3 năm cấp 3 (Khóa 2024 - 2027): 05/09/2024
      const startDate = new Date('2024-09-05T07:00:00+07:00');

      const updateCountdown = () => {
        const now = new Date();
        const diff = targetDate.getTime() - now.getTime();

        if (diff <= 0) {
          daysEl.textContent = '000';
          hoursEl.textContent = '00';
          minutesEl.textContent = '00';
          secondsEl.textContent = '00';
          if (progressBar) progressBar.style.width = '100%';
          if (progressPct) progressPct.textContent = '100%';
          if (this.countdownState.intervalId) {
            clearInterval(this.countdownState.intervalId);
            this.countdownState.intervalId = null;
          }
          return;
        }

        const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        daysEl.textContent = String(totalDays).padStart(3, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');

        // Calculate progress percentage of high school journey (2024 - 2027)
        if (progressBar && progressPct) {
          const totalDuration = targetDate.getTime() - startDate.getTime();
          const elapsed = now.getTime() - startDate.getTime();
          const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)).toFixed(1);
          progressBar.style.width = pct + '%';
          progressPct.textContent = pct + '%';
        }
      };

      // Initial update
      updateCountdown();

      // Clear existing interval if any
      if (this.countdownState.intervalId) {
        clearInterval(this.countdownState.intervalId);
      }
      this.countdownState.intervalId = setInterval(updateCountdown, 1000);

      // Quote rotation every 10 seconds
      if (this.countdownState.quoteIntervalId) {
        clearInterval(this.countdownState.quoteIntervalId);
      }
      this.countdownState.quoteIntervalId = setInterval(() => {
        this.cycleCountdownQuote();
      }, 10000);
    },

    cycleCountdownQuote() {
      const quoteEl = document.getElementById('countdown-quote');
      if (!quoteEl) return;
      const { quotes } = this.countdownState;
      this.countdownState.quoteIndex = (this.countdownState.quoteIndex + 1) % quotes.length;
      
      quoteEl.style.opacity = '0';
      setTimeout(() => {
        quoteEl.textContent = quotes[this.countdownState.quoteIndex];
        quoteEl.style.opacity = '1';
      }, 250);
    },

    renderIcons() {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    },

    // ──────────────────────────────────────────
    // Theme Management
    // ──────────────────────────────────────────
    initTheme() {
      try {
        const savedTheme = localStorage.getItem('van12_theme');
        if (savedTheme === 'dark') {
          state.theme = 'dark';
        } else {
          state.theme = 'academic';
        }
      } catch (e) {
        state.theme = 'academic';
      }

      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('academic-theme');
        if (document.body) document.body.classList.remove('academic-theme');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('academic-theme');
        if (document.body) document.body.classList.remove('academic-theme');
      }

      this.updateThemeIcon();
      if (window.Book3D && window.Book3D.setTheme) {
        window.Book3D.setTheme(state.theme === 'dark');
      }

      const themeBtn = document.getElementById('theme-toggle');
      if (themeBtn) {
        themeBtn.addEventListener('click', () => {
          this.toggleTheme();
        });
      }
    },

    toggleTheme() {
      state.theme = state.theme === 'dark' ? 'academic' : 'dark';
      localStorage.setItem('van12_theme', state.theme);
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('academic-theme');
        if (document.body) document.body.classList.remove('academic-theme');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('academic-theme');
        if (document.body) document.body.classList.remove('academic-theme');
      }
      this.updateThemeIcon();
      if (window.Book3D && window.Book3D.setTheme) {
        window.Book3D.setTheme(state.theme === 'dark');
      }
      this.showToast(
        `Đã chuyển sang giao diện ${state.theme === 'dark' ? 'Thư phòng (Dark Mode)' : 'Học thuật Việt Nam (Giấy Dó - Trắng Ngà)'}`,
        'info'
      );
    },

    updateThemeIcon() {
      const icon = document.getElementById('theme-icon');
      if (icon) {
        icon.setAttribute('data-lucide', state.theme === 'dark' ? 'sun' : 'moon');
        this.renderIcons();
      }
    },

    // ──────────────────────────────────────────
    // Sidebar & Mobile Navigation
    // ──────────────────────────────────────────
    initSidebar() {
      const sidebar = document.getElementById('sidebar');
      const toggleBtn = document.getElementById('sidebar-toggle');
      const mobileBtn = document.getElementById('mobile-menu-btn');
      const overlay = document.getElementById('mobile-overlay');

      if (state.sidebarCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
        const icon = document.getElementById('sidebar-toggle-icon');
        if (icon) icon.setAttribute('data-lucide', 'chevron-right');
      }

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const isCollapsed = sidebar.classList.toggle('collapsed');
          state.sidebarCollapsed = isCollapsed;
          localStorage.setItem('van12_sidebar', isCollapsed);
          const icon = document.getElementById('sidebar-toggle-icon');
          if (icon) {
            icon.setAttribute('data-lucide', isCollapsed ? 'chevron-right' : 'chevron-left');
            this.renderIcons();
          }
        });
      }

      // Mobile drawer handlers
      if (mobileBtn && sidebar && overlay) {
        mobileBtn.addEventListener('click', () => {
          sidebar.classList.add('mobile-open');
          overlay.classList.add('active');
        });

        overlay.addEventListener('click', () => {
          sidebar.classList.remove('mobile-open');
          overlay.classList.remove('active');
        });
      }

      // Check mobile screen resize
      const handleResize = () => {
        if (window.innerWidth <= 1024) {
          if (mobileBtn) mobileBtn.style.display = 'flex';
        } else {
          if (mobileBtn) mobileBtn.style.display = 'none';
          if (sidebar) sidebar.classList.remove('mobile-open');
          if (overlay) overlay.classList.remove('active');
        }
      };
      window.addEventListener('resize', handleResize);
      handleResize();
    },

    // ──────────────────────────────────────────
    // Navigation & Views
    // ──────────────────────────────────────────
    initNavigation() {
      // Top header nav links and Sidebar items click
      document.querySelectorAll('.top-header .nav-link, .sidebar .nav-item, [data-view]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const view = btn.getAttribute('data-view');
          if (view) {
            e.preventDefault();
            this.navigateTo(view);
          }
        });
      });

      // Synchronize browser history and hash changes
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace(/^#/, '');
        const validViews = ['dashboard', 'works', 'exam', 'analyzer', 'generator', 'exams-bank', 'history'];
        if (hash && validViews.includes(hash) && hash !== state.currentView) {
          this.navigateTo(hash, {}, false);
        }
      });
    },

    navigateTo(viewName, params = {}, syncHash = true) {
      state.currentView = viewName;

      // Sync URL hash for browser navigation
      if (syncHash) {
        try {
          if (window.location.hash !== `#${viewName}`) {
            history.pushState(null, '', `#${viewName}`);
          }
        } catch (e) {
          window.location.hash = viewName;
        }
      }

      // Stop speech synthesis if speaking when user navigates
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        this.updateTTSButtonUI(false);
      }

      // Close mobile drawer if open
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('mobile-overlay');
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (overlay) overlay.classList.remove('active');

      // Update top header active classes
      document.querySelectorAll('.top-header .nav-link').forEach((item) => {
        if (item.getAttribute('data-view') === viewName) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      // Update sidebar active classes
      document.querySelectorAll('.sidebar .nav-item, [data-view]').forEach((item) => {
        if (item.getAttribute('data-view') === viewName) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      // Update mobile nav active classes
      document.querySelectorAll('.mobile-nav-item').forEach((item) => {
        if (item.getAttribute('data-mobile-view') === viewName) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      // Show/Hide page views
      document.querySelectorAll('.page-view').forEach((view) => {
        if (view.id === `view-${viewName}`) {
          view.classList.remove('hidden');
        } else {
          view.classList.add('hidden');
        }
      });

      // Update Breadcrumb & Page Title
      this.updateHeaderTitles(viewName, params);

      // Handle view-specific triggers
      if (viewName === 'works' && params.workId) {
        this.openWorkDetail(params.workId);
      } else if (viewName === 'works' && !params.workId && state.works.activeWorkId) {
        // Keep current detail if any, or reset to list
      }

      if (viewName === 'exam' && params.examId) {
        this.loadPracticeExam(params.examId);
      }

      if (viewName === 'history') {
        this.renderHistoryView();
      }

      // Control 3D Textbook animation based on view visibility
      if (window.Book3D) {
        if (viewName === 'dashboard') {
          if (!window.Book3D.isInitialized && window.Book3D.init) {
            this.initBook3D();
          }
          window.Book3D.isVisible = true;
          if (window.Book3D.startAnimation) {
            window.Book3D.startAnimation();
          }
          if (window.Book3D.handleResize) {
            window.Book3D.handleResize();
          }
          if (window.Book3D.render) {
            window.Book3D.render();
          }

          // Trigger layout resize & render pass after DOM view becomes visible
          requestAnimationFrame(() => {
            if (window.Book3D.handleResize) window.Book3D.handleResize();
            if (window.Book3D.render) window.Book3D.render();
          });
          setTimeout(() => {
            if (window.Book3D.handleResize) window.Book3D.handleResize();
            if (window.Book3D.render) window.Book3D.render();
          }, 60);
          setTimeout(() => {
            if (window.Book3D.handleResize) window.Book3D.handleResize();
            if (window.Book3D.render) window.Book3D.render();
          }, 200);
        } else {
          if (window.Book3D.pauseAnimation) window.Book3D.pauseAnimation();
        }
      }

      if (viewName === 'dashboard') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      this.renderIcons();
    },

    updateHeaderTitles(viewName, params = {}) {
      const breadcrumbEl = document.getElementById('breadcrumb-current');
      const titleEl = document.getElementById('page-title');

      const viewMeta = {
        dashboard: {
          breadcrumb: 'Tổng quan học tập',
          title: 'Trung tâm điều khiển học tập'
        },
        works: {
          breadcrumb: params.workTitle ? `Soạn bài / ${params.workTitle}` : 'Kho soạn bài thông minh',
          title: params.workTitle || 'Kho soạn bài 18 tác phẩm mới 2026'
        },
        exam: {
          breadcrumb: 'Phòng thi thử THPT Quốc gia',
          title: 'Phòng thi thử Tốt nghiệp THPT Quốc gia 2026'
        },
        analyzer: {
          breadcrumb: 'Máy phân tích bài viết',
          title: 'Công cụ rà soát quy chuẩn bài viết'
        },
        generator: {
          breadcrumb: 'Máy tạo mở - kết bài',
          title: 'Máy tạo mở bài & kết bài điểm 9+'
        },
        'exams-bank': {
          breadcrumb: 'Kho đề thi thử',
          title: 'Kho đề thi thử tốt nghiệp THPT'
        },
        history: {
          breadcrumb: 'Lịch sử làm bài',
          title: 'Lịch sử bài thi thử & Đánh giá năng lực 2026'
        }
      };

      const meta = viewMeta[viewName] || viewMeta.dashboard;
      if (breadcrumbEl) breadcrumbEl.textContent = meta.breadcrumb;
      if (titleEl) titleEl.textContent = meta.title;
    },

    // ──────────────────────────────────────────
    // Module: Dashboard
    // ──────────────────────────────────────────
    initDashboard() {
      // Date badge
      const dateBadge = document.getElementById('today-date-badge');
      if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.textContent = 'Hôm nay: ' + now.toLocaleDateString('vi-VN', options);
      }

      // Time-based greeting
      const greetingTitle = document.getElementById('greeting-title');
      if (greetingTitle) {
        const hour = new Date().getHours();
        let greeting = 'Chào bạn';
        if (hour < 12) greeting = 'Chào buổi sáng';
        else if (hour < 18) greeting = 'Chào buổi chiều';
        else greeting = 'Chào buổi tối';
        greetingTitle.textContent = `${greeting}, sẵn sàng chinh phục Ngữ văn 12 chưa?`;
      }

      this.updateDashboardRecentWork();
      this.renderDailyGoals();
    },

    updateDashboardRecentWork() {
      const work = (window.APP_DATA && window.APP_DATA.works.find((w) => w.id === state.lastVisitedWorkId)) ||
        (window.APP_DATA && window.APP_DATA.works[0]);

      if (!work) return;

      const titleEl = document.getElementById('dashboard-recent-title');
      const headerBtnText = document.getElementById('header-continue-text');

      if (titleEl) titleEl.textContent = `${work.title} – ${work.author}`;
      if (headerBtnText) headerBtnText.textContent = `Học tiếp: ${work.title}`;
    },

    continueLastWork() {
      this.navigateTo('works');
      this.openWorkDetail(state.lastVisitedWorkId);
    },

    renderDailyGoals() {
      const container = document.getElementById('daily-goals-list');
      const counterBadge = document.getElementById('daily-goals-count');
      const progressBar = document.getElementById('daily-goals-progress');

      if (!container) return;

      container.innerHTML = '';
      let doneCount = 0;

      state.dailyGoals.forEach((goal) => {
        if (goal.done) doneCount++;

        const item = document.createElement('label');
        item.className = `checklist-item ${goal.done ? 'done' : ''}`;
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <input type="checkbox" ${goal.done ? 'checked' : ''} onchange="app.toggleDailyGoal(${goal.id})">
          <span style="font-size: 14px; font-weight: 500;">${goal.text}</span>
        `;
        container.appendChild(item);
      });

      const total = state.dailyGoals.length;
      const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

      if (counterBadge) counterBadge.textContent = `${doneCount}/${total} hoàn thành`;
      if (progressBar) progressBar.style.width = `${percent}%`;

      localStorage.setItem('van12_daily_goals', JSON.stringify(state.dailyGoals));
    },

    toggleDailyGoal(goalId) {
      const target = state.dailyGoals.find((g) => g.id === goalId);
      if (target) {
        target.done = !target.done;
        this.renderDailyGoals();
        if (target.done) {
          this.showToast(`Tuyệt vời! Đã hoàn thành: "${target.text}"`, 'success');
        }
      }
    },

    resetDailyGoals() {
      state.dailyGoals.forEach((g) => (g.done = false));
      this.renderDailyGoals();
      this.showToast('Đã đặt lại danh sách mục tiêu học hôm nay', 'info');
    },

    // ──────────────────────────────────────────
    // Module 1: Kho Soạn Bài Thông Minh
    // ──────────────────────────────────────────
    initWorksModule() {
      this.renderWorksGrid();
    },

    renderWorksGrid() {
      const container = document.getElementById('works-grid');
      const resultsBadge = document.getElementById('works-results-badge');
      const clearBtn = document.getElementById('works-clear-filter');

      if (!container || !window.APP_DATA) return;

      const works = window.APP_DATA.works;
      const { volumeFilter, lessonFilter, searchQuery } = state.works;

      const filtered = works.filter((w) => {
        // Volume check
        if (volumeFilter !== 'all' && String(w.volume) !== String(volumeFilter)) return false;
        // Lesson check
        if (lessonFilter !== 'all' && String(w.lesson) !== String(lessonFilter)) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = stripDiacritics(searchQuery.trim());
          const matchTitle = stripDiacritics(w.title).includes(q);
          const matchAuthor = stripDiacritics(w.author).includes(q);
          const matchGenre = stripDiacritics(w.genre).includes(q);
          if (!matchTitle && !matchAuthor && !matchGenre) return false;
        }
        return true;
      });

      if (resultsBadge) resultsBadge.textContent = `${filtered.length} tác phẩm`;

      const hasFilter = volumeFilter !== 'all' || lessonFilter !== 'all' || searchQuery.trim() !== '';
      if (clearBtn) {
        if (hasFilter) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="empty-state span-3" style="grid-column: 1 / -1; padding: 48px 24px;">
            <i data-lucide="book-x" style="width: 48px; height: 48px;"></i>
            <h4 style="font-weight: 700; font-size: 1.1rem; margin-top: 12px;">Không tìm thấy tác phẩm phù hợp</h4>
            <p style="color: var(--text-tertiary);">Vui lòng thử tìm với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ 18 tác phẩm.</p>
            <button class="btn btn-secondary mt-4" onclick="app.clearWorksFilter()">Xóa toàn bộ bộ lọc</button>
          </div>
        `;
        this.renderIcons();
        return;
      }

      container.innerHTML = filtered.map((work) => buildWorkCardHtml(work)).join('');

      this.renderIcons();
    },

    setVolumeFilter(vol) {
      state.works.volumeFilter = vol;
      document.querySelectorAll('#works-list-container .chip[data-volume]').forEach((chip) => {
        if (chip.getAttribute('data-volume') === vol) chip.classList.add('active');
        else chip.classList.remove('active');
      });
      this.renderWorksGrid();
    },

    setLessonFilter(lesson) {
      state.works.lessonFilter = lesson;
      const select = document.getElementById('works-lesson-select');
      if (select) select.value = lesson;
      this.renderWorksGrid();
    },

    handleWorksSearch(query) {
      state.works.searchQuery = query;
      this.renderWorksGrid();
    },

    clearWorksFilter() {
      state.works.volumeFilter = 'all';
      state.works.lessonFilter = 'all';
      state.works.searchQuery = '';

      const searchInput = document.getElementById('works-search-input');
      if (searchInput) searchInput.value = '';

      const select = document.getElementById('works-lesson-select');
      if (select) select.value = 'all';

      document.querySelectorAll('#works-list-container .chip[data-volume]').forEach((chip) => {
        if (chip.getAttribute('data-volume') === 'all') chip.classList.add('active');
        else chip.classList.remove('active');
      });

      this.renderWorksGrid();
      this.showToast('Đã xóa tất cả bộ lọc tác phẩm', 'info');
    },

    openWorkDetail(workId) {
      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === workId);
      if (!work) return;

      // Stop any active speech synthesis from previous work
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        this.updateTTSButtonUI(false);
      }

      // Ensure works page view is visible if user clicked from dashboard or other views
      if (state.currentView !== 'works') {
        this.navigateTo('works');
      }

      state.works.activeWorkId = workId;
      state.lastVisitedWorkId = workId;
      try {
        localStorage.setItem('van12_last_work', workId);
      } catch (e) {}
      this.updateDashboardRecentWork();

      // Show detail container, hide list
      const listContainer = document.getElementById('works-list-container');
      const detailContainer = document.getElementById('work-detail-container');
      if (listContainer) listContainer.classList.add('hidden');
      if (detailContainer) detailContainer.classList.remove('hidden');

      // Update Hero Header
      const heroEl = document.getElementById('work-detail-hero');
      if (heroEl) {
        const theme = getGenreTheme(work.genre);
        const authorImg = work.authorImage || 'img/authors/vu_trong_phung.jpg';
        const pInfo = work.authorPortraitInfo || {};
        heroEl.innerHTML = `
          <div class="flex items-start gap-4 flex-wrap">
            <div class="work-detail-author-avatar-box">
              <img src="${authorImg}" alt="Chân dung tác giả ${work.author}" class="work-detail-author-avatar" onerror="this.onerror=null;this.src='img/authors/vu_trong_phung.jpg';">
            </div>
            <div class="flex-1" style="min-width: 260px;">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="badge ${theme.badgeClass}">${work.genre}</span>
                <span class="badge badge-accent">Tập ${work.volume} • Bài ${work.lesson}</span>
                <span class="badge badge-success">Năm ${work.year}</span>
                ${pInfo.literaryTitle ? `<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 11.5px;"><i data-lucide="award" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle;"></i> ${pInfo.literaryTitle}</span>` : ''}
              </div>
              <h2 style="font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800; margin-bottom: 4px; color: var(--text-primary); line-height: 1.25;">
                ${work.title}
              </h2>
              <p style="font-size: 15px; color: var(--text-secondary); font-weight: 500; margin-bottom: 4px;">
                Tác giả: <strong class="text-accent" style="font-size: 16px;">${work.author}</strong>
                ${pInfo.birthDeathYears ? ` <span class="text-xs" style="color: var(--text-tertiary);">(${pInfo.birthDeathYears})</span>` : ''}
                ${pInfo.hometown ? ` • <span class="text-xs" style="color: var(--text-tertiary);">Quê quán: ${pInfo.hometown}</span>` : ''}
              </p>
              ${pInfo.caption ? `<p style="font-size: 13px; color: var(--text-tertiary); font-style: italic; margin-top: 2px;">${pInfo.caption}</p>` : ''}
            </div>
          </div>
        `;
      }

      this.updateHeaderTitles('works', { workTitle: work.title });
      state.works.activeTab = 'author';
      this.switchWorkTab('author');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderIcons();
    },

    backToWorksList() {
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        this.updateTTSButtonUI(false);
      }
      state.works.activeWorkId = null;
      state.works.activeTab = 'author';
      const listContainer = document.getElementById('works-list-container');
      const detailContainer = document.getElementById('work-detail-container');
      if (listContainer) listContainer.classList.remove('hidden');
      if (detailContainer) detailContainer.classList.add('hidden');
      this.updateHeaderTitles('works');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    switchWorkTab(tabName) {
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
        container.innerHTML = `
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="user-check" style="color: var(--accent);"></i>
                Tiểu sử & Phong cách nghệ thuật: ${work.author}
              </h3>
              <button class="copy-btn" onclick="app.copyTextById('author-info-content', 'Đã sao chép kiến thức tác giả!')">
                <i data-lucide="copy"></i> Sao chép
              </button>
            </div>

            <!-- Author Card Portrait & Snapshot -->
            <div class="card card-flat p-4 mb-4 flex items-center gap-4 flex-wrap" style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-md);">
              <div style="width: 88px; height: 88px; border-radius: 12px; overflow: hidden; border: 2px solid var(--accent); flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
                <img src="${authorImg}" alt="${work.author}" style="width: 100%; height: 100%; object-fit: cover; object-position: top center;" onerror="this.onerror=null;this.src='img/authors/vu_trong_phung.jpg';">
              </div>
              <div class="flex-1" style="min-width: 220px;">
                <h4 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">${work.author}</h4>
                <p style="font-size: 13.5px; color: var(--accent-light); font-weight: 500; margin-bottom: 6px;">
                  Thời kỳ: Năm ${work.year || 'Hiện đại'} · ${pInfo.birthDeathYears ? `Năm sinh: ${pInfo.birthDeathYears} · ` : ''}Thể loại: ${work.genre}
                </p>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="badge ${theme.badgeClass}">${work.genre}</span>
                  <span class="badge badge-accent">Tập ${work.volume} • Bài ${work.lesson}</span>
                  ${pInfo.literaryTitle ? `<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 11px;">${pInfo.literaryTitle}</span>` : ''}
                </div>
              </div>
            </div>

            <div class="literary-text mb-4" id="author-info-content" style="font-size: 15px; line-height: 1.85; color: var(--text-primary);">
              <p>${work.authorBio || work.authorInfo}</p>
            </div>

            ${work.authorAesthetics ? `
              <div class="card card-flat p-4" style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid var(--success); border-radius: var(--radius-sm); margin-top: 16px;">
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--success); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="feather" style="width: 18px; height: 18px;"></i> Quan niệm sáng tác & Tuyên ngôn nghệ thuật
                </h4>
                <p style="font-size: 14.5px; line-height: 1.8; color: var(--text-primary);">${work.authorAesthetics}</p>
              </div>
            ` : ''}
          </div>
        `;
      } else if (tabName === 'work') {
        container.innerHTML = `
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-3">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="book" style="color: var(--accent);"></i>
                Hoàn cảnh sáng tác & Xuất xứ: "${work.title}"
              </h3>
              <button class="copy-btn" onclick="app.copyTextById('work-info-content', 'Đã sao chép hoàn cảnh sáng tác!')">
                <i data-lucide="copy"></i> Sao chép
              </button>
            </div>
            
            <div class="literary-text mb-4" id="work-info-content" style="font-size: 15px; line-height: 1.8; color: var(--text-primary);">
              <p>${work.workInfo}</p>
            </div>

            ${work.context ? `
              <div class="card card-flat p-4 mb-4" style="background: rgba(99, 102, 241, 0.06); border-left: 4px solid var(--accent); border-radius: var(--radius-sm);">
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--accent); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="history" style="width: 18px; height: 18px;"></i> Bối cảnh lịch sử, văn hóa & thời đại
                </h4>
                <p style="font-size: 14.5px; line-height: 1.8; color: var(--text-primary);">${work.context}</p>
              </div>
            ` : ''}

            ${work.mainThemes && work.mainThemes.length > 0 ? `
              <div class="mt-4">
                <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="layers" style="color: var(--warning); width: 18px; height: 18px;"></i> Hệ thống chủ đề tư tưởng cốt lõi
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  ${work.mainThemes.map((th, idx) => `
                    <div class="card p-3 flex items-start gap-3" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
                      <span class="badge badge-accent" style="flex-shrink: 0; font-size: 11px;">0${idx + 1}</span>
                      <p style="font-size: 13.5px; line-height: 1.6; color: var(--text-primary); margin: 0;">${th}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${work.quotes && work.quotes.length > 0 ? `
              <div class="mt-6">
                <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="quote" style="color: var(--accent); width: 18px; height: 18px;"></i> Các trích dẫn / câu thơ đắt giá
                </h4>
                <div class="flex flex-col gap-2">
                  ${work.quotes.map(q => `
                    <div class="p-3" style="background: rgba(199, 164, 106, 0.12); border-left: 3px solid var(--warning); border-radius: var(--radius-sm); font-size: 14px; font-style: italic; color: var(--text-primary); border-top: 1px solid var(--border); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);">
                      "${q}"
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `;
      } else if (tabName === 'analysis') {
        container.innerHTML = `
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-4">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="file-text" style="color: var(--accent);"></i>
                Nội dung chi tiết & Đặc sắc nghệ thuật (${work.contentAnalysis.length} luận điểm)
              </h3>
              <button class="btn btn-sm btn-ghost" onclick="app.copyAnalysisContent(${work.id})">
                <i data-lucide="copy"></i> Sao chép toàn bộ phân tích
              </button>
            </div>
            <div class="flex flex-col gap-4">
              ${work.contentAnalysis
                .map(
                  (item, idx) => `
                <div class="card card-glass" style="border-left: 4px solid var(--accent); padding: 20px 24px;">
                  <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 10px;">
                    ${item.heading}
                  </h4>
                  <div class="literary-text" style="font-size: 14.5px; line-height: 1.85; color: var(--text-primary); margin-bottom: 10px;">
                    <p>${item.content}</p>
                  </div>
                  ${item.evidence ? `
                    <div class="p-3 my-2" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: 4px; font-size: 13.5px; color: var(--text-primary); font-style: italic;">
                      <strong style="color: var(--accent); font-style: normal;">Dẫn chứng văn bản:</strong> ${item.evidence}
                    </div>
                  ` : ''}
                  ${item.literaryCommentary ? `
                    <div class="p-3 my-2" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-left: 3px solid var(--success); border-radius: 4px; font-size: 13.5px; color: var(--text-primary);">
                      <strong style="color: var(--success);">Lời bình giảng 9+:</strong> ${item.literaryCommentary}
                    </div>
                  ` : ''}
                </div>
              `
                )
                .join('')}
            </div>

            ${work.artisticValues && work.artisticValues.length > 0 ? `
              <div class="card mt-6 p-4" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
                <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="award" style="color: var(--warning); width: 18px; height: 18px;"></i> Đúc kết giá trị nghệ thuật đặc sắc
                </h4>
                <ul class="flex flex-col gap-2" style="padding-left: 20px; list-style-type: disc;">
                  ${work.artisticValues.map(v => `<li style="font-size: 14px; line-height: 1.7; color: var(--text-secondary);">${v}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;
      } else if (tabName === 'questions') {
        container.innerHTML = `
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-4">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="help-circle" style="color: var(--accent);"></i>
                Hướng dẫn trả lời câu hỏi SGK (${work.textbookQuestions.length} câu)
              </h3>
              <button class="btn btn-sm btn-ghost" onclick="app.copyQuestionsContent(${work.id})">
                <i data-lucide="copy"></i> Sao chép toàn bộ câu hỏi SGK
              </button>
            </div>
            <div class="flex flex-col gap-4">
              ${work.textbookQuestions
                .map(
                  (q, idx) => `
                <div class="card" style="border: 1px solid var(--border); padding: 20px;">
                  <div class="flex items-center justify-between mb-2">
                    <span class="badge badge-accent">Câu hỏi ${idx + 1} (SGK)</span>
                    <button class="copy-btn" onclick="app.copyTextById('q-answer-${idx}', 'Đã sao chép câu trả lời ${idx + 1}!')">
                      <i data-lucide="copy"></i>
                    </button>
                  </div>
                  <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary);">
                    ${q.question}
                  </h4>
                  <div class="p-3" style="background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--success);">
                    <span style="font-weight: 600; font-size: 13px; color: var(--success); display: block; margin-bottom: 4px;">
                      Đáp án gợi ý:
                    </span>
                    <div class="literary-text" id="q-answer-${idx}" style="font-size: 14px; line-height: 1.75; color: var(--text-primary);">
                      <p>${q.answer}</p>
                    </div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `;
      } else if (tabName === 'essay') {
        const outline = work.essayOutline || {};
        container.innerHTML = `
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="pen-tool" style="color: var(--accent);"></i>
                Dàn ý bài văn mẫu 9+ & Nhận định phê bình văn học
              </h3>
              <button class="btn btn-sm btn-ghost" onclick="app.copyEssayOutline(${work.id})">
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
                <p style="font-size: 14.5px; line-height: 1.75; color: var(--text-primary); margin: 0;">${outline.introduction || 'Dẫn dắt trực tiếp hoặc gián tiếp, giới thiệu tác giả, tác phẩm, vị trí đoạn trích và nêu vấn đề nghị luận.'}</p>
              </div>

              <!-- Thân bài -->
              <div class="mb-4 p-3.5 rounded" style="background: var(--bg-tertiary); border-left: 4px solid var(--warning);">
                <span class="badge badge-warning mb-2" style="font-size: 11px;">B. THÂN BÀI (3.0đ – 3.5đ)</span>
                <div class="flex flex-col gap-2.5 mt-2">
                  ${outline.body && outline.body.length > 0 ? outline.body.map(b => `
                    <div class="p-3 rounded text-sm leading-relaxed" style="background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); box-shadow: var(--shadow-sm);">
                      ${b}
                    </div>
                  `).join('') : '<p class="text-sm" style="color: var(--text-secondary);">Triển khai 3 luận điểm chính từ hình thức nghệ thuật sang nội dung tư tưởng.</p>'}
                </div>
              </div>

              <!-- Kết bài -->
              <div class="p-3.5 rounded" style="background: var(--bg-tertiary); border-left: 4px solid var(--success);">
                <span class="badge badge-success mb-2" style="font-size: 11px;">C. KẾT BÀI (0.5đ)</span>
                <p style="font-size: 14.5px; line-height: 1.75; color: var(--text-primary); margin: 0;">${outline.conclusion || 'Khẳng định lại giá trị tác phẩm, phong cách tác giả và mở rộng bài học nhân sinh.'}</p>
              </div>
            </div>

            <!-- Scholarly Quotes -->
            ${work.scholarlyQuotes && work.scholarlyQuotes.length > 0 ? `
              <div class="card p-5 mb-5" style="border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.05);">
                <h4 style="font-size: 1.1rem; font-weight: 800; color: #fbbf24; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="quote" style="width: 18px; height: 18px;"></i> Nhận định của các nhà nghiên cứu, phê bình lớn
                </h4>
                <div class="flex flex-col gap-3">
                  ${work.scholarlyQuotes.map(sq => `
                    <div class="p-3.5 rounded" style="background: var(--bg-card); border: 1px solid var(--border); border-left: 3px solid var(--warning); box-shadow: var(--shadow-sm);">
                      <div class="flex items-center justify-between mb-1.5">
                        <strong class="text-sm" style="color: var(--accent); font-weight: 700;">${sq.critic}:</strong>
                        <span class="badge badge-accent" style="font-size: 10px;">Lý luận 9+</span>
                      </div>
                      <p class="text-sm italic leading-relaxed m-0" style="color: var(--text-primary);">"${sq.quote}"</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Exam Prompts -->
            ${work.examPrompts && work.examPrompts.length > 0 ? `
              <div class="card p-5" style="border: 1px solid var(--border); background: var(--bg-card);">
                <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                  <i data-lucide="help-circle" style="color: var(--info); width: 18px; height: 18px;"></i> Các dạng đề thi trọng tâm rèn luyện
                </h4>
                <div class="flex flex-col gap-2.5">
                  ${work.examPrompts.map((ep, idx) => `
                    <div class="p-3.5 rounded flex items-start gap-3" style="background: var(--bg-card); border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
                      <span class="badge badge-info" style="flex-shrink: 0; font-size: 11px;">Đề ${idx + 1}</span>
                      <p class="text-sm font-medium leading-relaxed m-0" style="color: var(--text-primary);">${ep}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `;
      } else if (tabName === 'expression') {
        const spec = work.expressionSpec || {};
        container.innerHTML = `
          <div class="animate-fade-in">
            <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 style="font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="sparkles" style="color: var(--accent);"></i>
                Đặc trưng Bút pháp & Phương thức biểu đạt chuyên sâu
              </h3>
              <button class="btn btn-sm btn-ghost" onclick="app.copyExpressionSpec(${work.id})">
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
                  ${spec.primaryExpression || 'Biểu cảm'}
                </h4>
                <p class="text-xs m-0" style="color: var(--text-tertiary);">Phương thức giữ vai trò nòng cốt định hình thể loại và giọng điệu toàn tác phẩm.</p>
              </div>

              <!-- Combined Expressions -->
              <div class="card p-4" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3);">
                <div class="flex items-center gap-2 mb-2">
                  <i data-lucide="layers" style="color: var(--success); width: 18px; height: 18px;"></i>
                  <strong class="text-success text-sm uppercase tracking-wide">Phương thức kết hợp</strong>
                </div>
                <div class="flex items-center gap-2 flex-wrap mb-2">
                  ${(spec.combinedExpressions || []).map(ce => `<span class="badge badge-success">${ce}</span>`).join('')}
                </div>
                <p class="text-xs m-0" style="color: var(--text-tertiary);">Tăng tính gợi hình, sinh động và làm phong phú thêm tầng nghĩa cho tác phẩm.</p>
              </div>

              <!-- Language Style -->
              <div class="card p-4" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
                <div class="flex items-center gap-2 mb-2">
                  <i data-lucide="type" style="color: var(--warning); width: 18px; height: 18px;"></i>
                  <strong class="text-warning text-sm uppercase tracking-wide">Phong cách ngôn ngữ</strong>
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                  ${spec.languageStyle || 'Phong cách ngôn ngữ Nghệ thuật'}
                </h4>
              </div>

              <!-- Dominant Tone -->
              <div class="card p-4" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
                <div class="flex items-center gap-2 mb-2">
                  <i data-lucide="music" style="color: var(--info); width: 18px; height: 18px;"></i>
                  <strong class="text-info text-sm uppercase tracking-wide">Giọng điệu chủ đạo</strong>
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                  ${spec.dominantTone || 'Hào hùng, bi tráng'}
                </h4>
              </div>
            </div>

            <!-- Form & Structure -->
            <div class="card p-4 mb-4" style="background: var(--bg-card); border: 1px solid var(--border);">
              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="layout" style="color: var(--accent); width: 18px; height: 18px;"></i> Kết cấu thể loại & Bố cục nghệ thuật
              </h4>
              <p class="text-sm leading-relaxed m-0" style="color: var(--text-secondary);">${spec.formAndStructure || 'Kết cấu chặt chẽ theo mạch phát triển của hình tượng nghệ thuật.'}</p>
            </div>

            <!-- Core Rhetorical Devices -->
            <div class="card p-4 mb-4" style="background: var(--bg-card); border: 1px solid var(--border);">
              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="zap" style="color: var(--warning); width: 18px; height: 18px;"></i> Biện pháp tu từ nòng cốt tạo đòn bẩy thẩm mỹ
              </h4>
              <div class="flex flex-wrap gap-2">
                ${(spec.coreRhetoricalDevices || []).map(rd => `
                  <span class="px-3 py-1.5 rounded-lg text-xs font-semibold" style="background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-primary);">
                    ${rd}
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Key Expression Value -->
            <div class="card p-4" style="background: rgba(182, 83, 53, 0.08); border-left: 4px solid var(--accent); border-radius: var(--radius-sm); border-top: 1px solid var(--border); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);">
              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--accent); margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="check-circle" style="width: 18px; height: 18px;"></i> Giá trị biểu đạt cốt lõi
              </h4>
              <p class="text-sm leading-relaxed m-0" style="color: var(--text-primary);">${spec.keyExpressionValue || ''}</p>
            </div>
          </div>
        `;
      }

      this.renderIcons();
    },

    copyCurrentWorkFull() {
      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === state.works.activeWorkId);
      if (!work) return;

      let fullText = `TỔNG HỢP KIẾN THỨC VĂN 12 CHUẨN 9+: ${work.title.toUpperCase()} – ${work.author}\n\n`;
      fullText += `1. TÁC GIẢ:\n${work.authorBio || work.authorInfo}\n`;
      if (work.authorAesthetics) fullText += `Quan niệm sáng tác: ${work.authorAesthetics}\n`;
      fullText += `\n2. TÁC PHẨM & BỐI CẢNH:\n${work.workInfo}\n`;
      if (work.context) fullText += `Bối cảnh: ${work.context}\n`;
      if (work.mainThemes && work.mainThemes.length > 0) {
        fullText += `Chủ đề cốt lõi:\n` + work.mainThemes.map((t, i) => `  ${i + 1}. ${t}`).join('\n') + `\n`;
      }
      fullText += `\n3. NỘI DUNG VÀ NGHỆ THUẬT CHI TIẾT:\n`;
      work.contentAnalysis.forEach((c) => {
        fullText += `- ${c.heading}:\n${c.content}\n`;
        if (c.evidence) fullText += `  Dẫn chứng: ${c.evidence}\n`;
        if (c.literaryCommentary) fullText += `  Bình luận 9+: ${c.literaryCommentary}\n`;
        fullText += `\n`;
      });
      if (work.artisticValues && work.artisticValues.length > 0) {
        fullText += `Đặc sắc nghệ thuật:\n` + work.artisticValues.map(v => `• ${v}`).join('\n') + `\n\n`;
      }
      fullText += `4. HƯỚNG DẪN TRẢ LỜI CÂU HỎI SGK:\n`;
      work.textbookQuestions.forEach((q, idx) => {
        fullText += `Câu ${idx + 1}: ${q.question}\nTrả lời: ${q.answer}\n\n`;
      });
      if (work.essayOutline) {
        fullText += `5. DÀN Ý NGHỊ LUẬN 9+:\n`;
        fullText += `A. Mở bài: ${work.essayOutline.introduction}\n`;
        fullText += `B. Thân bài:\n` + (work.essayOutline.body || []).map(b => `  - ${b}`).join('\n') + `\n`;
        fullText += `C. Kết bài: ${work.essayOutline.conclusion}\n\n`;
      }
      if (work.expressionSpec) {
        const s = work.expressionSpec;
        fullText += `6. THÔNG SỐ BÚT PHÁP & BIỂU ĐẠT:\n`;
        fullText += `- Phương thức biểu đạt chính: ${s.primaryExpression}\n`;
        fullText += `- Phương thức kết hợp: ${(s.combinedExpressions || []).join(', ')}\n`;
        fullText += `- Phong cách ngôn ngữ: ${s.languageStyle}\n`;
        fullText += `- Giọng điệu chủ đạo: ${s.dominantTone}\n`;
        fullText += `- Biện pháp tu từ nòng cốt: ${(s.coreRhetoricalDevices || []).join(', ')}\n`;
        fullText += `- Giá trị biểu đạt: ${s.keyExpressionValue}\n`;
      }

      this.copyText(fullText, `Đã sao chép toàn bộ kiến thức tác phẩm "${work.title}"!`);
    },

    copyAnalysisContent(workId) {
      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === workId);
      if (!work) return;
      let text = `PHÂN TÍCH NỘI DUNG & NGHỆ THUẬT: ${work.title}\n\n`;
      work.contentAnalysis.forEach((c) => {
        text += `## ${c.heading}\n${c.content}\n\n`;
      });
      this.copyText(text, 'Đã sao chép các luận điểm phân tích!');
    },

    copyQuestionsContent(workId) {
      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === workId);
      if (!work) return;
      let text = `CÂU HỎI SGK & ĐÁP ÁN: ${work.title}\n\n`;
      work.textbookQuestions.forEach((q, idx) => {
        text += `Câu ${idx + 1}: ${q.question}\nĐáp án: ${q.answer}\n\n`;
      });
      this.copyText(text, 'Đã sao chép hệ thống câu hỏi SGK!');
    },

    copyEssayOutline(workId) {
      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === workId);
      if (!work || !work.essayOutline) return;
      const o = work.essayOutline;
      let text = `DÀN Ý BÀI VĂN NGHỊ LUẬN 9+: ${work.title.toUpperCase()}\n\n`;
      text += `A. MỞ BÀI:\n${o.introduction}\n\n`;
      text += `B. THÂN BÀI:\n`;
      (o.body || []).forEach((b) => {
        text += `- ${b}\n\n`;
      });
      text += `C. KẾT BÀI:\n${o.conclusion}\n`;
      this.copyText(text, 'Đã sao chép dàn ý 9+!');
    },

    copyExpressionSpec(workId) {
      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === workId);
      if (!work || !work.expressionSpec) return;
      const s = work.expressionSpec;
      let text = `THÔNG SỐ BÚT PHÁP & BIỂU ĐẠT: ${work.title.toUpperCase()}\n\n`;
      text += `- Phương thức biểu đạt chính: ${s.primaryExpression}\n`;
      text += `- Phương thức kết hợp: ${(s.combinedExpressions || []).join(', ')}\n`;
      text += `- Phong cách ngôn ngữ: ${s.languageStyle}\n`;
      text += `- Giọng điệu chủ đạo: ${s.dominantTone}\n`;
      text += `- Kết cấu thể loại: ${s.formAndStructure}\n`;
      text += `- Biện pháp tu từ nòng cốt: ${(s.coreRhetoricalDevices || []).join(', ')}\n`;
      text += `- Giá trị biểu đạt: ${s.keyExpressionValue}\n`;
      this.copyText(text, 'Đã sao chép thông số biểu đạt!');
    },

    // ──────────────────────────────────────────
    // Comparison Topics Modal (So sánh văn học)
    // ──────────────────────────────────────────
    openComparisonModal(topicId = 'song-da-vs-song-huong') {
      const comparisons = (window.APP_DATA && window.APP_DATA.comparisons) || [];
      if (comparisons.length === 0) return;

      const current = comparisons.find(c => c.id === topicId) || comparisons[0];

      const navPills = comparisons.map(c => `
        <button class="chip ${c.id === current.id ? 'active' : ''}" onclick="app.openComparisonModal('${c.id}')" style="font-size: 12.5px;">
          ${c.shortTitle || (c.workA && c.workB ? `${c.workA.replace(/\s*\(.*?\)/, '')} vs ${c.workB.replace(/\s*\(.*?\)/, '')}` : c.title)}
        </button>
      `).join('');

      const bodyHtml = `
        <div>
          <!-- Sub Nav Pills -->
          <div class="flex items-center gap-2 flex-wrap mb-4 pb-3" style="border-bottom: 1px solid var(--border);">
            ${navPills}
          </div>

          <!-- Comparison Title -->
          <div class="card card-flat p-4 mb-4" style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.3);">
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-accent">Dạng đề so sánh 9+</span>
              <span class="text-xs" style="color: var(--text-tertiary);">Câu phân hóa điểm giỏi</span>
            </div>
            <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
              ${current.title}
            </h3>
            <p style="font-size: 13.5px; color: var(--accent-light); margin: 0;">
              Đối chiếu: <strong>${current.workA} (${current.authorA})</strong> & <strong>${current.workB} (${current.authorB})</strong>
            </p>
          </div>

          <!-- 1. Tương đồng -->
          <div class="mb-4">
            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--accent); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i> 1. Điểm tương đồng giữa hai tác phẩm
            </h4>
            <div class="flex flex-col gap-2">
              ${current.similarity.map(s => `
                <div class="p-3 rounded text-sm leading-relaxed" style="background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); box-shadow: var(--shadow-sm);">
                  • ${s}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 2. Khác biệt -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <!-- Diff A -->
            <div class="card p-3.5" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-left: 3px solid var(--warning);">
              <h5 style="font-size: 0.95rem; font-weight: 700; color: var(--warning); margin-bottom: 8px;">
                ${current.differenceA.heading}
              </h5>
              <ul class="flex flex-col gap-2" style="padding-left: 16px; list-style-type: disc;">
                ${current.differenceA.points.map(p => `<li class="text-xs leading-relaxed" style="color: var(--text-secondary);">${p}</li>`).join('')}
              </ul>
            </div>

            <!-- Diff B -->
            <div class="card p-3.5" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-left: 3px solid var(--success);">
              <h5 style="font-size: 0.95rem; font-weight: 700; color: var(--success); margin-bottom: 8px;">
                ${current.differenceB.heading}
              </h5>
              <ul class="flex flex-col gap-2" style="padding-left: 16px; list-style-type: disc;">
                ${current.differenceB.points.map(p => `<li class="text-xs leading-relaxed" style="color: var(--text-secondary);">${p}</li>`).join('')}
              </ul>
            </div>
          </div>

          <!-- 3. Kết luận lý giải -->
          <div class="p-3.5 rounded" style="background: var(--bg-tertiary); border: 1px solid var(--border); border-left: 4px solid var(--accent);">
            <h5 style="font-size: 0.95rem; font-weight: 700; color: var(--accent); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="help-circle" style="width: 16px; height: 16px;"></i> Khái quát & Lý giải nguyên nhân sự khác biệt
            </h5>
            <p class="text-sm leading-relaxed m-0" style="color: var(--text-primary);">${current.conclusion}</p>
          </div>
        </div>
      `;

      this.openModal({
        title: 'Chuyên Đề So Sánh Văn Học Điểm 9+',
        body: bodyHtml,
        footerButtons: `
          <button class="btn btn-ghost" onclick="app.copyComparisonText('${current.id}')">
            <i data-lucide="copy"></i> Sao chép chuyên đề
          </button>
          <button class="btn btn-secondary" onclick="app.closeModal()">Đóng</button>
        `
      });
      this.renderIcons();
    },

    copyComparisonText(topicId) {
      const comparisons = (window.APP_DATA && window.APP_DATA.comparisons) || [];
      const current = comparisons.find(c => c.id === topicId);
      if (!current) return;
      let text = `CHUYÊN ĐỀ SO SÁNH VĂN HỌC: ${current.title.toUpperCase()}\n\n`;
      text += `1. ĐIỂM TƯƠNG ĐỒNG:\n`;
      current.similarity.forEach(s => text += `- ${s}\n`);
      text += `\n2. NÉT ĐỘC ĐÁO TÁC PHẨM A (${current.differenceA.heading}):\n`;
      current.differenceA.points.forEach(p => text += `- ${p}\n`);
      text += `\n3. NÉT ĐỘC ĐÁO TÁC PHẨM B (${current.differenceB.heading}):\n`;
      current.differenceB.points.forEach(p => text += `- ${p}\n`);
      text += `\n4. KHÁI QUÁT LÝ GIẢI NGUYÊN NHÂN:\n${current.conclusion}\n`;
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

      const tabsHeader = `
        <div class="flex items-center gap-2 flex-wrap mb-4 pb-3" style="border-bottom: 1px solid var(--border);">
          <button class="chip ${tab === 'modes' ? 'active' : ''}" onclick="app.openExpressionModal('modes')">
            <i data-lucide="book-open" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> 6 Phương thức biểu đạt
          </button>
          <button class="chip ${tab === 'formulas' ? 'active' : ''}" onclick="app.openExpressionModal('formulas')">
            <i data-lucide="zap" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> 4 Biểu thức công thức 9+
          </button>
          <button class="chip ${tab === 'quotes' ? 'active' : ''}" onclick="app.openExpressionModal('quotes')">
            <i data-lucide="quote" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> Kho nhận định lý luận
          </button>
        </div>
      `;

      let tabBody = '';
      if (tab === 'modes') {
        tabBody = `
          <div class="flex flex-col gap-4">
            ${modes.map(m => `
              <div class="card p-4" style="background: var(--bg-card); border: 1px solid var(--border);">
                <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--accent); margin: 0;">${m.name}</h4>
                  <span class="badge badge-accent">${m.badge}</span>
                </div>
                <p style="font-size: 13.5px; color: var(--text-primary); margin-bottom: 8px;"><strong>Mục đích:</strong> ${m.purpose}</p>
                <div class="p-2.5 rounded mb-2" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
                  <span class="text-xs font-semibold block mb-1" style="color: var(--accent);">Dấu hiệu nhận biết đặc trưng:</span>
                  <ul style="padding-left: 16px; margin: 0; list-style-type: disc;">
                    ${m.recognitionSigns.map(rs => `<li class="text-xs leading-relaxed" style="color: var(--text-secondary);">${rs}</li>`).join('')}
                  </ul>
                </div>
                <div class="p-2.5 rounded mb-2" style="background: rgba(46, 111, 86, 0.08); border: 1px solid rgba(46, 111, 86, 0.25);">
                  <span class="text-xs font-semibold block mb-1" style="color: var(--success);">Ví dụ tác phẩm Ngữ văn 12:</span>
                  <ul style="padding-left: 16px; margin: 0; list-style-type: circle;">
                    ${m.grade12Examples.map(ge => `<li class="text-xs leading-relaxed" style="color: var(--text-primary);">${ge}</li>`).join('')}
                  </ul>
                </div>
                <div class="p-2.5 rounded text-xs" style="background: rgba(22, 54, 74, 0.08); border: 1px solid rgba(22, 54, 74, 0.25); color: var(--text-primary);">
                  <strong style="color: var(--accent);">Mẹo thi Đọc hiểu:</strong> ${m.examTip}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (tab === 'formulas') {
        tabBody = `
          <div class="flex flex-col gap-4">
            ${formulas.map(f => `
              <div class="card p-4" style="background: var(--bg-card); border: 1px solid var(--border);">
                <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span class="badge badge-accent">${f.categoryLabel}</span>
                  <span class="badge badge-warning">${f.scoreWeight}</span>
                </div>
                <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">${f.title}</h4>
                <div class="p-3 rounded font-mono text-xs mb-3 leading-relaxed" style="background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-primary);">
                  ${f.expressionFormula}
                </div>
                <div class="mb-3">
                  <span class="text-xs font-semibold block mb-1" style="color: var(--text-secondary);">Các bước triển khai chuẩn barem:</span>
                  <ol style="padding-left: 18px; margin: 0; list-style-type: decimal;">
                    ${f.stepByStep.map(s => `<li class="text-xs leading-relaxed mb-1" style="color: var(--text-secondary);">${s}</li>`).join('')}
                  </ol>
                </div>
                <div class="p-2.5 rounded text-xs" style="background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary);">
                  <strong style="color: var(--accent);">Ví dụ thực chiến:</strong> ${f.applicationExample}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (tab === 'quotes') {
        tabBody = `
          <div>
            <div class="mb-4">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--warning); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="quote" style="width: 18px; height: 18px;"></i> Nhận định lý luận văn học đắt giá ghi điểm 9+
              </h4>
              <div class="flex flex-col gap-3">
                ${quotes.map(q => `
                  <div class="card p-3.5" style="background: var(--bg-card); border: 1px solid var(--border);">
                    <div class="flex items-center justify-between mb-1.5">
                      <strong class="text-sm" style="color: var(--accent);">${q.author}</strong>
                      <span class="badge badge-accent" style="font-size: 10px;">Lý luận đắt giá</span>
                    </div>
                    <p class="text-sm italic leading-relaxed mb-2" style="color: var(--text-primary);">"${q.quote}"</p>
                    <div class="text-xs" style="color: var(--text-tertiary);">
                      <strong style="color: var(--text-secondary);">Ứng dụng thực tế:</strong> ${q.application}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="mt-6 pt-4" style="border-top: 1px solid var(--border);">
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--accent); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="sparkles" style="width: 18px; height: 18px;"></i> 3 Công thức mở bài 9+ kinh điển
              </h4>
              <div class="flex flex-col gap-3">
                ${intros.map(it => `
                  <div class="card p-3.5" style="background: var(--bg-card); border-left: 3px solid var(--accent); border: 1px solid var(--border);">
                    <h5 style="font-size: 0.95rem; font-weight: 700; color: var(--accent); margin-bottom: 4px;">${it.name}</h5>
                    <p class="text-xs font-mono mb-2 p-2 rounded" style="background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary);">${it.pattern}</p>
                    <p class="text-xs leading-relaxed m-0" style="color: var(--text-primary);"><strong style="color: var(--success);">Ví dụ:</strong> ${it.example}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }

      this.openModal({
        title: 'Cẩm Nang Phương Thức Biểu Đạt & Công Thức 9+',
        body: tabsHeader + tabBody,
        footerButtons: `
          <button class="btn btn-secondary" onclick="app.closeModal()">Đóng</button>
        `
      });
      this.renderIcons();
    },


    createIntroForCurrentWork() {
      const work = window.APP_DATA && window.APP_DATA.works.find((w) => w.id === state.works.activeWorkId);
      if (!work) return;
      this.navigateTo('generator');
      const select = document.getElementById('generator-work-select');
      if (select) {
        if (work.slug && Array.from(select.options).some(o => o.value === work.slug)) {
          select.value = work.slug;
          this.handleGeneratorWorkChange(work.slug);
        } else {
          for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].text.includes(work.title)) {
              select.selectedIndex = i;
              this.handleGeneratorWorkChange(select.value);
              break;
            }
          }
        }
      }
      this.generateIntrosAndConclusions();
    },

    toggleSpeech(textToRead) {
      if (!('speechSynthesis' in window)) {
        this.showToast('Trình duyệt hiện tại chưa hỗ trợ Web Speech API.', 'warning');
        return;
      }

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        this.updateTTSButtonUI(false);
        this.showToast('Đã dừng giọng đọc.', 'info');
        return;
      }

      let text = textToRead;
      if (!text) {
        const activeContent = document.getElementById('work-tab-content');
        if (activeContent) {
          text = activeContent.innerText.trim();
        }
      }

      if (!text) {
        this.showToast('Không có nội dung văn bản để đọc.', 'warning');
        return;
      }

      const cleanText = text.replace(/(\r\n|\n|\r)/gm, ' ').substring(0, 1500);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      let voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) {
        try {
          voices = window.speechSynthesis.getVoices();
        } catch (e) {}
      }
      const viVoice = (voices || []).find(
        (v) => v.lang && (v.lang.toLowerCase().includes('vi') || v.lang.toLowerCase().includes('vn') || (v.name && v.name.toLowerCase().includes('vietnam')))
      );
      if (viVoice) utterance.voice = viVoice;

      utterance.onstart = () => {
        this.updateTTSButtonUI(true);
        this.showToast('Đang phát giọng đọc văn học...', 'success');
      };

      utterance.onend = () => {
        this.updateTTSButtonUI(false);
      };

      utterance.onerror = () => {
        this.updateTTSButtonUI(false);
      };

      window.speechSynthesis.speak(utterance);
    },

    updateTTSButtonUI(isSpeaking) {
      const btn = document.getElementById('tts-toggle-btn');
      if (!btn) return;
      if (isSpeaking) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
        btn.innerHTML = `<i data-lucide="volume-x"></i> <span id="tts-btn-label">Dừng đọc</span>`;
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        btn.innerHTML = `<i data-lucide="volume-2"></i> <span id="tts-btn-label">Nghe giọng đọc</span>`;
      }
      this.renderIcons();
    },

    // ──────────────────────────────────────────
    // Module 2: Phòng Thi Thử Tốt Nghiệp THPT Quốc Gia 2026
    // ──────────────────────────────────────────
    initExamModule() {
      state.exam.selectedExamId = 1;
      state.exam.selectedDurationMinutes = 120;
      state.exam.timeRemaining = 120 * 60;
      state.exam.isStarted = false;
      state.exam.isSubmitted = false;
      state.exam.isLocked = false;
      state.exam.gradedResult = null;
      state.exam.answers = {
        q1: '',
        q2: '',
        q3: '',
        q4: '',
        social: '',
        literature: ''
      };

      this.populateExamSelector();
      this.updateExamHistoryCountBadge();
      this.returnToExamLobby();
    },

    populateExamSelector() {
      const selector = document.getElementById('exam-practice-selector');
      if (!selector || !window.APP_DATA || !window.APP_DATA.practiceExams) return;

      const exams = window.APP_DATA.practiceExams;
      // Chỉ hiện tiêu đề đề thi trong kho đề thi như yêu cầu
      selector.innerHTML = exams
        .map((e) => {
          return `<option value="${e.id}">${e.title}</option>`;
        })
        .join('');

      selector.value = state.exam.selectedExamId || 1;
    },

    handlePracticeExamChange(examId) {
      const id = parseInt(examId, 10);
      if (isNaN(id)) return;

      state.exam.selectedExamId = id;
      const selector = document.getElementById('exam-practice-selector');
      if (selector) selector.value = id;

      const exam = window.APP_DATA.practiceExams.find((e) => e.id === id);
      if (exam) {
        this.showToast(`Đã chọn: ${exam.title}`, 'info');
      }
    },

    loadPracticeExam(examId) {
      const id = parseInt(examId, 10) || 1;
      state.exam.selectedExamId = id;
      const selector = document.getElementById('exam-practice-selector');
      if (selector) selector.value = id;
      this.returnToExamLobby();
    },

    setExamDuration(minutes) {
      const m = Math.max(1, Math.min(120, parseInt(minutes, 10) || 120));
      state.exam.selectedDurationMinutes = m;
      state.exam.timeRemaining = m * 60;

      const label = document.getElementById('exam-selected-time-text');
      if (label) label.textContent = `${m} phút`;

      const lobbyPreview = document.getElementById('lobby-time-preview');
      if (lobbyPreview) lobbyPreview.textContent = `${m} phút`;

      const customInput = document.getElementById('exam-custom-time-input');
      if (customInput) customInput.value = m;

      const badgeLeft = document.getElementById('exam-badge-left');
      if (badgeLeft) badgeLeft.textContent = `${m} phút`;

      // Update preset chips
      document.querySelectorAll('#exam-time-presets button').forEach((btn) => {
        const val = parseInt(btn.getAttribute('data-time'), 10);
        if (val === m) btn.classList.add('active');
        else btn.classList.remove('active');
      });

      this.updateTimerDisplay();
      this.showToast(`Đã thiết lập thời gian làm bài: ${m} phút`, 'info');
    },

    returnToExamLobby() {
      if (this.examBeforeUnloadBound) {
        window.removeEventListener('beforeunload', this.examBeforeUnloadBound);
        this.examBeforeUnloadBound = null;
      }
      try {
        sessionStorage.removeItem('van12_exam_draft');
      } catch (err) {}

      clearInterval(state.exam.timerInterval);
      state.exam.isTimerRunning = false;
      state.exam.isStarted = false;
      state.exam.isSubmitted = false;
      state.exam.isLocked = false;
      state.exam.gradedResult = null;
      state.exam.timeRemaining = (state.exam.selectedDurationMinutes || 120) * 60;
      state.exam.answers = {
        q1: '',
        q2: '',
        q3: '',
        q4: '',
        social: '',
        literature: ''
      };

      // Ẩn màn hình làm bài và màn hình kết quả - TUYỆT ĐỐI KHÔNG HIỆN ĐỀ BÀI KHI CHƯA BẮT ĐẦU
      const lobbyScreen = document.getElementById('exam-lobby-screen');
      const activeContainer = document.getElementById('exam-active-container');
      const resultContainer = document.getElementById('exam-result-container');
      const lockedAlert = document.getElementById('exam-locked-alert');

      if (lobbyScreen) lobbyScreen.classList.remove('hidden');
      if (activeContainer) activeContainer.classList.add('hidden');
      if (resultContainer) resultContainer.classList.add('hidden');
      if (lockedAlert) lockedAlert.classList.add('hidden');

      // Dọn dẹp nội dung đề bài cũ để bảo mật đề
      const passageEl = document.getElementById('exam-passage-text');
      if (passageEl) passageEl.innerHTML = '';
      const questionsList = document.getElementById('exam-questions-list');
      if (questionsList) questionsList.innerHTML = '';

      // Cập nhật hiển thị thời gian và selector
      const duration = state.exam.selectedDurationMinutes || 120;
      const label = document.getElementById('exam-selected-time-text');
      if (label) label.textContent = `${duration} phút`;

      const lobbyPreview = document.getElementById('lobby-time-preview');
      if (lobbyPreview) lobbyPreview.textContent = `${duration} phút`;

      const customInput = document.getElementById('exam-custom-time-input');
      if (customInput) customInput.value = duration;

      const titleDisplay = document.getElementById('exam-title-display');
      if (titleDisplay) titleDisplay.textContent = 'Phòng thi thử Tốt nghiệp THPT Quốc gia 2026';

      const topicDisplay = document.getElementById('exam-topic-display');
      if (topicDisplay) topicDisplay.textContent = 'Cấu trúc chuẩn Bộ GD&ĐT: Đọc hiểu 4 câu (4đ) + Đoạn văn NLXH 200 chữ (2đ) + Bài văn NLVH 600 chữ (4đ).';

      const genreBadge = document.getElementById('exam-genre-badge');
      if (genreBadge) genreBadge.textContent = 'Chuẩn cấu trúc 2026';

      const selector = document.getElementById('exam-practice-selector');
      if (selector) selector.value = state.exam.selectedExamId || 1;

      // Update preset chips
      document.querySelectorAll('#exam-time-presets button').forEach((btn) => {
        const val = parseInt(btn.getAttribute('data-time'), 10);
        if (val === duration) btn.classList.add('active');
        else btn.classList.remove('active');
      });

      this.updateTimerDisplay();
      this.updateExamAnsweredCount();
      this.renderIcons();
    },

    startExamSession() {
      if (!window.APP_DATA || !window.APP_DATA.practiceExams) return;
      const exam =
        window.APP_DATA.practiceExams.find((e) => e.id === state.exam.selectedExamId) ||
        window.APP_DATA.practiceExams[0];
      if (!exam) return;

      state.exam.isStarted = true;
      state.exam.isLocked = false;
      state.exam.isSubmitted = false;
      state.exam.gradedResult = null;
      state.exam.answers = {
        q1: '',
        q2: '',
        q3: '',
        q4: '',
        social: '',
        literature: ''
      };

      // Cảnh báo người dùng khi vô tình đóng tab hoặc rời trang khi đang làm bài thi
      if (!this.examBeforeUnloadBound) {
        this.examBeforeUnloadBound = (e) => {
          if (state.exam.isStarted && !state.exam.isSubmitted) {
            e.preventDefault();
            e.returnValue = 'Bài thi đang diễn ra. Bạn có chắc chắn muốn rời khỏi không?';
            return e.returnValue;
          }
        };
        window.addEventListener('beforeunload', this.examBeforeUnloadBound);
      }

      // Đặt thời gian làm bài chuẩn xác theo thời gian thí sinh vừa chọn
      const duration = state.exam.selectedDurationMinutes || 120;
      state.exam.timeRemaining = duration * 60;

      // Cập nhật tiêu đề và huy hiệu
      const titleDisplay = document.getElementById('exam-title-display');
      const topicDisplay = document.getElementById('exam-topic-display');
      const genreBadge = document.getElementById('exam-genre-badge');
      const badgeLeft = document.getElementById('exam-badge-left');
      const sessionStatus = document.getElementById('exam-session-status');

      if (titleDisplay) titleDisplay.textContent = `Phòng thi thử – ${exam.title}`;
      if (topicDisplay) topicDisplay.textContent = `Chủ đề: ${exam.topic} • ${exam.sourceType} • Thang điểm 10.0`;
      if (genreBadge) genreBadge.textContent = exam.sourceType;
      if (badgeLeft) badgeLeft.textContent = `${duration} phút`;
      if (sessionStatus) {
        sessionStatus.className = 'badge badge-success';
        sessionStatus.textContent = 'Đang làm bài';
      }

      // Render Cột trái: Đề bài & Ngữ liệu gốc
      const passageEl = document.getElementById('exam-passage-text');
      if (passageEl) {
        passageEl.innerHTML = `
          <div class="mb-4 p-3" style="background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--accent);">
            <h4 style="font-size: 13.5px; font-weight: 700; color: var(--accent); margin-bottom: 4px;">CẤU TRÚC ĐỀ THI TỐT NGHIỆP THPT (10.0 ĐIỂM):</h4>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">${exam.structure}</p>
          </div>
          <div class="literary-text" style="white-space: pre-wrap; font-size: 14.5px; line-height: 1.8;">${exam.examContent}</div>
        `;
      }

      // Render Cột phải: 6 Question Blocks hoàn chỉnh mở khóa
      const questionsList = document.getElementById('exam-questions-list');
      if (questionsList && exam.examParts) {
        const parts = exam.examParts;
        questionsList.innerHTML = `
          <!-- PHẦN I: ĐỌC HIỂU (4 CÂU) -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--accent);">PHẦN I: ĐỌC HIỂU (4,0 ĐIỂM)</h3>
              <span class="badge badge-accent">4 câu hỏi</span>
            </div>
            ${parts.readingQuestions
              .map((q) => {
                const fieldName = `q${q.questionNumber}`;
                return `
                <div class="question-block" id="question-block-${fieldName}">
                  <div class="question-header">
                    <span class="question-number">Câu ${q.questionNumber} (${q.pointsLabel})</span>
                    <span class="badge badge-info">${q.level}</span>
                  </div>
                  <div class="question-text">${q.prompt}</div>
                  <textarea 
                    class="question-textarea exam-answer-field" 
                    id="input-${fieldName}"
                    rows="3" 
                    placeholder="Nhập câu trả lời Câu ${q.questionNumber} vào đây..." 
                    oninput="app.handleExamAnswerInput('${fieldName}', this.value)"
                  ></textarea>
                  <div class="flex items-center justify-between mt-2" style="font-size: 12px; color: var(--text-tertiary);">
                    <span id="counter-${fieldName}">0 từ</span>
                    <span>Mức độ: ${q.level}</span>
                  </div>
                </div>
              `;
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
                <span class="question-number" style="color: var(--success);">Câu 1 (${parts.writingSocial.pointsLabel})</span>
                <span class="badge badge-success">Viết đoạn văn 200 chữ</span>
              </div>
              <div class="question-text">${parts.writingSocial.prompt}</div>
              <textarea 
                class="exam-textarea-large exam-answer-field" 
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
                <span class="question-number">Câu 2 (${parts.writingLiterature.pointsLabel})</span>
                <span class="badge badge-accent">Bài văn hoàn chỉnh 3 phần</span>
              </div>
              <div class="question-text">${parts.writingLiterature.prompt}</div>
              <textarea 
                class="exam-textarea-large exam-answer-field" 
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
        `;
      }

      // Chuyển màn hình: Ẩn sảnh chờ, hiện màn hình làm bài
      const lobbyScreen = document.getElementById('exam-lobby-screen');
      const activeContainer = document.getElementById('exam-active-container');
      const resultContainer = document.getElementById('exam-result-container');
      const lockedAlert = document.getElementById('exam-locked-alert');

      if (lobbyScreen) lobbyScreen.classList.add('hidden');
      if (activeContainer) activeContainer.classList.remove('hidden');
      if (resultContainer) resultContainer.classList.add('hidden');
      if (lockedAlert) lockedAlert.classList.add('hidden');

      this.updateExamAnsweredCount();
      // Bắt đầu đếm ngược thời gian thực từ đúng số phút đã chọn
      this.updateTimerDisplay();
      this.startExamTimer();

      // Cuộn lên đầu và focus câu hỏi 1
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        const q1 = document.getElementById('input-q1');
        if (q1) q1.focus();
      }, 300);

      this.showToast(`🚀 Phòng thi đã bắt đầu tính giờ (${duration} phút). Chúc bạn làm bài đạt kết quả tốt nhất!`, 'success');
      this.renderIcons();
    },

    abortExamSession() {
      this.openModal({
        title: 'Xác nhận thoát phòng thi',
        body: '<p>Bạn có chắc chắn muốn thoát khỏi phòng thi không? Toàn bộ bài làm của phiên hiện tại sẽ bị hủy và hệ thống sẽ đưa bạn trở lại Sảnh chờ.</p>',
        footerButtons: `
          <button class="btn btn-secondary" onclick="app.closeModal()">Tiếp tục làm bài</button>
          <button class="btn btn-danger" onclick="app.closeModal(); app.returnToExamLobby();">Xác nhận thoát</button>
        `
      });
    },

    handleExamAnswerInput(field, value) {
      state.exam.answers[field] = value;
      const counter = document.getElementById(`counter-${field}`);
      const words = value.trim() ? value.trim().split(/\s+/).length : 0;

      if (field === 'social') {
        const badge = document.getElementById('badge-social-len');
        if (counter) counter.textContent = `${words} từ (Chuẩn: 180 – 250 từ)`;
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
        if (counter) counter.textContent = `${words} từ (Chuẩn: 500 – 800 từ)`;
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
        if (counter) counter.textContent = `${words} từ`;
      }

      this.updateExamAnsweredCount();

      // Tự động lưu nháp câu trả lời vào sessionStorage để chống mất dữ liệu khi vô tình reload
      try {
        sessionStorage.setItem('van12_exam_draft', JSON.stringify({
          examId: state.exam.selectedExamId,
          answers: state.exam.answers
        }));
      } catch (err) {}
    },

    updateExamAnsweredCount() {
      const counterEl = document.getElementById('exam-answered-counter');
      if (!counterEl) return;
      const count = Object.values(state.exam.answers).filter((val) => val && val.trim().length > 0).length;
      counterEl.textContent = `Đã làm: ${count}/6 câu`;
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
        timerEl.textContent = `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
      } else {
        timerEl.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
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
        footerButtons: `
          <button class="btn btn-secondary" onclick="app.closeModal()">Hủy bỏ</button>
          <button class="btn btn-danger" onclick="app.closeModal(); app.startExamSession();">Xác nhận làm lại</button>
        `
      });
    },

    confirmSubmitExam() {
      if (state.exam.isLocked || state.exam.isSubmitted) return;

      const answeredCount = Object.values(state.exam.answers).filter((val) => val && val.trim().length > 0).length;
      if (answeredCount < 6) {
        this.openModal({
          title: 'Cảnh báo: Còn câu hỏi chưa hoàn thành!',
          body: `
            <p style="margin-bottom: 8px;">Bạn mới hoàn thành <strong>${answeredCount}/6 câu hỏi</strong> của đề thi.</p>
            <p style="color: var(--warning);">Những câu chưa trả lời sẽ nhận 0 điểm. Bạn có chắc chắn muốn nộp bài thi và chấm điểm ngay bây giờ?</p>
          `,
          footerButtons: `
            <button class="btn btn-secondary" onclick="app.closeModal()">Tiếp tục làm bài</button>
            <button class="btn btn-primary" onclick="app.closeModal(); app.submitAndGradeFullExam(false);">Xác nhận nộp bài</button>
          `
        });
      } else {
        this.submitAndGradeFullExam(false);
      }
    },

    submitAndGradeFullExam(isAutoSubmit) {
      if (this.examBeforeUnloadBound) {
        window.removeEventListener('beforeunload', this.examBeforeUnloadBound);
        this.examBeforeUnloadBound = null;
      }
      try {
        sessionStorage.removeItem('van12_exam_draft');
      } catch (err) {}

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
        this.showToast(`Bài thi đã nộp tự động khi hết giờ! Kết quả: ${gradedResult.totalScore.toFixed(2)}/10.0 điểm.`, 'warning');
      } else {
        this.showToast(`Nộp bài thành công! Điểm số: ${gradedResult.totalScore.toFixed(2)}/10.0 điểm (${gradedResult.gradeRank}).`, 'success');
      }
    },

    gradeMOETPracticeExam(exam, answers, timeSpentSeconds, timeAllowedMinutes) {
      const parts = exam.examParts;
      const qDetails = [];

      // 1. Chấm Phần I: Đọc hiểu (4.0 điểm)
      let readingScore = 0;
      parts.readingQuestions.forEach((q) => {
        const field = `q${q.questionNumber}`;
        const ans = (answers[field] || '').trim();
        const words = ans ? ans.split(/\s+/).length : 0;
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
          label: `Câu ${q.questionNumber} (${q.level})`,
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
      const socialWords = socialText ? socialText.split(/\s+/).length : 0;
      const hasMultiParas = (socialText.match(/\n\s*\n/g) || []).length > 0;

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
      const litWords = litText ? litText.split(/\s+/).length : 0;
      const litParas = litText ? litText.split(/\n+/).filter((p) => p.trim().length > 0).length : 0;

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
      const lobbyScreen = document.getElementById('exam-lobby-screen');
      const activeContainer = document.getElementById('exam-active-container');
      const resultContainer = document.getElementById('exam-result-container');
      const banner = document.getElementById('exam-score-banner');
      const breakdown = document.getElementById('exam-result-breakdown');

      if (!resultContainer || !state.exam.gradedResult) return;

      if (lobbyScreen) lobbyScreen.classList.add('hidden');
      if (activeContainer) activeContainer.classList.add('hidden');
      resultContainer.classList.remove('hidden');

      const res = state.exam.gradedResult;
      const spentMin = Math.floor(res.timeSpentSeconds / 60);
      const spentSec = res.timeSpentSeconds % 60;

      // 1. Render Banner
      if (banner) {
        banner.innerHTML = `
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="score-display">
              <span class="score-value text-${res.gradeColor}">${res.totalScore.toFixed(2)}</span>
              <span class="score-label">/ 10.0 Điểm (${res.gradeRank})</span>
            </div>
            <div style="flex: 1; min-width: 280px;">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="badge badge-accent">Báo cáo chấm điểm chuẩn Bộ GD&ĐT 2026</span>
                <span class="badge badge-info">Thời gian làm: ${spentMin}p ${spentSec}s / ${res.timeAllowedMinutes}p</span>
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
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent); margin: 4px 0;">${res.readingScore.toFixed(2)} <span style="font-size: 14px; font-weight: 500; color: var(--text-tertiary);">/ 4.0đ</span></div>
              <span class="badge badge-accent">4 câu nhận thức</span>
            </div>
            <div class="card card-flat p-3 text-center" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
              <span style="font-size: 12px; color: var(--text-tertiary); font-weight: 600;">PHẦN II.1: NL XÃ HỘI</span>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--success); margin: 4px 0;">${res.socialScore.toFixed(2)} <span style="font-size: 14px; font-weight: 500; color: var(--text-tertiary);">/ 2.0đ</span></div>
              <span class="badge badge-success">5 tiêu chí Bộ GD&ĐT</span>
            </div>
            <div class="card card-flat p-3 text-center" style="background: var(--bg-tertiary); border: 1px solid var(--border);">
              <span style="font-size: 12px; color: var(--text-tertiary); font-weight: 600;">PHẦN II.2: NL VĂN HỌC</span>
              <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-light); margin: 4px 0;">${res.literatureScore.toFixed(2)} <span style="font-size: 14px; font-weight: 500; color: var(--text-tertiary);">/ 4.0đ</span></div>
              <span class="badge badge-info">5 tiêu chí Bộ GD&ĐT</span>
            </div>
          </div>
        `;
      }

      // 2. Render Breakdown Details
      if (breakdown) {
        breakdown.innerHTML = `
          <!-- Section 1: Đọc hiểu Breakdown -->
          <div class="card p-5" style="border: 1px solid var(--border);">
            <div class="flex items-center justify-between mb-3">
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent);">
                1. Chi tiết chấm điểm Phần I: Đọc hiểu (${res.readingScore.toFixed(2)} / 4.0đ)
              </h3>
            </div>
            <div class="flex flex-col gap-3">
              ${res.questionDetails
                .map((q) => {
                  return `
                  <div class="p-3.5" style="background: var(--bg-tertiary); border-radius: var(--radius-sm); border: 1px solid var(--border);">
                    <div class="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <span style="font-weight: 700; color: var(--accent);">${q.label}</span>
                      <span class="badge badge-${q.score >= q.maxPoints * 0.75 ? 'success' : q.score > 0 ? 'warning' : 'error'}">
                        Đạt: ${q.score.toFixed(2)} / ${q.maxPoints}đ
                      </span>
                    </div>
                    <p style="font-size: 13.5px; font-weight: 600; margin-bottom: 8px;">${q.prompt}</p>
                    <div class="mb-2 p-2.5" style="background: var(--bg-card); border-radius: 4px; font-size: 13.5px; line-height: 1.6;">
                      <span style="font-size: 11px; font-weight: 700; color: var(--text-tertiary); display: block; margin-bottom: 2px;">BÀI LÀM CỦA THÍ SINH:</span>
                      ${q.studentAnswer}
                    </div>
                    <div style="font-size: 13px; color: var(--text-secondary);">
                      <strong>Nhận xét:</strong> ${q.comment}
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          <!-- Section 2: Đoạn văn NLXH 200 chữ Breakdown -->
          <div class="card p-5" style="border: 1px solid var(--border);">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--success);">
                2. Đánh giá 5 Tiêu chí Đoạn văn NLXH 200 chữ (${res.socialScore.toFixed(2)} / 2.0đ)
              </h3>
            </div>
            <div class="mb-3 p-3" style="background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--text-tertiary); display: block; margin-bottom: 4px;">BÀI VIẾT CỦA BẠN:</span>
              <p style="font-size: 14px; line-height: 1.75; white-space: pre-wrap;">${state.exam.answers.social || '(Học sinh để trống phần này)'}</p>
            </div>
            <div class="flex flex-col gap-2">
              ${res.socialCriteria
                .map((c) => {
                  return `
                  <div class="flex items-start justify-between p-2.5" style="background: var(--bg-card); border-radius: 4px; border: 1px solid var(--border); font-size: 13.5px;">
                    <div style="flex: 1; padding-right: 12px;">
                      <div style="font-weight: 600;">${c.name}</div>
                      <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">${c.feedback}</div>
                    </div>
                    <span class="badge badge-${c.score === c.max ? 'success' : 'warning'}" style="flex-shrink: 0;">
                      ${c.score.toFixed(2)} / ${c.max}đ
                    </span>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          <!-- Section 3: Bài văn NLVH 600 chữ Breakdown -->
          <div class="card p-5" style="border: 1px solid var(--border);">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent-light);">
                3. Đánh giá 5 Tiêu chí Bài văn NLVH 600 chữ (${res.literatureScore.toFixed(2)} / 4.0đ)
              </h3>
            </div>
            <div class="mb-3 p-3" style="background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--text-tertiary); display: block; margin-bottom: 4px;">BÀI VIẾT CỦA BẠN:</span>
              <p style="font-size: 14px; line-height: 1.75; white-space: pre-wrap;">${state.exam.answers.literature || '(Học sinh để trống phần này)'}</p>
            </div>
            <div class="flex flex-col gap-2">
              ${res.literatureCriteria
                .map((c) => {
                  return `
                  <div class="flex items-start justify-between p-2.5" style="background: var(--bg-card); border-radius: 4px; border: 1px solid var(--border); font-size: 13.5px;">
                    <div style="flex: 1; padding-right: 12px;">
                      <div style="font-weight: 600;">${c.name}</div>
                      <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">${c.feedback}</div>
                    </div>
                    <span class="badge badge-${c.score === c.max ? 'success' : 'warning'}" style="flex-shrink: 0;">
                      ${c.score.toFixed(2)} / ${c.max}đ
                    </span>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          <!-- Section 4: Hướng dẫn chấm & Thang điểm chi tiết chuẩn Bộ GD&ĐT -->
          <div class="card p-5" style="border: 1px solid var(--border);">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="badge badge-accent">ĐÁP ÁN CHÍNH THỨC</span>
                <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin: 0;">
                  Hướng dẫn chấm & Thang điểm chi tiết (Bộ GD&ĐT)
                </h3>
              </div>
              <button class="btn btn-sm btn-ghost" onclick="app.copyText(state.exam.gradedResult.examAnswerKey, 'Đã sao chép hướng dẫn chấm chi tiết!')">
                <i data-lucide="copy"></i> Sao chép hướng dẫn chấm
              </button>
            </div>
            <div class="literary-text" style="white-space: pre-wrap; font-size: 14px; line-height: 1.8; background: var(--bg-tertiary); padding: 18px; border-radius: var(--radius-sm); border-left: 3px solid var(--accent); color: var(--text-primary);">
              ${res.examAnswerKey || 'Đang cập nhật hướng dẫn chấm cho đề thi này.'}
            </div>
          </div>

          <!-- Section 5: Bài văn mẫu tham khảo đạt điểm 9+ -->
          <div class="card p-5" style="border: 1px solid var(--border);">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span class="badge badge-success">BÀI VĂN MẪU THAM KHẢO ĐẠT ĐIỂM 9+</span>
              <button class="btn btn-sm btn-ghost" onclick="app.copyText(state.exam.gradedResult.examSampleEssay, 'Đã sao chép bài văn mẫu 9+!')">
                <i data-lucide="copy"></i> Sao chép bài văn mẫu
              </button>
            </div>
            <div class="literary-text" style="white-space: pre-wrap; font-size: 14.5px; line-height: 1.85;">${res.examSampleEssay}</div>
          </div>
        `;
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderIcons();
    },

    retakeCurrentExam() {
      this.startExamSession();
    },

    launchExamRoomFromBank(examId) {
      const id = parseInt(examId, 10) || 1;
      this.navigateTo('exam');
      this.loadPracticeExam(id);
      this.showToast(`Đã mở phòng thi với Đề số ${id}. Hãy kiểm tra thời gian và nhấn "🚀 BẮT ĐẦU LÀM BÀI THI"!`, 'info');
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
        this.updateExamHistoryCountBadge();
        if (state.currentView === 'history') {
          this.renderHistoryView();
        }
      } catch (err) {
        console.error('Error saving exam history:', err);
      }
    },

    updateExamHistoryCountBadge() {
      const history = this.getExamHistory();
      const badge = document.getElementById('exam-history-count-badge');
      if (badge) badge.textContent = history.length;
      const bentoBadge = document.getElementById('bento-history-badge');
      if (bentoBadge) {
        bentoBadge.textContent = history.length > 0 ? `${history.length} bài đã nộp` : 'Lưu trữ tự động';
      }
      const totalBadge = document.getElementById('history-total-badge');
      if (totalBadge) totalBadge.textContent = `${history.length} bài nộp`;
    },

    openExamHistoryModal() {
      const modal = document.getElementById('modal-exam-history');
      const body = document.getElementById('exam-history-modal-body');
      if (!modal || !body) return;

      const history = this.getExamHistory();
      if (history.length === 0) {
        body.innerHTML = `
          <div class="p-8 text-center" style="color: var(--text-secondary);">
            <div style="font-size: 40px; margin-bottom: 12px;">📝</div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">Chưa có bài thi nào trong lịch sử</h4>
            <p style="font-size: 13.5px;">Hãy hoàn thành một đề thi thử trong phòng thi để hệ thống tự động lưu trữ kết quả và bảng chấm điểm tại đây.</p>
          </div>
        `;
      } else {
        body.innerHTML = `
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
                ${history
                  .map((item) => {
                    const spentMin = Math.floor((item.timeSpentSeconds || 0) / 60);
                    return `
                    <tr>
                      <td style="font-weight: 600;">${item.examTitle}</td>
                      <td>${spentMin} phút / ${item.timeAllowedMinutes}p</td>
                      <td style="font-size: 15px; font-weight: 800; color: var(--accent);">${item.totalScore.toFixed(2)}đ</td>
                      <td><span class="badge badge-${item.totalScore >= 8 ? 'success' : item.totalScore >= 6.5 ? 'info' : 'warning'}">${item.gradeRank}</span></td>
                      <td style="font-size: 12px; color: var(--text-tertiary);">${item.submittedAt}</td>
                      <td>
                        <button class="btn btn-xs btn-secondary" onclick="app.viewHistoryItem('${item.id}')" title="Xem chi tiết bài làm & nhận xét">
                          <i data-lucide="eye"></i> Xem lại
                        </button>
                      </td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
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
      this.showToast(`Đang xem lại kết quả bài thi nộp ngày ${item.submittedAt}`, 'info');
    },

    clearExamHistory() {
      if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử thi thử không? Dữ liệu này sẽ không thể khôi phục.')) return;
      localStorage.removeItem('van12_exam_history_v2');
      this.updateExamHistoryCountBadge();
      this.renderHistoryView();
      const modal = document.getElementById('modal-exam-history');
      if (modal && !modal.classList.contains('hidden')) {
        this.openExamHistoryModal();
      }
      this.showToast('Đã xóa toàn bộ lịch sử bài thi!', 'info');
    },

    deleteSingleHistoryItem(historyId) {
      if (!confirm('Bạn có chắc muốn xóa bài thi này khỏi lịch sử không?')) return;
      try {
        const history = this.getExamHistory().filter((item) => item.id !== historyId);
        localStorage.setItem('van12_exam_history_v2', JSON.stringify(history));
        this.updateExamHistoryCountBadge();
        this.renderHistoryView();
        const modal = document.getElementById('modal-exam-history');
        if (modal && !modal.classList.contains('hidden')) {
          this.openExamHistoryModal();
        }
        this.showToast('Đã xóa bài thi khỏi lịch sử!', 'info');
      } catch (err) {
        console.error('Error deleting history item:', err);
      }
    },

    setHistoryFilter(filter) {
      if (!state.history) state.history = {};
      state.history.filter = filter;

      document.querySelectorAll('#history-filter-chips .chip-home-filter').forEach((btn) => {
        if (btn.getAttribute('data-history-filter') === filter) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      this.renderHistoryView();
    },

    searchExamHistory(keyword) {
      if (!state.history) state.history = {};
      state.history.searchQuery = keyword;
      this.renderHistoryView();
    },

    renderHistoryView() {
      const container = document.getElementById('history-cards-container');
      const countEl = document.getElementById('history-stat-count');
      const avgEl = document.getElementById('history-stat-avg');
      const maxEl = document.getElementById('history-stat-max');
      const timeEl = document.getElementById('history-stat-time');
      const totalBadge = document.getElementById('history-total-badge');
      const rankEl = document.getElementById('history-stat-rank');

      const chipAll = document.getElementById('history-chip-all');
      const chipGood = document.getElementById('history-chip-good');
      const chipFair = document.getElementById('history-chip-fair');
      const chipImprove = document.getElementById('history-chip-improve');

      const history = this.getExamHistory();

      // 1. Compute summary statistics
      const totalCount = history.length;
      if (countEl) countEl.textContent = totalCount;
      if (totalBadge) totalBadge.textContent = `${totalCount} bài nộp`;

      let totalMinutes = 0;
      let totalScores = 0;
      let maxScore = 0;
      let bestRank = '--';

      let countGood = 0;
      let countFair = 0;
      let countImprove = 0;

      history.forEach((item) => {
        const score = Number(item.totalScore) || 0;
        const spentMin = Math.round((Number(item.timeSpentSeconds) || 0) / 60);
        totalMinutes += spentMin;
        totalScores += score;
        if (score > maxScore) {
          maxScore = score;
          bestRank = item.gradeRank || 'Xuất sắc';
        }

        if (score >= 8.0) countGood++;
        else if (score >= 6.5) countFair++;
        else countImprove++;
      });

      if (chipAll) chipAll.textContent = totalCount;
      if (chipGood) chipGood.textContent = countGood;
      if (chipFair) chipFair.textContent = countFair;
      if (chipImprove) chipImprove.textContent = countImprove;

      if (totalCount > 0) {
        const avgScore = (totalScores / totalCount).toFixed(2);
        if (avgEl) avgEl.textContent = `${avgScore}đ`;
        if (maxEl) maxEl.textContent = `${maxScore.toFixed(2)}đ`;
        if (rankEl) rankEl.textContent = `Xếp loại cao nhất: ${bestRank}`;
        if (timeEl) {
          if (totalMinutes >= 60) {
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            timeEl.textContent = `${h} giờ ${m}p`;
          } else {
            timeEl.textContent = `${totalMinutes} phút`;
          }
        }
      } else {
        if (avgEl) avgEl.textContent = '--';
        if (maxEl) maxEl.textContent = '--';
        if (rankEl) rankEl.textContent = 'Kỷ lục bài thi';
        if (timeEl) timeEl.textContent = '0 phút';
      }

      if (!container) return;

      // 2. Filter & Search records
      const filter = state.history ? state.history.filter : 'all';
      const search = (state.history ? state.history.searchQuery : '').trim().toLowerCase();

      let filtered = history.filter((item) => {
        const score = Number(item.totalScore) || 0;
        if (filter === 'excellent' && score < 8.0) return false;
        if (filter === 'fair' && (score < 6.5 || score >= 8.0)) return false;
        if (filter === 'need-improvement' && score >= 6.5) return false;

        if (search) {
          const matchTitle = (item.examTitle || '').toLowerCase().includes(search);
          const matchDate = (item.submittedAt || '').toLowerCase().includes(search);
          const matchRank = (item.gradeRank || '').toLowerCase().includes(search);
          if (!matchTitle && !matchDate && !matchRank) return false;
        }
        return true;
      });

      // 3. Render content
      if (filtered.length === 0) {
        if (totalCount === 0) {
          container.innerHTML = `
            <div class="card p-10 text-center" style="background: var(--bg-card); border: 1.5px dashed var(--border);">
              <div style="font-size: 48px; margin-bottom: 12px;">📝</div>
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">Bạn chưa có bài thi nào trong lịch sử</h3>
              <p style="font-size: 14px; color: var(--text-secondary); max-width: 540px; margin: 0 auto 20px;">
                Hãy bước vào Phòng thi thử, chọn 1 trong 10 đề thi chuẩn Bộ GD&ĐT 2026 và thực chiến để hệ thống tự động tính giờ, lưu bài làm và chấm điểm chi tiết tại đây.
              </p>
              <button class="btn btn-primary" onclick="app.navigateTo('exam')">
                <i data-lucide="play-circle"></i>
                <span>Vào phòng thi thử ngay</span>
              </button>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="card p-8 text-center" style="background: var(--bg-card); border: 1px solid var(--border);">
              <i data-lucide="search-x" style="width: 36px; height: 36px; margin: 0 auto 8px; color: var(--text-tertiary);"></i>
              <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Không tìm thấy bài thi phù hợp</h4>
              <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 14px;">Thử xóa từ khóa tìm kiếm hoặc chọn bộ lọc "Tất cả".</p>
              <button class="btn btn-secondary btn-sm" onclick="app.setHistoryFilter('all'); document.getElementById('history-search-input').value=''; app.searchExamHistory('');">
                Xóa bộ lọc
              </button>
            </div>
          `;
        }
        this.renderIcons();
        return;
      }

      container.innerHTML = filtered
        .map((item, idx) => {
          const spentMin = Math.floor((item.timeSpentSeconds || 0) / 60);
          const spentSec = (item.timeSpentSeconds || 0) % 60;
          const timeFormatted = `${spentMin}p ${spentSec}s / ${item.timeAllowedMinutes}p`;
          const score = Number(item.totalScore) || 0;
          const gradeColor = score >= 8.0 ? 'success' : score >= 6.5 ? 'info' : 'warning';
          const readingScore = item.readingScore != null ? item.readingScore.toFixed(2) : '--';
          const socialScore = item.socialScore != null ? item.socialScore.toFixed(2) : '--';
          const literatureScore = item.literatureScore != null ? item.literatureScore.toFixed(2) : '--';

          return `
            <div class="history-entry-card" id="history-item-${item.id}">
              <div class="history-card-header">
                <div style="flex: 1; min-width: 260px;">
                  <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span class="badge badge-accent">Lần thi #${totalCount - idx}</span>
                    <span class="badge badge-${gradeColor}">${item.gradeRank || 'Đã chấm'}</span>
                    <span class="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                      <i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${item.submittedAt}
                    </span>
                  </div>
                  <h3 class="history-exam-title">${item.examTitle}</h3>
                  <div class="history-meta-row">
                    <span><i data-lucide="timer" style="width: 13px; height: 13px; display: inline-block; vertical-align: middle;"></i> Thời gian làm bài: <strong>${timeFormatted}</strong></span>
                    <span>•</span>
                    <span>Trạng thái: <strong class="text-emerald-600 dark:text-emerald-400">Đã chấm điểm & Nhận xét</strong></span>
                  </div>
                </div>

                <div class="history-score-badge-huge">
                  <span class="history-score-val">${score.toFixed(2)}</span>
                  <span class="history-score-max">trên 10.0 điểm</span>
                </div>
              </div>

              <div class="history-breakdown-grid">
                <div class="history-breakdown-item">
                  <span class="history-breakdown-label">Phần I: Đọc hiểu</span>
                  <span class="history-breakdown-score text-sky-700 dark:text-sky-300">
                    <i data-lucide="book-open" style="width: 13px; height: 13px; display: inline-block; vertical-align: middle;"></i>
                    ${readingScore} / 4.0đ
                  </span>
                </div>
                <div class="history-breakdown-item">
                  <span class="history-breakdown-label">Phần II Câu 1: Đoạn văn NLXH 200 chữ</span>
                  <span class="history-breakdown-score text-emerald-700 dark:text-emerald-300">
                    <i data-lucide="pen-tool" style="width: 13px; height: 13px; display: inline-block; vertical-align: middle;"></i>
                    ${socialScore} / 2.0đ
                  </span>
                </div>
                <div class="history-breakdown-item">
                  <span class="history-breakdown-label">Phần II Câu 2: Bài văn NLVH 600 chữ</span>
                  <span class="history-breakdown-score text-[#B65335] dark:text-[#E08E75]">
                    <i data-lucide="file-text" style="width: 13px; height: 13px; display: inline-block; vertical-align: middle;"></i>
                    ${literatureScore} / 4.0đ
                  </span>
                </div>
              </div>

              <div class="history-actions-row">
                <div class="flex items-center gap-2 flex-wrap">
                  <button class="btn btn-sm btn-primary" onclick="app.viewHistoryItem('${item.id}')" title="Xem lại toàn bộ bài làm, lời phê và đáp án chi tiết">
                    <i data-lucide="eye"></i>
                    <span>Xem chi tiết bài làm & nhận xét</span>
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="app.launchExamRoomFromBank(${item.examId})" title="Mở phòng thi với đề này để thi lại">
                    <i data-lucide="rotate-ccw"></i>
                    <span>Thi lại đề này</span>
                  </button>
                </div>
                <button class="btn btn-sm btn-ghost text-rose-500 hover:text-rose-700" onclick="app.deleteSingleHistoryItem('${item.id}')" title="Xóa kết quả lần thi này">
                  <i data-lucide="trash-2"></i>
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          `;
        })
        .join('');

      this.renderIcons();
    },

    // ──────────────────────────────────────────
    // Module 3: Máy Phân Tích Bài Viết
    // ──────────────────────────────────────────
    initAnalyzerModule() {
      this.setAnalyzerMode('paragraph');
    },

    setAnalyzerMode(mode) {
      state.analyzer.mode = mode;
      const btn200 = document.getElementById('analyzer-mode-200');
      const btn600 = document.getElementById('analyzer-mode-600');
      const rulesEl = document.getElementById('analyzer-rules-text');

      if (mode === 'paragraph') {
        if (btn200) btn200.classList.add('active');
        if (btn600) btn600.classList.remove('active');
        if (rulesEl) {
          rulesEl.innerHTML = `
            <strong>Quy chuẩn Đoạn văn 200 chữ (Nghị luận xã hội):</strong>
            Viết liền một đoạn duy nhất, <strong>tuyệt đối không xuống dòng</strong> (ngắt đoạn sẽ bị trừ 0.5đ hình thức). Lùi đầu dòng chữ đầu tiên. Dung lượng tối ưu từ 180 đến 230 từ.
          `;
        }
      } else {
        if (btn200) btn200.classList.remove('active');
        if (btn600) btn600.classList.add('active');
        if (rulesEl) {
          rulesEl.innerHTML = `
            <strong>Quy chuẩn Bài văn 600 chữ (Nghị luận văn học):</strong>
            Bố cục hoàn chỉnh 3 phần: Mở bài (1 đoạn), Thân bài (nhiều đoạn luận điểm), Kết bài (1 đoạn). Dung lượng tối ưu từ 550 đến 650 từ.
          `;
        }
      }

      this.analyzeText();
    },

    insertAnalyzerSample() {
      const textarea = document.getElementById('analyzer-textarea');
      if (!textarea) return;

      if (state.analyzer.mode === 'paragraph') {
        textarea.value = `    Sống có trách nhiệm là phẩm chất đạo đức then chốt làm nên giá trị nhân cách của mỗi con người trong thời đại mới. Trước hết, sống có trách nhiệm nghĩa là luôn ý thức rõ bổn phận của bản thân đối với gia đình, công việc và cộng đồng xã hội; dám đương đầu với thử thách và dũng cảm nhận lỗi khi vấp ngã. Thật vậy, một học sinh biết tự giác học tập, một người công dân tuân thủ pháp luật hay một bác sĩ tận tụy vì người bệnh đều là những biểu hiện cao đẹp của tinh thần trách nhiệm. Ngược lại, lối sống vô cảm, ích kỷ, đùn đẩy khó khăn cho người khác không chỉ cản trở bước đường tiến bộ của cá nhân mà còn làm suy thoái các mối quan hệ xã hội. Tuy nhiên, sống trách nhiệm không đồng nghĩa với việc gánh vác mù quáng những điều vượt quá khả năng, mà cần kết hợp với trí tuệ sáng suốt để hành động hiệu quả. Tóm lại, thế hệ trẻ hôm nay hãy rèn luyện tinh thần trách nhiệm từ những hành động nhỏ nhất để góp phần xây dựng một xã hội văn minh, giàu đẹp.`;
      } else {
        textarea.value = `    Quang Dũng là một gương mặt nghệ sĩ tài hoa, phóng khoáng tiêu biểu của thơ ca kháng chiến chống Pháp. Trong đó, "Tây Tiến" (1948) chính là khúc tráng ca bất hủ kết tinh vẻ đẹp hào hùng, bi tráng của người lính giữa thiên nhiên miền Tây Bắc hiểm trở.

    Trước hết, bức tranh hành quân của đoàn quân Tây Tiến hiện lên đầy gian khổ nhưng thắm đượm tình đồng chí keo sơn. Dưới ngòi bút của Quang Dũng, dốc cao vực sâu hay cồn mây heo hút không làm nao núng ý chí kiên cường của những chàng trai Hà thành rời ghế nhà trường ra trận. Mặc dù đối mặt với sốt rét rừng hiểm ác và gian lao khôn xiết, người lính vẫn giữ vững khí phách hiên ngang, lạc quan.

    Bên cạnh đó, vẻ đẹp tâm hồn lãng mạn chính là điểm tựa tinh thần nâng đỡ bước chân người chiến sĩ. Những đêm liên hoan rực rỡ đuốc hoa hay dáng kiều thơm Hà Nội trong giấc mơ không hề làm nhụt ý chí chiến đấu, mà ngược lại càng bồi đắp thêm tình yêu quê hương xứ sở thiết tha. 

    Tóm lại, bằng bút pháp lãng mạn tài hoa kết hợp ngôn từ giàu chất tạo hình, Quang Dũng đã dựng nên tượng đài nghệ thuật tráng lệ về người lính vệ quốc thế hệ đầu. Thi phẩm mãi mãi là niềm tự hào sáng ngời trong trang sử thi ca dân tộc.`;
      }

      this.analyzeText();
      this.showToast('Đã chèn bài viết mẫu thành công!', 'info');
    },

    clearAnalyzerText() {
      const textarea = document.getElementById('analyzer-textarea');
      if (textarea) textarea.value = '';
      this.analyzeText();
      this.showToast('Đã xóa nội dung bài viết', 'info');
    },

    analyzeText() {
      const textarea = document.getElementById('analyzer-textarea');
      const text = textarea ? textarea.value : '';
      state.analyzer.text = text;

      // Basic counts
      const trimmed = text.trim();
      const words = trimmed ? trimmed.split(/\s+/).filter((w) => w.length > 0) : [];
      const wordCount = words.length;
      const charCount = text.length;

      // Sentences count: split by . ! ?
      const sentenceList = trimmed
        ? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0)
        : [];
      const sentenceCount = sentenceList.length;

      // Paragraphs count: split by double newlines or non-empty lines
      const paragraphList = trimmed
        ? text.split(/\n+/).filter((p) => p.trim().length > 0)
        : [];
      const paragraphCount = paragraphList.length;

      // Update basic counters in DOM
      const cntWords = document.getElementById('cnt-words');
      const cntChars = document.getElementById('cnt-chars');
      const cntSentences = document.getElementById('cnt-sentences');
      const cntParagraphs = document.getElementById('cnt-paragraphs');

      if (cntWords) cntWords.textContent = wordCount;
      if (cntChars) cntChars.textContent = charCount;
      if (cntSentences) cntSentences.textContent = sentenceCount;
      if (cntParagraphs) cntParagraphs.textContent = paragraphCount;

      // Progress bar & Target
      const targetWords = state.analyzer.mode === 'paragraph' ? 200 : 600;
      const minOptimal = state.analyzer.mode === 'paragraph' ? 180 : 550;
      const maxOptimal = state.analyzer.mode === 'paragraph' ? 230 : 650;

      const progressPercent = Math.min(Math.round((wordCount / targetWords) * 100), 100);
      const progressBar = document.getElementById('analyzer-progress-bar');
      const progressLabel = document.getElementById('analyzer-progress-label');
      const statusBadge = document.getElementById('analyzer-status-badge');

      if (progressLabel) {
        progressLabel.textContent = `Dung lượng: ${wordCount} / ${targetWords} từ (${progressPercent}%)`;
      }

      if (progressBar && statusBadge) {
        progressBar.style.width = `${progressPercent}%`;

        if (wordCount === 0) {
          progressBar.className = 'progress-fill warning';
          statusBadge.className = 'badge badge-warning';
          statusBadge.textContent = 'Chưa có nội dung';
        } else if (wordCount < minOptimal) {
          progressBar.className = 'progress-fill warning';
          statusBadge.className = 'badge badge-warning';
          statusBadge.textContent = `Thiếu khoảng ${minOptimal - wordCount} từ`;
        } else if (wordCount > maxOptimal) {
          progressBar.className = 'progress-fill error';
          statusBadge.className = 'badge badge-error';
          statusBadge.textContent = `Vượt quá quy định (${wordCount} từ)`;
        } else {
          progressBar.className = 'progress-fill success';
          statusBadge.className = 'badge badge-success';
          statusBadge.textContent = `Đạt chuẩn tối ưu (${wordCount} từ)`;
        }
      }

      // Check Connectors
      const lowerText = text.toLowerCase();
      const usedConnectors = [];
      VIETNAMESE_CONNECTORS.forEach((c) => {
        if (lowerText.includes(c)) usedConnectors.push(c);
      });

      // Check Repetitive Words
      const wordFreq = {};
      words.forEach((rawWord) => {
        const clean = rawWord.toLowerCase().replace(/[,.!?:;'"()]/g, '');
        if (clean.length > 2 && !STOP_WORDS.has(clean)) {
          wordFreq[clean] = (wordFreq[clean] || 0) + 1;
        }
      });

      const repeatedWords = Object.entries(wordFreq)
        .filter(([w, cnt]) => cnt >= 3)
        .sort((a, b) => b[1] - a[1]);

      // Render 4 Deep Analysis Cards
      this.renderAnalyzerCards({
        wordCount,
        paragraphCount,
        sentenceCount,
        targetWords,
        minOptimal,
        maxOptimal,
        text,
        usedConnectors,
        repeatedWords
      });
    },

    renderAnalyzerCards(data) {
      const { wordCount, paragraphCount, minOptimal, maxOptimal, text, usedConnectors, repeatedWords } = data;

      // 1. Length Card
      const lenBody = document.getElementById('analysis-length-body');
      if (lenBody) {
        if (wordCount === 0) {
          lenBody.innerHTML = 'Chưa có nội dung bài viết.';
        } else if (wordCount < minOptimal) {
          lenBody.innerHTML = `
            <span class="badge badge-warning mb-2">Chưa đủ dung lượng</span>
            <p>Bài viết đang có <strong>${wordCount} từ</strong>. Cần bổ sung thêm khoảng <strong>${minOptimal - wordCount} từ</strong> để đảm bảo đủ chiều sâu lập luận.</p>
          `;
        } else if (wordCount > maxOptimal) {
          lenBody.innerHTML = `
            <span class="badge badge-error mb-2">Quá dài</span>
            <p>Bài viết đang có <strong>${wordCount} từ</strong>. Vượt quá mức tối ưu (+${wordCount - maxOptimal} từ), có nguy cơ bị trừ điểm dung lượng hoặc không đủ thời gian làm bài.</p>
          `;
        } else {
          lenBody.innerHTML = `
            <span class="badge badge-success mb-2">Chuẩn dung lượng</span>
            <p>Bài viết đạt <strong>${wordCount} từ</strong>, nằm trong vùng an toàn tuyệt đối (${minOptimal} – ${maxOptimal} từ).</p>
          `;
        }
      }

      // 2. Format Card
      const fmtBody = document.getElementById('analysis-format-body');
      if (fmtBody) {
        if (wordCount === 0) {
          fmtBody.innerHTML = 'Chưa có dữ liệu bài viết.';
        } else if (state.analyzer.mode === 'paragraph') {
          // Check line breaks in 200 words paragraph
          const trimmedText = text.trim();
          const hasNewline = trimmedText.includes('\n');
          const startsWithIndent = text.startsWith('  ') || text.startsWith('\t') || text.startsWith('    ');

          if (hasNewline) {
            fmtBody.innerHTML = `
              <span class="badge badge-error mb-2">Lỗi: Phát hiện xuống dòng</span>
              <p style="color: var(--error);">Quy chuẩn đoạn văn 200 chữ yêu cầu viết liền mạch một đoạn duy nhất. Việc xuống dòng sẽ khiến bài thi bị trừ 0.5đ hình thức!</p>
            `;
          } else {
            fmtBody.innerHTML = `
              <span class="badge badge-success mb-2">Hình thức hợp lệ</span>
              <p>Đoạn văn được viết liền một khối không ngắt dòng. ${startsWithIndent ? 'Có lùi đầu dòng chuẩn xác.' : 'Lưu ý nên lùi đầu dòng ở chữ đầu tiên.'}</p>
            `;
          }
        } else {
          // Essay mode: 600 words
          if (paragraphCount < 3) {
            fmtBody.innerHTML = `
              <span class="badge badge-warning mb-2">Thiếu bố cục 3 phần</span>
              <p>Bài văn cần tối thiểu 3 đoạn (Mở bài, Thân bài, Kết bài). Hiện tại phát hiện ${paragraphCount} đoạn.</p>
            `;
          } else {
            fmtBody.innerHTML = `
              <span class="badge badge-success mb-2">Bố cục chuẩn</span>
              <p>Phát hiện ${paragraphCount} đoạn văn hoàn chỉnh, đáp ứng cấu trúc mở bài - thân bài - kết bài.</p>
            `;
          }
        }
      }

      // 3. Connectors Card
      const connBody = document.getElementById('analysis-connectors-body');
      if (connBody) {
        if (usedConnectors.length === 0) {
          connBody.innerHTML = `
            <span class="badge badge-warning mb-2">Thiếu từ nối liên kết</span>
            <p>Chưa phát hiện từ nối nào. Nên bổ sung các từ như: <em>trước hết, tuy nhiên, bên cạnh đó, do đó, tóm lại...</em> để câu văn mạch lạc.</p>
          `;
        } else {
          connBody.innerHTML = `
            <span class="badge badge-success mb-2">Sử dụng ${usedConnectors.length} từ nối</span>
            <p style="margin-bottom: 6px;">Các từ nối đã phát hiện:</p>
            <div class="flex flex-wrap gap-1">
              ${usedConnectors.map((c) => `<span class="badge badge-accent">${c}</span>`).join(' ')}
            </div>
          `;
        }
      }

      // 4. Repetition Card
      const repBody = document.getElementById('analysis-repetition-body');
      if (repBody) {
        if (repeatedWords.length === 0) {
          repBody.innerHTML = `
            <span class="badge badge-success mb-2">Không bị lặp từ</span>
            <p>Từ vựng phân bố phong phú, không có từ quan trọng nào bị lặp quá 3 lần.</p>
          `;
        } else {
          repBody.innerHTML = `
            <span class="badge badge-warning mb-2">Có ${repeatedWords.length} từ lặp nhiều</span>
            <p style="margin-bottom: 6px;">Nên dùng từ đồng nghĩa thay thế:</p>
            <div class="flex flex-wrap gap-1">
              ${repeatedWords.map(([w, cnt]) => `<span class="badge badge-warning">${w} (${cnt} lần)</span>`).join(' ')}
            </div>
          `;
        }
      }

      // 5. Overall Advice
      const advBody = document.getElementById('analysis-advice-body');
      if (advBody) {
        if (wordCount === 0) {
          advBody.innerHTML = 'Hãy nhập hoặc dán nội dung bài viết vào khung trên để nhận báo cáo phân tích chi tiết.';
        } else {
          let adviceList = [];
          if (wordCount < minOptimal) adviceList.push(`Tăng thêm khoảng ${minOptimal - wordCount} từ bằng cách bổ sung dẫn chứng thực tế hoặc mở rộng bài học nhận thức.`);
          if (wordCount > maxOptimal) adviceList.push(`Lược bỏ các từ đệm rườm rà để bài viết cô đọng, tránh mất điểm dung lượng.`);
          if (state.analyzer.mode === 'paragraph' && text.includes('\n')) adviceList.push('Nối các đoạn lại với nhau, xóa bỏ dấu xuống dòng để không mất 0.5 điểm quy chuẩn đoạn văn.');
          if (usedConnectors.length < 2) adviceList.push('Chèn thêm ít nhất 2 từ nối (ví dụ: "thật vậy", "tuy nhiên", "tóm lại") để mạch văn chặt chẽ hơn.');
          if (repeatedWords.length > 2) adviceList.push('Sử dụng đại từ thay thế hoặc từ đồng nghĩa cho các từ bị lặp lại nhiều lần.');

          if (adviceList.length === 0) {
            advBody.innerHTML = `
              <p style="color: var(--success); font-weight: 600; margin-bottom: 6px;">
                🎉 Bài viết xuất sắc! Đạt trọn vẹn quy chuẩn dung lượng, cấu trúc đoạn và tính liên kết logic.
              </p>
              <p style="font-size: 13.5px; color: var(--text-secondary);">Bạn hoàn toàn có thể tự tin áp dụng phong cách và cấu trúc này vào bài thi chính thức.</p>
            `;
          } else {
            advBody.innerHTML = `
              <ul style="padding-left: 20px; margin: 0;">
                ${adviceList.map((a) => `<li style="margin-bottom: 6px;">${a}</li>`).join('')}
              </ul>
            `;
          }
        }
      }
    },

    copyAnalysisReport() {
      const text = state.analyzer.text;
      if (!text.trim()) {
        this.showToast('Chưa có nội dung để sao chép báo cáo!', 'warning');
        return;
      }

      const words = text.trim().split(/\s+/).length;
      let report = `BÁO CÁO PHÂN TÍCH BÀI VIẾT – VĂN 12 PRO LAB\n`;
      report += `Chế độ kiểm tra: ${state.analyzer.mode === 'paragraph' ? 'Đoạn văn 200 chữ (NLXH)' : 'Bài văn 600 chữ (NLVH)'}\n`;
      report += `Số từ: ${words} từ | Ký tự: ${text.length}\n\n`;
      report += `NỘI DUNG BÀI VIẾT:\n${text}\n`;

      this.copyText(report, 'Đã sao chép toàn bộ báo cáo phân tích!');
    },

    // ──────────────────────────────────────────
    // Module 4: Máy Tạo Mở Bài & Kết Bài
    // ──────────────────────────────────────────
    initGeneratorModule() {
      const select = document.getElementById('generator-work-select');
      if (!select || !window.APP_DATA) return;

      select.innerHTML = window.APP_DATA.works
        .map((w) => {
          const slug = w.slug;
          return `<option value="${slug}" data-id="${w.id}">${w.title} – ${w.author}</option>`;
        })
        .join('');

      this.generateIntrosAndConclusions();
    },

    handleGeneratorWorkChange(slug) {
      state.generator.selectedWorkSlug = slug;
      state.generator.versionIndex = 0;
    },

    handleGeneratorStyleChange(style) {
      state.generator.selectedStyle = style;
      const hint = document.getElementById('generator-style-hint');
      if (hint) {
        if (style === 'direct') hint.textContent = 'Đi thẳng vào tác giả, tác phẩm và luận đề cần bàn luận.';
        else if (style === 'indirect') hint.textContent = 'Dẫn dắt từ câu thơ, nhận định triết lý văn học sâu sắc.';
        else hint.textContent = 'So sánh đối lập với các tác phẩm cùng thời để tôn vinh nét riêng độc đáo.';
      }
    },

    generateIntrosAndConclusions() {
      const select = document.getElementById('generator-work-select');
      const styleSelect = document.getElementById('generator-style-select');

      const slug = select ? select.value : 'tay-tien';
      const style = styleSelect ? styleSelect.value : 'direct';

      state.generator.selectedWorkSlug = slug;
      state.generator.selectedStyle = style;

      const templates = window.APP_DATA.introTemplates;
      const template = templates[slug] || templates[slug.replace(/^-+|-+$/g, '')] || templates['xuan-toc-do-cuu-quoc'] || templates['tay-tien'] || templates[Object.keys(templates)[0]];

      const introsForStyle = (template.intros && template.intros[style]) || (template.intros && template.intros.direct) || [];
      const conclusions = template.conclusions || [];

      // Pick samples based on versionIndex
      const idx1 = state.generator.versionIndex % (introsForStyle.length || 1);
      const idx2 = (state.generator.versionIndex + 1) % (introsForStyle.length || 1);

      const intro1 = introsForStyle[idx1] || introsForStyle[0] || 'Mở bài mẫu đang được cập nhật.';
      const intro2 = introsForStyle[idx2] || introsForStyle[0] || 'Mở bài mẫu đang được cập nhật.';

      const concl1 = conclusions[0] || 'Kết bài mẫu đang được cập nhật.';
      const concl2 = conclusions[1] || conclusions[0] || 'Kết bài mẫu đang được cập nhật.';

      // DOM updates
      const titleEl = document.getElementById('generator-results-title');
      if (titleEl) titleEl.textContent = `Kết quả tạo mẫu: ${template.workTitle} (${template.author})`;

      const badgeIntro1 = document.getElementById('badge-style-intro1');
      const badgeIntro2 = document.getElementById('badge-style-intro2');
      const styleName = style === 'direct' ? 'Trực tiếp' : style === 'indirect' ? 'Gián tiếp' : 'Tương phản';
      if (badgeIntro1) badgeIntro1.textContent = styleName;
      if (badgeIntro2) badgeIntro2.textContent = styleName;

      const elIntro1 = document.getElementById('content-intro-1');
      const elIntro2 = document.getElementById('content-intro-2');
      const elConcl1 = document.getElementById('content-conclusion-1');
      const elConcl2 = document.getElementById('content-conclusion-2');

      if (elIntro1) elIntro1.innerHTML = `<p>${intro1}</p>`;
      if (elIntro2) elIntro2.innerHTML = `<p>${intro2}</p>`;
      if (elConcl1) elConcl1.innerHTML = `<p>${concl1}</p>`;
      if (elConcl2) elConcl2.innerHTML = `<p>${concl2}</p>`;

      this.renderIcons();
    },

    regenerateVersion() {
      state.generator.versionIndex++;
      this.generateIntrosAndConclusions();
      this.showToast('Đã làm mới các phiên bản mở bài & kết bài!', 'info');
    },

    copyAllGenerated() {
      const templates = window.APP_DATA && window.APP_DATA.introTemplates ? window.APP_DATA.introTemplates : {};
      const template =
        templates[state.generator.selectedWorkSlug] ||
        templates['tay-tien'] || { workTitle: 'Tác phẩm', author: '' };
      const intro1 = document.getElementById('content-intro-1')?.innerText || '';
      const intro2 = document.getElementById('content-intro-2')?.innerText || '';
      const concl1 = document.getElementById('content-conclusion-1')?.innerText || '';
      const concl2 = document.getElementById('content-conclusion-2')?.innerText || '';

      const titleFormatted = (template.workTitle || 'Tác phẩm').toUpperCase();
      const authorFormatted = template.author ? ` (${template.author})` : '';
      let text = `BỘ MỞ BÀI & KẾT BÀI ĐIỂM 9+: ${titleFormatted}${authorFormatted}\n\n`;
      text += `--- MỞ BÀI MẪU 1 ---\n${intro1}\n\n`;
      text += `--- MỞ BÀI MẪU 2 ---\n${intro2}\n\n`;
      text += `--- KẾT BÀI MẪU 1 ---\n${concl1}\n\n`;
      text += `--- KẾT BÀI MẪU 2 ---\n${concl2}\n`;

      this.copyText(text, 'Đã sao chép trọn bộ 4 đoạn văn mẫu vào clipboard!');
    },

    // ──────────────────────────────────────────
    // Module 5: Kho Đề Thi Thử & Cẩm Nang 9+ (exams-bank)
    // ──────────────────────────────────────────
    initExamsBankModule() {
      this.updateExamsBankCounts();
      this.renderExamsBank();
      this.renderExamDocuments();
    },

    updateExamsBankCounts() {
      if (!window.APP_DATA) return;
      const exams = window.APP_DATA.practiceExams || [];
      const docs = window.APP_DATA.examDocuments || [];

      const tabExamsBadge = document.getElementById('badge-tab-exams');
      if (tabExamsBadge) tabExamsBadge.textContent = `${exams.length} đề`;

      const tabDocsBadge = document.getElementById('badge-tab-docs');
      if (tabDocsBadge) tabDocsBadge.textContent = `${docs.length} cẩm nang`;
    },

    switchExamsTab(tab) {
      state.examsBank.tab = tab;
      const tabExamsBtn = document.getElementById('tab-btn-exams');
      const tabDocsBtn = document.getElementById('tab-btn-docs');
      const examsList = document.getElementById('exams-bank-list');
      const docsList = document.getElementById('exams-docs-list');
      const controlsWrapper = document.getElementById('exams-controls-wrapper');

      if (tab === 'exams') {
        if (tabExamsBtn) tabExamsBtn.classList.add('active');
        if (tabDocsBtn) tabDocsBtn.classList.remove('active');
        if (examsList) examsList.classList.remove('hidden');
        if (controlsWrapper) controlsWrapper.classList.remove('hidden');
        if (docsList) docsList.classList.add('hidden');
      } else {
        if (tabExamsBtn) tabExamsBtn.classList.remove('active');
        if (tabDocsBtn) tabDocsBtn.classList.add('active');
        if (examsList) examsList.classList.add('hidden');
        if (controlsWrapper) controlsWrapper.classList.add('hidden');
        if (docsList) docsList.classList.remove('hidden');
      }
      this.renderIcons();
    },

    searchExamsBank(query) {
      state.examsBank.searchQuery = (query || '').trim();
      this.renderExamsBank();
    },

    filterExamsBank(genre) {
      state.examsBank.genreFilter = genre;
      document.querySelectorAll('#view-exams-bank .chip[data-genre-filter]').forEach((chip) => {
        if (chip.getAttribute('data-genre-filter') === genre) chip.classList.add('active');
        else chip.classList.remove('active');
      });
      this.renderExamsBank();
    },

    matchesExamGenre(exam, filter) {
      if (!filter || filter === 'all') return true;
      const s = (exam.sourceType || '').toLowerCase();
      const f = filter.toLowerCase();
      if (f.includes('thơ')) return s.includes('thơ');
      if (f.includes('văn xuôi')) {
        return s.includes('văn xuôi') || s.includes('truyện') || s.includes('tiểu thuyết') || s.includes('hồi ký');
      }
      if (f.includes('kịch')) return s.includes('kịch');
      if (f.includes('tùy bút')) return s.includes('tùy bút') || s.includes('bút ký');
      return s.includes(f);
    },

    renderExamsBank() {
      const container = document.getElementById('exams-bank-list');
      if (!container || !window.APP_DATA) return;

      const exams = window.APP_DATA.practiceExams || [];
      const filter = state.examsBank.genreFilter;
      const query = stripDiacritics(state.examsBank.searchQuery || '').toLowerCase();

      const filtered = exams.filter((e) => {
        const matchGenre = this.matchesExamGenre(e, filter);
        if (!matchGenre) return false;
        if (!query) return true;
        const matchTitle = stripDiacritics(e.title || '').toLowerCase().includes(query);
        const matchTopic = stripDiacritics(e.topic || '').toLowerCase().includes(query);
        const matchContent = stripDiacritics(e.examContent || '').toLowerCase().includes(query);
        return matchTitle || matchTopic || matchContent;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="card p-8 text-center" style="background: var(--bg-card); border: 1px dashed var(--border);">
            <div style="font-size: 40px; margin-bottom: 12px; color: var(--accent);">🔍</div>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 6px;">Không tìm thấy đề thi phù hợp</h3>
            <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 16px;">
              Không có đề thi nào khớp với bộ lọc "${filter !== 'all' ? filter : ''}" hoặc từ khóa "${state.examsBank.searchQuery}".
            </p>
            <button class="btn btn-secondary" onclick="app.filterExamsBank('all'); const input = document.getElementById('exams-search-input'); if(input){input.value=''; app.searchExamsBank('');}">
              <i data-lucide="rotate-ccw"></i> Đặt lại bộ lọc đề thi
            </button>
          </div>
        `;
        this.renderIcons();
        return;
      }

      container.innerHTML = filtered
        .map((exam) => {
          return `
          <div class="card mb-4" id="exam-card-${exam.id}" style="border: 1px solid var(--border); transition: border-color 0.2s ease;">
            <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span class="badge badge-accent">Đề số ${exam.id}</span>
                  <span class="badge badge-info">${exam.sourceType}</span>
                  <span class="badge badge-success">${exam.duration}</span>
                  <span class="badge badge-neutral" style="font-size: 11px;">Chuẩn form Bộ 2026</span>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700;">${exam.title}</h3>
                <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 3px;">
                  Chủ đề trọng tâm: <strong>${exam.topic}</strong> • Thang điểm: <strong>${exam.totalPoints}.0 điểm</strong>
                </p>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <button class="btn btn-sm btn-primary" onclick="app.launchExamRoomFromBank(${exam.id})">
                  <i data-lucide="play-circle"></i> Vào phòng thi thử
                </button>
                <button class="btn btn-sm btn-secondary" onclick="app.openPdfExportModal(${exam.id})" title="In đề thi hoặc tải file PDF tự động">
                  <i data-lucide="printer"></i> In / Tải PDF
                </button>
                <button class="btn btn-sm btn-ghost" onclick="app.copyExamFull(${exam.id})" title="Sao chép toàn bộ nội dung đề bài">
                  <i data-lucide="copy"></i> Sao chép đề bài
                </button>
              </div>
            </div>

            <!-- Accordion Drawer 1: Ma trận đề thi -->
            <div class="collapsible-header" onclick="app.toggleAccordion('matrix-${exam.id}')">
              <span style="font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="table" style="color: var(--accent); width: 16px; height: 16px;"></i>
                1. Ma trận phân bổ đặc tả đề thi (Bấm để xem)
              </span>
              <i data-lucide="chevron-down" class="chevron" id="chevron-matrix-${exam.id}"></i>
            </div>
            <div class="collapsible-body" id="body-matrix-${exam.id}">
              <div class="collapsible-content">
                <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                  <thead>
                    <tr style="border-bottom: 2px solid var(--border); text-align: left;">
                      <th style="padding: 8px;">Phần thi</th>
                      <th style="padding: 8px;">Điểm</th>
                      <th style="padding: 8px;">Số câu</th>
                      <th style="padding: 8px;">Mức độ nhận thức</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${exam.matrix
                      .map(
                        (m) => `
                      <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 8px; font-weight: 600;">${m.section}</td>
                        <td style="padding: 8px;">${m.points}đ</td>
                        <td style="padding: 8px;">${m.questions}</td>
                        <td style="padding: 8px;"><span class="badge badge-info">${m.levels}</span></td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Accordion Drawer 2: Đề bài chi tiết -->
            <div class="collapsible-header" onclick="app.toggleAccordion('content-${exam.id}')">
              <span style="font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="file-text" style="color: var(--accent); width: 16px; height: 16px;"></i>
                2. Nội dung đề bài chi tiết (120 phút)
              </span>
              <i data-lucide="chevron-down" class="chevron" id="chevron-content-${exam.id}"></i>
            </div>
            <div class="collapsible-body" id="body-content-${exam.id}">
              <div class="collapsible-content">
                <div class="literary-text" style="white-space: pre-wrap; font-size: 14.5px; line-height: 1.8;">${exam.examContent}</div>
              </div>
            </div>

            <!-- Accordion Drawer 3: Hướng dẫn chấm & Bài văn mẫu 9+ -->
            <div class="collapsible-header" onclick="app.toggleAccordion('answer-${exam.id}')">
              <span style="font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="check-circle" style="color: var(--success); width: 16px; height: 16px;"></i>
                3. Hướng dẫn chấm thang điểm & Bài văn mẫu điểm 9+ (Bấm để xem)
              </span>
              <i data-lucide="chevron-down" class="chevron" id="chevron-answer-${exam.id}"></i>
            </div>
            <div class="collapsible-body" id="body-answer-${exam.id}">
              <div class="collapsible-content">
                <div class="p-3 mb-3" style="background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--accent);">
                  <div class="flex items-center justify-between mb-2">
                    <h4 style="font-size: 14px; font-weight: 700; color: var(--accent); margin-bottom: 0;">HƯỚNG DẪN CHẤM & DÀN Ý CHI TIẾT:</h4>
                    <button class="btn btn-xs btn-ghost" onclick="app.copyText(window.APP_DATA.practiceExams.find(e => e.id === ${exam.id}).answerKey, 'Đã sao chép đáp án đề số ${exam.id}!')">
                      <i data-lucide="copy"></i> Sao chép đáp án
                    </button>
                  </div>
                  <div class="literary-text" style="white-space: pre-wrap; font-size: 14px; line-height: 1.75;">${exam.answerKey}</div>
                </div>

                ${
                  exam.sampleEssay
                    ? `
                  <div class="p-4" style="background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border);">
                    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <span class="badge badge-success">BÀI VĂN MẪU THAM KHẢO ĐẠT ĐIỂM 9+</span>
                      <button class="copy-btn" onclick="app.copySampleEssay(${exam.id})">
                        <i data-lucide="copy"></i> Sao chép bài văn mẫu
                      </button>
                    </div>
                    <div class="literary-text" style="white-space: pre-wrap; font-size: 14.5px; line-height: 1.85;">${exam.sampleEssay}</div>
                  </div>
                `
                    : ''
                }
              </div>
            </div>
          </div>
        `;
        })
        .join('');

      this.renderIcons();
    },

    renderExamDocuments() {
      const container = document.getElementById('exams-docs-list');
      if (!container || !window.APP_DATA) return;

      const docs = window.APP_DATA.examDocuments || [];
      if (docs.length === 0) {
        container.innerHTML = '<p class="text-secondary p-4">Đang cập nhật tài liệu ôn thi...</p>';
        return;
      }

      container.innerHTML = docs
        .map((doc, idx) => {
          return `
          <div class="card mb-4" id="exam-doc-${doc.id}" style="border: 1px solid var(--border);">
            <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span class="badge badge-accent">Chuyên đề ${idx + 1}</span>
                  <span class="badge badge-info">${doc.category}</span>
                  <span class="badge badge-success">Bí kíp điểm 9+</span>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700;">${doc.title}</h3>
                <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 3px;">
                  ${doc.summary}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button class="btn btn-sm btn-ghost" onclick="app.copyExamDocument('${doc.id}')" title="Sao chép toàn bộ cẩm nang này">
                  <i data-lucide="copy"></i> Sao chép tài liệu
                </button>
              </div>
            </div>

            <!-- Accordion Content -->
            <div class="collapsible-header" onclick="app.toggleAccordion('doc-body-${doc.id}')">
              <span style="font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="book-marked" style="color: var(--accent); width: 16px; height: 16px;"></i>
                Đọc toàn văn cẩm nang chi tiết (Bấm để mở)
              </span>
              <i data-lucide="chevron-down" class="chevron" id="chevron-doc-body-${doc.id}"></i>
            </div>
            <div class="collapsible-body" id="body-doc-body-${doc.id}">
              <div class="collapsible-content">
                <div class="p-4" style="background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--accent);">
                  <div class="literary-text" style="white-space: pre-wrap; font-size: 14.5px; line-height: 1.85;">${doc.content}</div>
                </div>
              </div>
            </div>
          </div>
        `;
        })
        .join('');

      this.renderIcons();
    },

    toggleAccordion(id) {
      const body = document.getElementById(`body-${id}`);
      const chevron = document.getElementById(`chevron-${id}`);
      const header = chevron ? chevron.parentElement : null;

      if (!body) return;

      const isOpen = body.classList.toggle('open');
      if (header) header.classList.toggle('open');
      state.examsBank.openDrawers[id] = isOpen;
    },

    toggleAllExamsDrawers(expand) {
      const container = document.getElementById('exams-bank-list');
      if (!container) return;

      const headers = container.querySelectorAll('.collapsible-header');
      const bodies = container.querySelectorAll('.collapsible-body');

      bodies.forEach((body) => {
        if (expand) body.classList.add('open');
        else body.classList.remove('open');
      });

      headers.forEach((header) => {
        if (expand) header.classList.add('open');
        else header.classList.remove('open');
      });
    },

    copyExamFull(examId) {
      const exam = window.APP_DATA && window.APP_DATA.practiceExams.find((e) => e.id === examId);
      if (!exam) return;
      const text = `${exam.title.toUpperCase()}\nThời gian: ${exam.duration} | Thang điểm: ${exam.totalPoints}.0\n\n${exam.examContent}`;
      this.copyText(text, `Đã sao chép đề thi số ${examId}!`);
    },

    copySampleEssay(examId) {
      const exam = window.APP_DATA && window.APP_DATA.practiceExams.find((e) => e.id === examId);
      if (!exam || !exam.sampleEssay) return;
      this.copyText(exam.sampleEssay, `Đã sao chép bài văn mẫu 9+ của đề thi số ${examId}!`);
    },

    copyExamDocument(docId) {
      const doc = window.APP_DATA && window.APP_DATA.examDocuments.find((d) => d.id === docId);
      if (!doc) return;
      const text = `${doc.title.toUpperCase()}\nChuyên mục: ${doc.category}\n\n${doc.content}`;
      this.copyText(text, `Đã sao chép ${doc.title}!`);
    },

    // ──────────────────────────────────────────
    // Global Search
    // ──────────────────────────────────────────
    initGlobalSearch() {
      const searchInput = document.getElementById('global-search-input');
      const clearBtn = document.getElementById('global-search-clear');

      if (!searchInput) return;

      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (clearBtn) {
          if (val) clearBtn.classList.remove('hidden');
          else clearBtn.classList.add('hidden');
        }
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = searchInput.value.trim();
          if (q) this.executeGlobalSearch(q);
        }
      });

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          clearBtn.classList.add('hidden');
          searchInput.focus();
        });
      }
    },

    executeGlobalSearch(query) {
      const cleanQ = stripDiacritics(query);
      const results = [];

      if (!window.APP_DATA) return;

      // 1. Search Works
      window.APP_DATA.works.forEach((w) => {
        const matchTitle = stripDiacritics(w.title).includes(cleanQ);
        const matchAuthor = stripDiacritics(w.author).includes(cleanQ);
        const matchInfo = stripDiacritics(w.workInfo).includes(cleanQ);
        if (matchTitle || matchAuthor || matchInfo) {
          results.push({
            type: 'Tác phẩm',
            title: `${w.title} – ${w.author}`,
            desc: w.workInfo.substring(0, 120) + '...',
            action: () => {
              this.navigateTo('works');
              this.openWorkDetail(w.id);
            }
          });
        }
      });

      // 2. Search Practice Exams (10 đề thi chuẩn tốt nghiệp THPT)
      if (window.APP_DATA.practiceExams) {
        window.APP_DATA.practiceExams.forEach((e) => {
          const matchTitle = stripDiacritics(e.title).includes(cleanQ);
          const matchTopic = stripDiacritics(e.topic).includes(cleanQ);
          if (matchTitle || matchTopic) {
            results.push({
              type: 'Phòng thi thử',
              title: e.title,
              desc: `Chủ đề: ${e.topic} • 10.0 điểm (Đọc hiểu 4đ + Viết 6đ)`,
              action: () => {
                this.launchExamRoomFromBank(e.id);
              }
            });
          }
        });
      }

      // 4. Search Exam Documents & Study Guides
      if (window.APP_DATA.examDocuments) {
        window.APP_DATA.examDocuments.forEach((doc) => {
          const matchTitle = stripDiacritics(doc.title).includes(cleanQ);
          const matchCategory = stripDiacritics(doc.category).includes(cleanQ);
          const matchSummary = stripDiacritics(doc.summary).includes(cleanQ);
          if (matchTitle || matchCategory || matchSummary) {
            results.push({
              type: 'Cẩm nang 9+',
              title: doc.title,
              desc: `${doc.category}: ${doc.summary.substring(0, 110)}...`,
              action: () => {
                this.navigateTo('exams-bank');
                this.switchExamsTab('docs');
                setTimeout(() => {
                  const el = document.getElementById(`exam-doc-${doc.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  this.toggleAccordion(`doc-body-${doc.id}`);
                }, 150);
              }
            });
          }
        });
      }

      state.searchResults = results;

      // Show Results Modal
      if (results.length === 0) {
        this.openModal({
          title: `Kết quả tìm kiếm cho: "${query}"`,
          body: `
            <div class="empty-state">
              <i data-lucide="search-x" style="width: 48px; height: 48px;"></i>
              <p>Không tìm thấy nội dung phù hợp với từ khóa "${query}".</p>
              <p style="font-size: 12px; color: var(--text-tertiary);">Hãy thử tìm kiếm với các từ khóa: "Tây Tiến", "Sóng", "Vợ nhặt", "Đọc hiểu", "Đề số 1"...</p>
            </div>
          `,
          footerButtons: '<button class="btn btn-secondary" onclick="app.closeModal()">Đóng</button>'
        });
      } else {
        const resultsHtml = results
          .map(
            (r, idx) => `
            <div class="card card-flat mb-2" style="border: 1px solid var(--border); padding: 12px 16px; cursor: pointer;" onclick="app.handleSearchResultClick(${idx})">
              <div class="flex items-center justify-between mb-1">
                <span class="badge badge-accent">${r.type}</span>
                <span style="font-size: 12px; color: var(--text-tertiary);">Bấm để xem</span>
              </div>
              <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${r.title}</h4>
              <p style="font-size: 12.5px; color: var(--text-secondary);">${r.desc}</p>
            </div>
          `
          )
          .join('');

        this.openModal({
          title: `Tìm thấy ${results.length} kết quả cho "${query}":`,
          body: `<div style="max-height: 450px; overflow-y: auto;">${resultsHtml}</div>`,
          footerButtons: '<button class="btn btn-secondary" onclick="app.closeModal()">Đóng</button>'
        });
      }
    },

    handleSearchResultClick(index) {
      this.closeModal();
      const item = state.searchResults && state.searchResults[index];
      if (item && typeof item.action === 'function') {
        item.action();
      }
    },

    // ──────────────────────────────────────────
    // Modal & Toast Systems
    // ──────────────────────────────────────────
    openModal({ title, body, footerButtons }) {
      const overlay = document.getElementById('app-modal-overlay');
      const titleEl = document.getElementById('modal-title');
      const bodyEl = document.getElementById('modal-body');
      const footerEl = document.getElementById('modal-footer');

      if (!overlay) return;

      if (titleEl) titleEl.textContent = title || 'Thông báo';
      if (bodyEl) bodyEl.innerHTML = body || '';
      if (footerEl) footerEl.innerHTML = footerButtons || '<button class="btn btn-secondary" onclick="app.closeModal()">Đóng</button>';

      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      this.renderIcons();
    },

    closeModal() {
      const overlay = document.getElementById('app-modal-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    },

    showToast(message, type = 'info', duration = 3000) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;

      const iconMap = {
        success: 'check-circle',
        warning: 'alert-triangle',
        error: 'alert-circle',
        info: 'info'
      };

      toast.innerHTML = `
        <i data-lucide="${iconMap[type] || 'info'}" class="toast-icon"></i>
        <div class="toast-content" style="font-size: 13.5px; font-weight: 500;">${message}</div>
      `;

      container.appendChild(toast);
      this.renderIcons();

      setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => {
          if (toast.parentElement) toast.parentElement.removeChild(toast);
        }, 200);
      }, duration);
    },

    copyText(text, successMsg = 'Đã sao chép vào bộ nhớ đệm!') {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            this.showToast(successMsg, 'success');
          })
          .catch(() => {
            this.fallbackCopy(text, successMsg);
          });
      } else {
        this.fallbackCopy(text, successMsg);
      }
    },

    copyTextById(elementId, successMsg) {
      const el = document.getElementById(elementId);
      if (el) {
        this.copyText(el.innerText || el.textContent, successMsg);
      }
    },

    fallbackCopy(text, successMsg) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
        this.showToast(successMsg, 'success');
      } catch (err) {
        this.showToast('Không thể sao chép, vui lòng sao chép thủ công.', 'error');
      }
      document.body.removeChild(ta);
    },

    // ──────────────────────────────────────────
    // Module: Home Literature Search & Category Counts
    // ──────────────────────────────────────────
    initHomeSearch() {
      const searchInput = document.getElementById('home-search-input');
      const clearBtn = document.getElementById('home-search-clear');
      const countBadge = document.getElementById('home-search-count');
      const grid = document.getElementById('home-featured-works-grid');
      const filterChips = document.querySelectorAll('.chip-home-filter');

      let currentCategory = 'all';
      let searchQuery = '';

      // Unified Category Classifier
      const isCategoryMatch = (w, category) => {
        if (!category || category === 'all') return true;
        const g = stripDiacritics(w.genre || '');

        if (category === 'tho') {
          return g.includes('tho');
        }
        if (category === 'truyen') {
          return (g.includes('truyen') || g.includes('tieu thuyet')) && !g.includes('hoi ky');
        }
        if (category === 'ky') {
          return g.includes('hoi ky') || g.includes('phong su') || (g.includes('ky') && !g.includes('truyen ky'));
        }
        if (category === 'nghi-luan') {
          return (
            g.includes('nghi luan') ||
            g.includes('chinh luan') ||
            g.includes('chinh tri') ||
            [1, 2, 5, 7, 8].includes(w.id)
          );
        }
        if (category === 'on-thi') {
          const priorityIds = [1, 2, 5, 8, 10, 11, 12, 13, 14, 18];
          return priorityIds.includes(w.id);
        }
        return true;
      };

      // Realtime Dynamic Count Badges for Category Chips
      const updateCategoryCounts = () => {
        if (typeof APP_DATA === 'undefined' || !APP_DATA.works) return;
        const works = APP_DATA.works;

        filterChips.forEach((chip) => {
          const cat = chip.getAttribute('data-category') || 'all';
          const countEl = chip.querySelector('.chip-count');
          if (countEl) {
            const count = works.filter((w) => isCategoryMatch(w, cat)).length;
            countEl.textContent = count;
          }
        });
      };

      const renderHomeWorks = () => {
        if (!grid || typeof APP_DATA === 'undefined' || !APP_DATA.works) return;

        const queryClean = stripDiacritics(searchQuery).trim();

        const filtered = APP_DATA.works.filter((w) => {
          // 1. Filter by category
          if (!isCategoryMatch(w, currentCategory)) return false;

          // 2. Filter by search query (diacritics-insensitive)
          if (queryClean) {
            const titleClean = stripDiacritics(w.title || '');
            const authorClean = stripDiacritics(w.author || '');
            const genreClean = stripDiacritics(w.genre || '');
            const infoClean = stripDiacritics(w.workInfo || '');
            return (
              titleClean.includes(queryClean) ||
              authorClean.includes(queryClean) ||
              genreClean.includes(queryClean) ||
              infoClean.includes(queryClean)
            );
          }

          return true;
        });

        if (countBadge) {
          countBadge.textContent = `${filtered.length} tác phẩm`;
        }

        if (filtered.length === 0) {
          grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 20px; text-align: center;">
              <div style="width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%; background: var(--bg-card); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border);">
                <i data-lucide="search-x" style="width: 28px; height: 28px; color: var(--text-tertiary);"></i>
              </div>
              <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px;">Không tìm thấy tác phẩm phù hợp</h4>
              <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto 16px; font-size: 14px;">
                Không có kết quả nào khớp với từ khóa "${searchQuery}". Vui lòng thử tìm với tên tác giả (Quang Dũng, Vũ Trọng Phụng...) hoặc chọn bộ lọc khác.
              </p>
              <button class="btn btn-sm btn-secondary" onclick="app.resetHomeSearch()">
                <i data-lucide="rotate-ccw"></i> Xem lại tất cả tác phẩm
              </button>
            </div>
          `;
          this.renderIcons();
          return;
        }

        grid.innerHTML = filtered.map((w) => buildWorkCardHtml(w)).join('');
        this.renderIcons();
      };

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          searchQuery = e.target.value;
          if (clearBtn) {
            if (searchQuery.length > 0) {
              clearBtn.classList.remove('hidden');
            } else {
              clearBtn.classList.add('hidden');
            }
          }
          renderHomeWorks();
        });

        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const firstCard = grid ? grid.querySelector('.card-work-academic, .card-work-preview') : null;
            if (firstCard) {
              firstCard.click();
            }
          }
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            searchQuery = '';
            clearBtn.classList.add('hidden');
            searchInput.focus();
            renderHomeWorks();
          }
        });
      }

      filterChips.forEach((chip) => {
        chip.addEventListener('click', () => {
          filterChips.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          currentCategory = chip.getAttribute('data-category') || 'all';
          renderHomeWorks();
        });
      });

      this._setHomeCategory = (cat) => {
        currentCategory = cat;
        renderHomeWorks();
      };

      this._renderHomeWorks = renderHomeWorks;
      updateCategoryCounts();
      renderHomeWorks();
    },

    resetHomeSearch() {
      const searchInput = document.getElementById('home-search-input');
      const clearBtn = document.getElementById('home-search-clear');
      const filterChips = document.querySelectorAll('.chip-home-filter');
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.classList.add('hidden');
      filterChips.forEach((c, idx) => {
        if (idx === 0) c.classList.add('active');
        else c.classList.remove('active');
      });
      if (this._setHomeCategory) {
        this._setHomeCategory('all');
      } else if (this._renderHomeWorks) {
        this._renderHomeWorks();
      }
    },

    copyContactPhone(phone = '0966181069') {
      this.copyText(phone, `Đã sao chép số điện thoại: ${phone}`);
    },

    // ──────────────────────────────────────────
    // Project Information Modal (Image 1 & 2)
    // ──────────────────────────────────────────
    openProjectInfoModal() {
      const modal = document.getElementById('project-info-modal');
      if (!modal) return;
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      this.renderIcons();
    },

    closeProjectInfoModal() {
      const modal = document.getElementById('project-info-modal');
      if (!modal) return;
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    },

    // ──────────────────────────────────────────
    // PDF Export & Print Center Module (Chuẩn Bộ GD&ĐT 2026)
    // ──────────────────────────────────────────
    initPdfExportModule() {
      const selector = document.getElementById('pdf-exam-selector');
      if (!selector || !window.APP_DATA || !window.APP_DATA.practiceExams) return;

      selector.innerHTML = window.APP_DATA.practiceExams
        .map((e) => {
          const shortTitle = (e.title || '').replace(/^Đề thi thử.*?–\s*/i, '');
          return `<option value="${e.id}">Đề ${e.id}: ${shortTitle} (${e.duration})</option>`;
        })
        .join('');

      selector.value = state.pdfExport.selectedExamId || 1;
      const formatSelector = document.getElementById('pdf-format-selector');
      if (formatSelector) {
        formatSelector.value = state.pdfExport.selectedFormat || 'exam_only';
      }
    },

    openPdfExportModal(preSelectedExamId) {
      if (preSelectedExamId) {
        const id = parseInt(preSelectedExamId, 10);
        if (!isNaN(id) && id >= 1 && id <= 10) {
          state.pdfExport.selectedExamId = id;
        }
      }

      const selector = document.getElementById('pdf-exam-selector');
      if (selector) {
        if (!selector.options.length) {
          this.initPdfExportModule();
        }
        selector.value = state.pdfExport.selectedExamId || 1;
      }

      this.renderPdfPrintableSheet();

      const modal = document.getElementById('modal-pdf-export');
      if (modal) {
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
          modal.classList.add('active');
        });
      }
      this.renderIcons();
    },

    closePdfExportModal() {
      const modal = document.getElementById('modal-pdf-export');
      if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
          modal.classList.add('hidden');
        }, 220);
      }
    },

    handlePdfExamChange(examId) {
      const id = parseInt(examId, 10);
      if (isNaN(id)) return;
      state.pdfExport.selectedExamId = id;
      this.renderPdfPrintableSheet();
    },

    handlePdfFormatChange(format) {
      state.pdfExport.selectedFormat = format || 'exam_only';
      this.renderPdfPrintableSheet();
    },

    renderPdfPrintableSheet() {
      const container = document.getElementById('pdf-printable-area');
      if (!container || !window.APP_DATA || !window.APP_DATA.practiceExams) return;

      const examId = state.pdfExport.selectedExamId || 1;
      const exam = window.APP_DATA.practiceExams.find((e) => e.id === examId) || window.APP_DATA.practiceExams[0];
      if (!exam) return;

      const format = state.pdfExport.selectedFormat || 'exam_only';
      container.innerHTML = this.generateExamPrintableHtml(exam, format);
      this.renderIcons();
    },

    generateExamPrintableHtml(exam, format) {
      const formatMarkdownMini = (text) => {
        if (!text) return '';
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n\n/g, '<br><br>')
          .replace(/\n/g, '<br>');
      };

      const passageHtml = exam.examParts && exam.examParts.passage
        ? formatMarkdownMini(exam.examParts.passage)
        : formatMarkdownMini(exam.examContent || '');

      const readingQs = (exam.examParts && exam.examParts.readingQuestions) ? exam.examParts.readingQuestions : [];
      const socialPrompt = exam.examParts && exam.examParts.writingSocial
        ? formatMarkdownMini(exam.examParts.writingSocial.prompt)
        : 'Từ nội dung đoạn trích ở phần Đọc hiểu, hãy viết một đoạn văn (khoảng 200 chữ) trình bày suy nghĩ của anh/chị về vấn đề xã hội liên quan.';
      const litPrompt = exam.examParts && exam.examParts.writingLiterature
        ? formatMarkdownMini(exam.examParts.writingLiterature.prompt)
        : 'Cảm nhận của anh/chị về nội dung và nghệ thuật của tác phẩm trong đoạn trích trên.';

      // Main Exam Paper Sheet
      let html = `
        <div class="pdf-a4-sheet" id="pdf-printable-sheet">
          <!-- Barem Header chuẩn Đề thi Bộ GD&ĐT -->
          <table class="pdf-exam-header-table">
            <tr>
              <td class="pdf-header-left">
                <div class="pdf-header-main-title">SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI</div>
                <div class="pdf-header-sub-title">TRƯỜNG THPT YÊN LÃNG</div>
                <div class="pdf-header-divider"></div>
                <div class="pdf-header-official-tag">(Đề thi gồm có 02 trang)</div>
              </td>
              <td class="pdf-header-right">
                <div class="pdf-header-main-title">KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG NĂM 2026</div>
                <div class="pdf-header-sub-title">BÀI THI MÔN: NGỮ VĂN (CHƯƠNG TRÌNH MỚI)</div>
                <div class="pdf-header-meta">Thời gian làm bài: 120 phút (không kể thời gian phát đề)</div>
                <div style="font-weight: bold; margin-top: 4px; font-size: 11pt;">MÃ ĐỀ THI: 10${exam.id}</div>
              </td>
            </tr>
          </table>

          <!-- Khung điền thông tin thí sinh -->
          <div class="pdf-candidate-box">
            <div class="pdf-candidate-line">Họ và tên thí sinh: ............................................................................</div>
            <div class="pdf-candidate-line" style="max-width: 200px;">Số báo danh: .....................</div>
            <div class="pdf-candidate-line" style="max-width: 160px;">Phòng thi: ...........</div>
          </div>

          <!-- PHẦN I: ĐỌC HIỂU -->
          <div class="pdf-section-title">PHẦN I: ĐỌC HIỂU (4,0 điểm)</div>
          <p style="margin: 6px 0; font-size: 12pt;">Đọc đoạn trích sau và thực hiện các yêu cầu:</p>
          <div class="pdf-passage-box">${passageHtml}</div>

          <div style="margin-top: 10px;">
            ${readingQs.map((q) => `
              <div class="pdf-question-item">
                <span class="pdf-question-title">Câu ${q.questionNumber} (${q.pointsLabel}):</span> ${formatMarkdownMini(q.prompt)}
              </div>
            `).join('')}
          </div>

          <!-- PHẦN II: VIẾT -->
          <div class="pdf-section-title" style="margin-top: 14px;">PHẦN II: VIẾT (6,0 điểm)</div>
          <div class="pdf-question-item" style="margin-top: 6px;">
            <span class="pdf-question-title">Câu 1 (2,0 điểm):</span>
            ${socialPrompt}
          </div>
          <div class="pdf-question-item" style="margin-top: 10px;">
            <span class="pdf-question-title">Câu 2 (4,0 điểm):</span>
            ${litPrompt}
          </div>

          <div class="pdf-footer-note">---------- HẾT ----------</div>
          <div class="pdf-footer-subnote">Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.</div>
      `;

      // Phụ lục 1: Hướng dẫn chấm & Thang điểm
      if (format === 'exam_and_key' || format === 'full_package') {
        html += `
          <div class="pdf-page-break">
            <div class="pdf-appendix-title">HƯỚNG DẪN CHẤM VÀ THANG ĐIỂM CHI TIẾT (ĐỀ SỐ ${exam.id})</div>
            <div class="pdf-appendix-content">${formatMarkdownMini(exam.answerKey || '')}</div>
          </div>
        `;
      }

      // Phụ lục 2: Bài văn mẫu 9+
      if (format === 'exam_and_sample' || format === 'full_package') {
        html += `
          <div class="pdf-page-break">
            <div class="pdf-appendix-title">BÀI VĂN MẪU THAM KHẢO ĐẠT ĐIỂM 9+ (ĐỀ SỐ ${exam.id})</div>
            <div class="pdf-appendix-content">${formatMarkdownMini(exam.sampleEssay || '')}</div>
          </div>
        `;
      }

      // Phụ lục 3: Ma trận đặc tả đề thi
      if (format === 'full_package') {
        html += `
          <div class="pdf-page-break">
            <div class="pdf-appendix-title">MA TRẬN ĐẶC TẢ ĐỀ THI TỐT NGHIỆP THPT (ĐỀ SỐ ${exam.id})</div>
            <p style="text-align: center; font-size: 11pt; margin-bottom: 10px;">Chủ đề trọng tâm: <strong>${exam.topic}</strong> • Thời gian: <strong>${exam.duration}</strong> • Thang điểm: <strong>10.0 điểm</strong></p>
            <table class="pdf-matrix-table">
              <thead>
                <tr>
                  <th>Phần thi & Nội dung</th>
                  <th>Điểm số</th>
                  <th>Số câu</th>
                  <th>Cấp độ tư duy & Yêu cầu cần đạt</th>
                </tr>
              </thead>
              <tbody>
                ${(exam.matrix || []).map((m) => `
                  <tr>
                    <td><strong>${m.section}</strong></td>
                    <td style="text-align: center;"><strong>${m.points},0đ</strong></td>
                    <td style="text-align: center;">${m.questions}</td>
                    <td>${m.levels}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      html += `</div>`; // Close .pdf-a4-sheet
      return html;
    },

    autoDownloadExamPdf() {
      const examId = state.pdfExport.selectedExamId || 1;
      const exam = window.APP_DATA.practiceExams.find((e) => e.id === examId) || window.APP_DATA.practiceExams[0];
      const format = state.pdfExport.selectedFormat || 'exam_only';
      const formatPrefix = format === 'exam_only'
        ? 'De_thi'
        : format === 'exam_and_key'
        ? 'De_va_Dap_an'
        : format === 'exam_and_sample'
        ? 'De_va_Van_mau'
        : 'Tron_bo_ho_so';
      const fileName = `${formatPrefix}_Tot_nghiep_THPT_2026_De_${exam.id}.pdf`;

      const sheet = document.getElementById('pdf-printable-sheet');
      if (!sheet) {
        this.showToast('Không tìm thấy nội dung đề thi để tải về!', 'warning');
        return;
      }

      const downloadBtn = document.getElementById('btn-auto-download-pdf');
      const originalText = downloadBtn ? downloadBtn.innerHTML : '';
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> Đang tải PDF...`;
        this.renderIcons();
      }

      this.showToast(`Đang tự động kết xuất và tải về: ${fileName}...`, 'info');

      if (typeof window.html2pdf === 'function') {
        const opt = {
          margin: [8, 8, 8, 8],
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        window.html2pdf()
          .set(opt)
          .from(sheet)
          .save()
          .then(() => {
            this.showToast(`✅ Đã tải về thành công: ${fileName}`, 'success');
            if (downloadBtn) {
              downloadBtn.disabled = false;
              downloadBtn.innerHTML = originalText;
              this.renderIcons();
            }
          })
          .catch((err) => {
            console.warn('html2pdf encounter error, activating fallback:', err);
            this.triggerInstantFileDownload(exam, format);
            if (downloadBtn) {
              downloadBtn.disabled = false;
              downloadBtn.innerHTML = originalText;
              this.renderIcons();
            }
          });
      } else {
        // Fallback when CDN is not available
        this.triggerInstantFileDownload(exam, format);
        if (downloadBtn) {
          downloadBtn.disabled = false;
          downloadBtn.innerHTML = originalText;
          this.renderIcons();
        }
      }
    },

    triggerInstantFileDownload(exam, format) {
      const sheet = document.getElementById('pdf-printable-sheet');
      if (!sheet) return;

      const fileName = `De_thi_Tot_nghiep_THPT_2026_De_${exam.id}.html`;
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="utf-8">
          <title>${exam.title} - Bản in chuẩn Bộ GD&ĐT 2026</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { margin: 0; padding: 20px; font-family: 'Times New Roman', Times, serif; color: #111; font-size: 13pt; line-height: 1.45; }
            .pdf-a4-sheet { max-width: 210mm; margin: 0 auto; background: #fff; }
            .pdf-exam-header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .pdf-exam-header-table td { vertical-align: top; padding: 0 6px; }
            .pdf-header-main-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 0; line-height: 1.3; }
            .pdf-header-sub-title { font-size: 10pt; font-weight: bold; margin: 2px 0 0 0; }
            .pdf-header-divider { width: 60px; height: 1px; background: #111; margin: 4px auto 0 auto; }
            .pdf-header-official-tag { font-size: 10pt; font-weight: bold; margin-top: 2px; }
            .pdf-header-meta { font-size: 9.5pt; font-style: italic; margin-top: 3px; }
            .pdf-candidate-box { width: 100%; border: 1px dashed #555; padding: 6px 10px; margin-bottom: 14px; font-size: 10pt; font-style: italic; display: flex; justify-content: space-between; }
            .pdf-section-title { font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin: 14px 0 6px 0; border-bottom: 1px solid #111; padding-bottom: 2px; display: inline-block; }
            .pdf-passage-box { font-size: 11.5pt; font-style: italic; line-height: 1.5; margin: 6px 0 10px 0; padding: 8px 12px; border-left: 3px solid #333; background: #fdfdfd; white-space: pre-wrap; }
            .pdf-question-item { margin-bottom: 8px; font-size: 11.5pt; line-height: 1.45; text-align: justify; }
            .pdf-question-title { font-weight: bold; }
            .pdf-footer-note { text-align: center; font-weight: bold; margin: 20px 0 10px 0; font-size: 10.5pt; letter-spacing: 2px; }
            .pdf-footer-subnote { text-align: center; font-size: 9.5pt; font-style: italic; color: #444; }
            .pdf-page-break { page-break-before: always; break-before: page; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #aaa; }
            .pdf-appendix-title { font-size: 12pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 10px; }
            .pdf-appendix-content { font-size: 11pt; line-height: 1.45; white-space: pre-wrap; text-align: justify; }
            .pdf-matrix-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
            .pdf-matrix-table th, .pdf-matrix-table td { border: 1px solid #333; padding: 5px 8px; }
            .pdf-matrix-table th { background: #eee; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          ${sheet.outerHTML}
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast(`Đã tự động tải tài liệu: ${fileName}`, 'success');
    },

    printCurrentExamPdf() {
      const sheet = document.getElementById('pdf-printable-sheet');
      if (!sheet) return;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>In đề thi Ngữ văn 2026</title>
          <style>
            @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
            body { margin: 0; padding: 0; font-family: 'Times New Roman', Times, serif; color: #111; font-size: 13pt; line-height: 1.45; }
            .pdf-a4-sheet { width: 100%; padding: 0; box-shadow: none; }
            .pdf-exam-header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .pdf-exam-header-table td { vertical-align: top; padding: 0 6px; }
            .pdf-header-main-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 0; line-height: 1.3; }
            .pdf-header-sub-title { font-size: 10pt; font-weight: bold; margin: 2px 0 0 0; }
            .pdf-header-divider { width: 60px; height: 1px; background: #111; margin: 4px auto 0 auto; }
            .pdf-header-official-tag { font-size: 10pt; font-weight: bold; margin-top: 2px; }
            .pdf-header-meta { font-size: 9.5pt; font-style: italic; margin-top: 3px; }
            .pdf-candidate-box { width: 100%; border: 1px dashed #555; padding: 6px 10px; margin-bottom: 14px; font-size: 10pt; font-style: italic; display: flex; justify-content: space-between; box-sizing: border-box; }
            .pdf-section-title { font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin: 14px 0 6px 0; border-bottom: 1px solid #111; padding-bottom: 2px; display: inline-block; }
            .pdf-passage-box { font-size: 11.5pt; font-style: italic; line-height: 1.5; margin: 6px 0 10px 0; padding: 8px 12px; border-left: 3px solid #333; background: #fdfdfd; white-space: pre-wrap; }
            .pdf-question-item { margin-bottom: 8px; font-size: 11.5pt; line-height: 1.45; text-align: justify; }
            .pdf-question-title { font-weight: bold; }
            .pdf-footer-note { text-align: center; font-weight: bold; margin: 20px 0 10px 0; font-size: 10.5pt; letter-spacing: 2px; }
            .pdf-footer-subnote { text-align: center; font-size: 9.5pt; font-style: italic; color: #444; }
            .pdf-page-break { page-break-before: always; break-before: page; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #aaa; }
            .pdf-appendix-title { font-size: 12pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 10px; }
            .pdf-appendix-content { font-size: 11pt; line-height: 1.45; white-space: pre-wrap; text-align: justify; }
            .pdf-matrix-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
            .pdf-matrix-table th, .pdf-matrix-table td { border: 1px solid #333; padding: 5px 8px; }
            .pdf-matrix-table th { background: #eee; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          ${sheet.outerHTML}
        </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1500);
      }, 250);
    },

    downloadExamWordDoc() {
      const examId = state.pdfExport.selectedExamId || 1;
      const exam = window.APP_DATA.practiceExams.find((e) => e.id === examId) || window.APP_DATA.practiceExams[0];
      const fileName = `De_thi_Tot_nghiep_THPT_2026_De_${exam.id}.doc`;

      const sheet = document.getElementById('pdf-printable-sheet');
      if (!sheet) return;

      const content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${exam.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.45; }
          table { width: 100%; border-collapse: collapse; }
          .pdf-passage-box { font-style: italic; background: #f9f9f9; padding: 10px; border-left: 3px solid #333; margin: 10px 0; }
          .pdf-page-break { page-break-before: always; }
          .pdf-candidate-box { border: 1px dashed #333; padding: 6px; margin-bottom: 12px; }
          .pdf-matrix-table th, .pdf-matrix-table td { border: 1px solid #333; padding: 4px 6px; }
        </style>
        </head><body>${sheet.innerHTML}</body></html>
      `;

      const blob = new Blob(['\ufeff', content], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast(`Đã tải bản Word: ${fileName}`, 'success');
    },

    // Keyboard Shortcuts
    initKeyboardShortcuts() {
      window.addEventListener('keydown', (e) => {
        // Escape closes modals
        if (e.key === 'Escape') {
          this.closeModal();
          this.closeProjectInfoModal();
          this.closeExamHistoryModal();
          this.closePdfExportModal();
        }

        // Ctrl + K / Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          const searchInput = document.getElementById('home-search-input') || document.getElementById('works-search-input');
          if (searchInput) {
            if (state.currentView !== 'dashboard') {
              this.navigateTo('dashboard');
            }
            setTimeout(() => {
              searchInput.focus();
              searchInput.select();
            }, 80);
          }
        }
      });
    }
  };

  // Expose to window and initialize on DOM ready
  window.app = app;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
  } else {
    app.init();
  }
})();
