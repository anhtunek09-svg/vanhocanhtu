/**
 * VĂN 12 PRO LAB – Interactive Mind Map Module (Chuẩn Barem 9+ Chuyên Sâu)
 * SVG-based mind map with dynamic collision-free layout, direct full-content cards,
 * dual-mode switch (SVG Visual Canvas & Full Knowledge Tree Board),
 * pan/zoom, work comparison, and vector SVG export.
 */

(function () {
  'use strict';

  // ── Genre Color Palettes ──
  const GENRE_COLORS = {
    'thơ':         { primary: '#2563EB', secondary: '#93C5FD', glow: 'rgba(37,99,235,0.25)', gradient: ['#1E40AF','#3B82F6'] },
    'tiểu thuyết': { primary: '#B65335', secondary: '#FBBF99', glow: 'rgba(182,83,53,0.25)', gradient: ['#9C3F24','#D27357'] },
    'trào phúng':  { primary: '#B65335', secondary: '#FBBF99', glow: 'rgba(182,83,53,0.25)', gradient: ['#9C3F24','#D27357'] },
    'kịch':        { primary: '#7C3AED', secondary: '#C4B5FD', glow: 'rgba(124,58,237,0.25)', gradient: ['#5B21B6','#8B5CF6'] },
    'ký':          { primary: '#059669', secondary: '#6EE7B7', glow: 'rgba(5,150,105,0.25)', gradient: ['#047857','#10B981'] },
    'tùy bút':     { primary: '#059669', secondary: '#6EE7B7', glow: 'rgba(5,150,105,0.25)', gradient: ['#047857','#10B981'] },
    'tản văn':     { primary: '#059669', secondary: '#6EE7B7', glow: 'rgba(5,150,105,0.25)', gradient: ['#047857','#10B981'] },
    'nghị luận':   { primary: '#D97706', secondary: '#FCD34D', glow: 'rgba(217,119,6,0.25)', gradient: ['#B45309','#F59E0B'] },
    'default':     { primary: '#16364A', secondary: '#94A3B8', glow: 'rgba(22,54,74,0.25)', gradient: ['#16364A','#2D5F7A'] }
  };

  function getGenreColor(genre) {
    if (!genre) return GENRE_COLORS['default'];
    const g = genre.toLowerCase();
    for (const key of Object.keys(GENRE_COLORS)) {
      if (g.includes(key)) return GENRE_COLORS[key];
    }
    return GENRE_COLORS['default'];
  }

  // ── Branch Definitions ──
  // Arranged into 3 Left & 3 Right sectors with dedicated roles for mathematical zero-collision
  const BRANCH_DEFS = [
    // Left side (3 branches)
    { key: 'context',  label: 'Hoàn cảnh & Xuất xứ', icon: '📜', side: 'left',  posRole: 'top',    defaultX: -320, defaultY: -280, color: '#D97706' },
    { key: 'author',   label: 'Tác giả & Phong cách', icon: '👤', side: 'left',  posRole: 'center', defaultX: -360, defaultY: 0,    color: '#2563EB' },
    { key: 'evidence', label: 'Dẫn chứng & Lý luận', icon: '✍️', side: 'left',  posRole: 'bottom', defaultX: -320, defaultY: 280,  color: '#16364A' },
    // Right side (3 branches)
    { key: 'themes',   label: 'Chủ đề & Tư tưởng',   icon: '💡', side: 'right', posRole: 'top',    defaultX: 320,  defaultY: -280, color: '#059669' },
    { key: 'content',  label: 'Nội dung phân tích', icon: '📖', side: 'right', posRole: 'center', defaultX: 360,  defaultY: 0,    color: '#B65335' },
    { key: 'art',      label: 'Nghệ thuật đặc sắc', icon: '🎨', side: 'right', posRole: 'bottom', defaultX: 320,  defaultY: 280,  color: '#7C3AED' }
  ];

  // ── State ──
  const mmState = {
    selectedWorkId: null,
    viewMode: 'canvas', // 'canvas' | 'outline'
    expandedNodes: new Set(),
    // Base view box (centered at origin)
    defaultViewBox: { x: -650, y: -480, w: 1300, h: 960 },
    expandedViewBox: { x: -1100, y: -1050, w: 2200, h: 2100 },
    viewBox: { x: -650, y: -480, w: 1300, h: 960 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
    panStartViewBox: null,
    zoomLevel: 1,
    outlineSearchQuery: ''
  };

  // Card geometry tokens
  const CARD_W = 340;
  const GAP_Y = 16;
  const SECTOR_GAP = 32;

  // ── Text Formatting Helpers ──
  function wrapText(text, maxLen) {
    if (!text) return [''];
    const words = String(text).trim().split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      if ((line + ' ' + word).trim().length > maxLen) {
        if (line) lines.push(line.trim());
        line = word;
      } else {
        line = line ? line + ' ' + word : word;
      }
    }
    if (line) lines.push(line.trim());
    return lines.length ? lines : [''];
  }

  function truncate(str, max) {
    if (!str) return '';
    const s = String(str).trim();
    return s.length > max ? s.substring(0, max) + '…' : s;
  }

  function getWork(id) {
    if (!window.APP_DATA || !APP_DATA.works) return null;
    return APP_DATA.works.find(w => w.id === parseInt(id, 10)) || null;
  }

  // ── Extract Mind Map Data from Work (Chuẩn Barem 9+ Chuyên Sâu) ──
  function extractMindMapData(work) {
    if (!work) return null;
    const pInfo = work.authorPortraitInfo || {};
    const spec = work.expressionSpec || {};
    const data = {
      center: { title: work.title, author: work.author, genre: work.genre },
      branches: {}
    };

    // ── Branch 1: Hoàn cảnh & Xuất xứ (context) ──
    data.branches.context = {
      key: 'context',
      title: 'Hoàn cảnh & Xuất xứ',
      items: [
        {
          tag: 'Thời đại',
          heading: 'Bối cảnh lịch sử - xã hội',
          summary: work.context || 'Bối cảnh lịch sử và không khí thời đại tác động trực tiếp đến sự ra đời của tác phẩm.',
          evidence: work.year ? `Năm sáng tác: ${work.year}` : '',
          fullText: work.context
        },
        {
          tag: 'Văn bản',
          heading: 'Xuất xứ & Vị trí văn bản',
          summary: work.workInfo || `Tác phẩm tiêu biểu của ${work.author}, thuộc chương trình Ngữ văn 12 mới.`,
          evidence: `Tập ${work.volume || 1} · Bài ${work.lesson || 1}`,
          fullText: work.workInfo
        },
        {
          tag: 'Cảm hứng',
          heading: 'Cảm hứng & Đề tài chủ đạo',
          summary: `${work.title} kết tinh cảm hứng nhân sinh sâu sắc về đề tài ${work.genre.toLowerCase()}, thể hiện cái nhìn thấu thị của tác giả đối với con người và thời đại.`,
          evidence: `Thể loại: ${work.genre}`,
          fullText: `${work.title} là sáng tạo tiêu biểu của ${work.author}, kết tinh cảm hứng nhân văn và sự thấu thị hiện thực đời sống sâu sắc.`
        }
      ]
    };

    // ── Branch 2: Tác giả & Phong cách (author) ──
    data.branches.author = {
      key: 'author',
      title: 'Tác giả & Phong cách',
      items: [
        {
          tag: 'Tiểu sử',
          heading: `${work.author} ${pInfo.birthDeathYears ? '(' + pInfo.birthDeathYears + ')' : ''}`,
          summary: work.authorBio || `${work.author} là cây bút lớn của nền văn học dân tộc.`,
          evidence: pInfo.hometown ? `Quê quán: ${pInfo.hometown}` : '',
          fullText: work.authorBio
        },
        {
          tag: 'Vị trí sử',
          heading: pInfo.literaryTitle || 'Gương mặt tiêu biểu văn học hiện đại',
          summary: `${work.author} là cây bút trụ cột có nhiều đóng góp cách tân quan trọng, định hình diện mạo thể loại trong lịch sử văn học dân tộc.`,
          evidence: pInfo.literaryTitle || '',
          fullText: `${pInfo.literaryTitle || work.author}: Tác giả tiêu biểu của nền văn học Việt Nam với tầm vóc tư tưởng và đóng góp nghệ thuật đặc sắc.`
        },
        {
          tag: 'Thi pháp',
          heading: 'Phong cách nghệ thuật & Quan niệm sáng tác',
          summary: work.authorAesthetics || `${work.author} quan niệm văn chương phải gắn chặt với sự thật đời sống và hướng tới giá trị nhân bản cao đẹp.`,
          evidence: spec.languageStyle ? `Phong cách: ${spec.languageStyle}` : '',
          fullText: work.authorAesthetics
        }
      ]
    };

    // ── Branch 3: Dẫn chứng & Lý luận phê bình 9+ (evidence) ──
    const evidenceItems = [];
    (work.quotes || []).slice(0, 3).forEach((q, idx) => {
      evidenceItems.push({
        tag: `Dẫn chứng ${idx + 1}`,
        heading: `Dẫn chứng then chốt #${idx + 1}`,
        summary: `«${q}»`,
        evidence: `Văn bản: ${work.title}`,
        fullText: `Dẫn chứng then chốt: «${q}».\n\nChi tiết đắt giá làm điểm tựa phân tích và chứng minh luận điểm khi triển khai bài viết đạt chuẩn điểm 9+.`
      });
    });
    (work.scholarlyQuotes || []).slice(0, 2).forEach((sq) => {
      evidenceItems.push({
        tag: 'Lý luận 9+',
        heading: `Nhận định: ${sq.critic}`,
        summary: `«${sq.quote}»`,
        evidence: `Nhà phê bình: ${sq.critic}`,
        commentary: `Vận dụng nhận định của ${sq.critic} vào phần đánh giá nâng cao, mở bài hoặc kết bài để bài văn đạt barem điểm 9+.`,
        fullText: `Nhận định của ${sq.critic}:\n«${sq.quote}»\n\nVận dụng ý kiến này khi bàn luận mở rộng về phong cách tác giả hoặc giá trị tư tưởng tác phẩm.`
      });
    });
    data.branches.evidence = {
      key: 'evidence',
      title: 'Dẫn chứng & Lý luận',
      items: evidenceItems
    };

    // ── Branch 4: Chủ đề & Tư tưởng (themes) ──
    const themeItems = (work.mainThemes || []).map((t, idx) => {
      const parts = t.split(':');
      const heading = parts.length > 1 ? parts[0].trim() : `Luận đề tư tưởng #${idx + 1}`;
      const summary = parts.length > 1 ? parts.slice(1).join(':').trim() : t;
      return {
        tag: `Tư tưởng ${idx + 1}`,
        heading: heading,
        summary: summary,
        evidence: '',
        fullText: t
      };
    });
    data.branches.themes = {
      key: 'themes',
      title: 'Chủ đề & Tư tưởng',
      items: themeItems
    };

    // ── Branch 5: Nội dung phân tích chi tiết (content) ──
    const contentItems = (work.contentAnalysis || []).map((c, idx) => {
      const cleanHeading = (c.heading || `Luận điểm ${idx + 1}`).replace(/^\d+[\.\s\-]+/, '');
      return {
        tag: `Luận điểm ${idx + 1}`,
        heading: cleanHeading,
        summary: c.content || '',
        evidence: c.evidence || '',
        commentary: c.literaryCommentary || '',
        fullText: `${c.content || ''}\n\n[Lời bình nâng cao 9+]: ${c.literaryCommentary || ''}\n\n[Dẫn chứng văn bản]: ${c.evidence || ''}`
      };
    });
    data.branches.content = {
      key: 'content',
      title: 'Nội dung phân tích',
      items: contentItems
    };

    // ── Branch 6: Nghệ thuật đặc sắc & Thi pháp (art) ──
    const artItems = [];
    (work.artisticValues || []).forEach((a, idx) => {
      artItems.push({
        tag: `Nghệ thuật ${idx + 1}`,
        heading: `Đặc sắc nghệ thuật #${idx + 1}`,
        summary: a,
        evidence: '',
        fullText: a
      });
    });
    if (spec.dominantTone) {
      artItems.push({
        tag: 'Giọng điệu',
        heading: 'Giọng điệu & Ngôn ngữ',
        summary: `Giọng điệu chủ đạo: ${spec.dominantTone}. Phong cách ngôn ngữ: ${spec.languageStyle || 'Nghệ thuật giàu hình ảnh'}.`,
        evidence: spec.dominantTone,
        fullText: `Giọng điệu chủ đạo: ${spec.dominantTone}.\nPhong cách ngôn ngữ: ${spec.languageStyle || ''}.\nKết cấu tổ chức: ${spec.formAndStructure || ''}.`
      });
    }
    data.branches.art = {
      key: 'art',
      title: 'Nghệ thuật đặc sắc',
      items: artItems
    };

    return data;
  }

  // ── Height Calculation for Direct SVG Cards ──
  function calculateCardHeight(item) {
    const hLines = wrapText(item.heading, 38).slice(0, 2);
    // Directly visible summary lines (up to 4 lines, 44 chars each)
    const sLines = wrapText(item.summary, 44).slice(0, 4);
    const hasEv = !!item.evidence;
    const hasComm = !!item.commentary;

    let h = 28 + (hLines.length * 15) + (sLines.length * 15) + 12;
    if (hasEv) h += 22;
    if (hasComm) h += 24;
    return Math.max(92, h);
  }

  // ── Layout Computation: Zero Collision Guarantee ──
  function computeSideLayout(sideBranches, mapData, side) {
    const isRight = side === 'right';
    const childX = isRight ? 680 : -680;

    const branchHeights = {};
    const branchCards = {};

    sideBranches.forEach(bDef => {
      const bData = mapData.branches[bDef.key];
      const items = bData ? bData.items || [] : [];
      const isExp = mmState.expandedNodes.has(bDef.key);

      if (!isExp || items.length === 0) {
        branchHeights[bDef.key] = 0;
        branchCards[bDef.key] = [];
      } else {
        const cards = items.map(it => ({
          item: it,
          h: calculateCardHeight(it)
        }));
        const totalH = cards.reduce((s, c) => s + c.h, 0) + Math.max(0, cards.length - 1) * GAP_Y;
        branchHeights[bDef.key] = totalH;
        branchCards[bDef.key] = cards;
      }
    });

    const topDef = sideBranches.find(b => b.posRole === 'top');
    const midDef = sideBranches.find(b => b.posRole === 'center');
    const botDef = sideBranches.find(b => b.posRole === 'bottom');

    const hTop = branchHeights[topDef.key] || 0;
    const hMid = branchHeights[midDef.key] || 0;
    const hBot = branchHeights[botDef.key] || 0;

    // Middle center is anchored around y = 0
    const startY_mid = hMid > 0 ? (-hMid / 2) : 0;
    const endY_mid = startY_mid + hMid;

    // Top sits strictly above middle sector with SECTOR_GAP
    const endY_top = hMid > 0
      ? (startY_mid - SECTOR_GAP)
      : (hTop > 0 ? -120 : -260);
    const startY_top = endY_top - hTop;

    // Bottom sits strictly below middle sector with SECTOR_GAP
    const startY_bot = hMid > 0
      ? (endY_mid + SECTOR_GAP)
      : (hBot > 0 ? 120 : 260);
    const endY_bot = startY_bot + hBot;

    // Branch node positions
    const branchPositions = {
      [topDef.key]: {
        x: topDef.defaultX,
        y: hTop > 0 ? Math.min(-240, startY_top + hTop / 2) : topDef.defaultY
      },
      [midDef.key]: {
        x: midDef.defaultX,
        y: midDef.defaultY
      },
      [botDef.key]: {
        x: botDef.defaultX,
        y: hBot > 0 ? Math.max(240, startY_bot + hBot / 2) : botDef.defaultY
      }
    };

    // Calculate card layout coordinates
    const branchCardLayouts = {};

    function assignCards(bDef, startY) {
      const cards = branchCards[bDef.key] || [];
      let curY = startY;
      branchCardLayouts[bDef.key] = cards.map((c, idx) => {
        const layout = {
          item: c.item,
          idx,
          x: childX,
          y: curY + c.h / 2,
          w: CARD_W,
          h: c.h
        };
        curY += c.h + GAP_Y;
        return layout;
      });
    }

    if (hTop > 0) assignCards(topDef, startY_top);
    if (hMid > 0) assignCards(midDef, startY_mid);
    if (hBot > 0) assignCards(botDef, startY_bot);

    return {
      branchPositions,
      branchCardLayouts,
      bounds: {
        minY: Math.min(startY_top, -360),
        maxY: Math.max(endY_bot, 360)
      }
    };
  }

  // ── SVG Helpers ──
  function buildSvgDefs(svgNS, svg) {
    const defs = document.createElementNS(svgNS, 'defs');

    // Shadow filter
    const filter = document.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', 'mm-shadow');
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');
    const feDropShadow = document.createElementNS(svgNS, 'feDropShadow');
    feDropShadow.setAttribute('dx', '0');
    feDropShadow.setAttribute('dy', '4');
    feDropShadow.setAttribute('stdDeviation', '7');
    feDropShadow.setAttribute('flood-color', 'rgba(0,0,0,0.18)');
    filter.appendChild(feDropShadow);
    defs.appendChild(filter);

    // Glow filter
    const glowFilter = document.createElementNS(svgNS, 'filter');
    glowFilter.setAttribute('id', 'mm-glow');
    glowFilter.setAttribute('x', '-50%');
    glowFilter.setAttribute('y', '-50%');
    glowFilter.setAttribute('width', '200%');
    glowFilter.setAttribute('height', '200%');
    const feGaussian = document.createElementNS(svgNS, 'feGaussianBlur');
    feGaussian.setAttribute('stdDeviation', '7');
    feGaussian.setAttribute('result', 'coloredBlur');
    glowFilter.appendChild(feGaussian);
    const feMerge = document.createElementNS(svgNS, 'feMerge');
    const feMergeNode1 = document.createElementNS(svgNS, 'feMergeNode');
    feMergeNode1.setAttribute('in', 'coloredBlur');
    const feMergeNode2 = document.createElementNS(svgNS, 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    glowFilter.appendChild(feMerge);
    defs.appendChild(glowFilter);

    // Branch gradients
    BRANCH_DEFS.forEach((b) => {
      const grad = document.createElementNS(svgNS, 'linearGradient');
      grad.setAttribute('id', `mm-grad-${b.key}`);
      grad.setAttribute('x1', '0%');
      grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '100%');
      grad.setAttribute('y2', '100%');
      const stop1 = document.createElementNS(svgNS, 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', b.color);
      stop1.setAttribute('stop-opacity', '0.18');
      const stop2 = document.createElementNS(svgNS, 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', b.color);
      stop2.setAttribute('stop-opacity', '0.04');
      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);
    });

    svg.appendChild(defs);
  }

  function createCurvedPath(svgNS, x1, y1, x2, y2, color, strokeWidth = '2.5') {
    const path = document.createElementNS(svgNS, 'path');
    const mx = (x1 + x2) / 2;
    const cx1 = x1 + (mx - x1) * 0.55;
    const cy1 = y1;
    const cx2 = x2 - (x2 - mx) * 0.55;
    const cy2 = y2;
    path.setAttribute('d', `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', strokeWidth);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.65');
    path.setAttribute('stroke-dasharray', '1000');
    path.setAttribute('stroke-dashoffset', '1000');
    path.style.transition = 'stroke-dashoffset 0.6s ease';
    requestAnimationFrame(() => {
      path.setAttribute('stroke-dashoffset', '0');
    });
    return path;
  }

  function createRoundedRect(svgNS, x, y, w, h, rx, fill, stroke, cls) {
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('rx', rx);
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', stroke);
    rect.setAttribute('stroke-width', '1.5');
    if (cls) rect.setAttribute('class', cls);
    return rect;
  }

  function createSvgText(svgNS, x, y, text, fontSize, fill, fontWeight, anchor) {
    const t = document.createElementNS(svgNS, 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.setAttribute('font-size', fontSize);
    t.setAttribute('fill', fill);
    t.setAttribute('font-weight', fontWeight || '400');
    t.setAttribute('text-anchor', anchor || 'middle');
    t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('font-family', "'Be Vietnam Pro', 'Inter', -apple-system, sans-serif");
    t.textContent = text;
    return t;
  }

  // ── Render Mind Map Canvas (SVG) ──
  function renderMindMapCanvas(work, container) {
    container.innerHTML = '';

    if (!work) {
      container.innerHTML = '<div class="mm-empty-state"><i data-lucide="waypoints" style="width:48px;height:48px;color:var(--text-tertiary);margin-bottom:12px;"></i><p>Chọn một tác phẩm để hiện Mind Map tương tác</p></div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const mapData = extractMindMapData(work);
    if (!mapData) return;

    const genreColor = getGenreColor(work.genre);
    const svgNS = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('id', 'mm-svg-canvas');
    svg.setAttribute('class', 'mm-svg-canvas');
    svg.setAttribute('viewBox', `${mmState.viewBox.x} ${mmState.viewBox.y} ${mmState.viewBox.w} ${mmState.viewBox.h}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.cursor = 'grab';

    buildSvgDefs(svgNS, svg);

    // Background subtle grid
    const bgGroup = document.createElementNS(svgNS, 'g');
    bgGroup.setAttribute('class', 'mm-bg-grid');
    for (let gx = -1100; gx <= 1100; gx += 50) {
      for (let gy = -1100; gy <= 1100; gy += 50) {
        const dot = document.createElementNS(svgNS, 'circle');
        dot.setAttribute('cx', gx);
        dot.setAttribute('cy', gy);
        dot.setAttribute('r', '1');
        dot.setAttribute('fill', 'var(--text-tertiary)');
        dot.setAttribute('opacity', '0.12');
        bgGroup.appendChild(dot);
      }
    }
    svg.appendChild(bgGroup);

    // Groups
    const linesGroup = document.createElementNS(svgNS, 'g');
    linesGroup.setAttribute('class', 'mm-lines');

    const nodesGroup = document.createElementNS(svgNS, 'g');
    nodesGroup.setAttribute('class', 'mm-nodes');

    // Compute zero-collision side layouts
    const leftBranches = BRANCH_DEFS.filter(b => b.side === 'left');
    const rightBranches = BRANCH_DEFS.filter(b => b.side === 'right');

    const leftLayout = computeSideLayout(leftBranches, mapData, 'left');
    const rightLayout = computeSideLayout(rightBranches, mapData, 'right');

    const NODE_W = 210, NODE_H = 56;

    // Render Branches
    BRANCH_DEFS.forEach((branchDef) => {
      const branchData = mapData.branches[branchDef.key];
      if (!branchData) return;

      const isRight = branchDef.side === 'right';
      const sideLayout = isRight ? rightLayout : leftLayout;
      const pos = sideLayout.branchPositions[branchDef.key];
      const isExpanded = mmState.expandedNodes.has(branchDef.key);

      // Connection line from Center perimeter to Branch
      const centerConnectX = isRight ? 55 : -55;
      const centerConnectY = pos.y * 0.18;
      const branchConnectX = isRight ? (pos.x - NODE_W / 2) : (pos.x + NODE_W / 2);
      const branchConnectY = pos.y;

      const line = createCurvedPath(svgNS, centerConnectX, centerConnectY, branchConnectX, branchConnectY, branchDef.color, '3');
      linesGroup.appendChild(line);

      // Branch node group
      const nodeGroup = document.createElementNS(svgNS, 'g');
      nodeGroup.setAttribute('class', 'mm-branch-node');
      nodeGroup.setAttribute('data-branch', branchDef.key);
      nodeGroup.style.cursor = 'pointer';
      nodeGroup.style.transition = 'transform 0.25s ease';

      // Background rect
      const bgRect = createRoundedRect(
        svgNS,
        pos.x - NODE_W / 2, pos.y - NODE_H / 2,
        NODE_W, NODE_H, 14,
        `url(#mm-grad-${branchDef.key})`,
        branchDef.color,
        'mm-node-bg'
      );
      bgRect.setAttribute('filter', 'url(#mm-shadow)');
      nodeGroup.appendChild(bgRect);

      // Emoji icon
      const iconText = createSvgText(svgNS, pos.x - NODE_W / 2 + 28, pos.y, branchDef.icon, '18', branchDef.color, '400');
      nodeGroup.appendChild(iconText);

      // Label
      const label = createSvgText(svgNS, pos.x + 10, pos.y - 7, branchDef.label, '13', 'var(--text-primary)', '700');
      nodeGroup.appendChild(label);

      // Count badge
      const count = (branchData.items || []).length;
      const countText = createSvgText(svgNS, pos.x + 10, pos.y + 14, `${count} mục chi tiết`, '10.5', branchDef.color, '600');
      nodeGroup.appendChild(countText);

      // Expand indicator
      const expandIcon = createSvgText(svgNS, pos.x + NODE_W / 2 - 20, pos.y, isExpanded ? '▲' : '▼', '10', branchDef.color, '700');
      expandIcon.setAttribute('class', 'mm-expand-icon');
      expandIcon.setAttribute('data-branch-key', branchDef.key);
      nodeGroup.appendChild(expandIcon);

      // Click to toggle expansion
      nodeGroup.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBranch(branchDef.key);
      });

      // Hover
      nodeGroup.addEventListener('mouseenter', () => {
        bgRect.setAttribute('stroke-width', '3');
        bgRect.setAttribute('filter', 'url(#mm-glow)');
        nodeGroup.style.transform = 'scale(1.04)';
        nodeGroup.style.transformOrigin = `${pos.x}px ${pos.y}px`;
      });
      nodeGroup.addEventListener('mouseleave', () => {
        bgRect.setAttribute('stroke-width', '1.5');
        bgRect.setAttribute('filter', 'url(#mm-shadow)');
        nodeGroup.style.transform = 'scale(1)';
      });

      nodesGroup.appendChild(nodeGroup);

      // Render Child Cards if Expanded
      if (isExpanded) {
        const cardLayouts = sideLayout.branchCardLayouts[branchDef.key] || [];
        const childGroup = document.createElementNS(svgNS, 'g');
        childGroup.setAttribute('class', 'mm-child-group');
        childGroup.setAttribute('data-parent-branch', branchDef.key);

        const branchOuterX = isRight ? (pos.x + NODE_W / 2) : (pos.x - NODE_W / 2);

        cardLayouts.forEach((c) => {
          const item = c.item;

          // Branch to Card connecting line
          const cardEdgeX = isRight ? (c.x - c.w / 2) : (c.x + c.w / 2);
          const childLine = createCurvedPath(svgNS, branchOuterX, pos.y, cardEdgeX, c.y, branchDef.color, '1.8');
          childLine.setAttribute('stroke-dasharray', '5 3');
          childLine.setAttribute('opacity', '0.5');
          linesGroup.appendChild(childLine);

          // Card Node
          const cardGroup = document.createElementNS(svgNS, 'g');
          cardGroup.setAttribute('class', 'mm-child-node');
          cardGroup.style.cursor = 'pointer';

          // Card Background
          const cardBg = createRoundedRect(
            svgNS,
            c.x - c.w / 2, c.y - c.h / 2,
            c.w, c.h, 12,
            'var(--bg-card)',
            branchDef.color + '55',
            'mm-child-bg'
          );
          cardBg.setAttribute('filter', 'url(#mm-shadow)');
          cardGroup.appendChild(cardBg);

          // Header Row: Badge + Tag
          const badgeX = c.x - c.w / 2 + 18;
          const badgeY = c.y - c.h / 2 + 16;

          const numCircle = document.createElementNS(svgNS, 'circle');
          numCircle.setAttribute('cx', badgeX);
          numCircle.setAttribute('cy', badgeY);
          numCircle.setAttribute('r', '8.5');
          numCircle.setAttribute('fill', branchDef.color);
          cardGroup.appendChild(numCircle);

          const numText = createSvgText(svgNS, badgeX, badgeY, String(c.idx + 1), '8.5', '#ffffff', '700');
          cardGroup.appendChild(numText);

          const tagText = createSvgText(
            svgNS,
            c.x - c.w / 2 + 32, badgeY,
            (item.tag || 'Ý chính').toUpperCase(), '8.5', branchDef.color, '700', 'start'
          );
          cardGroup.appendChild(tagText);

          // One-click quick copy hint at top-right
          const copyHint = createSvgText(
            svgNS,
            c.x + c.w / 2 - 14, badgeY,
            '📋 Sao chép', '8.5', 'var(--text-tertiary)', '500', 'end'
          );
          copyHint.style.cursor = 'pointer';
          copyHint.addEventListener('click', (e) => {
            e.stopPropagation();
            MindMap.copyCardItem(item);
          });
          cardGroup.appendChild(copyHint);

          // Heading (wrap at 38 chars, up to 2 lines)
          const hLines = wrapText(item.heading, 38).slice(0, 2);
          let headY = c.y - c.h / 2 + 31;
          hLines.forEach((hline, hidx) => {
            const hEl = createSvgText(
              svgNS,
              c.x - c.w / 2 + 14, headY + hidx * 15,
              hline, '11.5', 'var(--text-primary)', '700', 'start'
            );
            cardGroup.appendChild(hEl);
          });

          // Summary Text (Directly visible! wrap at 44 chars, up to 4 lines)
          const sLines = wrapText(item.summary, 44).slice(0, 4);
          let sumStartY = headY + (hLines.length - 1) * 15 + 17;
          sLines.forEach((sline, sidx) => {
            const sEl = createSvgText(
              svgNS,
              c.x - c.w / 2 + 14, sumStartY + sidx * 15,
              sline, '10.5', 'var(--text-secondary)', '400', 'start'
            );
            cardGroup.appendChild(sEl);
          });

          let currentBlockY = sumStartY + (sLines.length - 1) * 15 + 17;

          // Evidence Quote Box (directly on card)
          if (item.evidence) {
            const evEl = createSvgText(
              svgNS,
              c.x - c.w / 2 + 14, currentBlockY,
              truncate(item.evidence.startsWith('«') ? item.evidence : `«${item.evidence}»`, 42),
              '9.5', branchDef.color, '600', 'start'
            );
            evEl.setAttribute('font-style', 'italic');
            cardGroup.appendChild(evEl);
            currentBlockY += 19;
          }

          // 9+ Commentary Pill (directly on card)
          if (item.commentary) {
            const commEl = createSvgText(
              svgNS,
              c.x - c.w / 2 + 14, currentBlockY,
              truncate(`✨ [9+]: ${item.commentary}`, 42),
              '9.5', '#D97706', '600', 'start'
            );
            cardGroup.appendChild(commEl);
          }

          // Click on card: opens full reading modal & copies
          cardGroup.addEventListener('click', (e) => {
            e.stopPropagation();
            MindMap.openDetailModal(item, branchDef);
          });

          // Hover
          cardGroup.addEventListener('mouseenter', () => {
            cardBg.setAttribute('stroke', branchDef.color);
            cardBg.setAttribute('stroke-width', '2');
            cardBg.setAttribute('filter', 'url(#mm-glow)');
            childLine.setAttribute('opacity', '1');
            childLine.setAttribute('stroke-width', '2.5');
          });
          cardGroup.addEventListener('mouseleave', () => {
            cardBg.setAttribute('stroke', branchDef.color + '55');
            cardBg.setAttribute('stroke-width', '1.5');
            cardBg.setAttribute('filter', 'url(#mm-shadow)');
            childLine.setAttribute('opacity', '0.5');
            childLine.setAttribute('stroke-width', '1.8');
          });

          childGroup.appendChild(cardGroup);
        });

        nodesGroup.appendChild(childGroup);
      }
    });

    svg.appendChild(linesGroup);
    svg.appendChild(nodesGroup);

    // ── Center Node (Work Title & Genre) ──
    const centerGroup = document.createElementNS(svgNS, 'g');
    centerGroup.setAttribute('class', 'mm-center-node');

    const glowCircle = document.createElementNS(svgNS, 'circle');
    glowCircle.setAttribute('cx', 0);
    glowCircle.setAttribute('cy', 0);
    glowCircle.setAttribute('r', '78');
    glowCircle.setAttribute('fill', genreColor.glow);
    glowCircle.setAttribute('class', 'mm-center-glow');
    centerGroup.appendChild(glowCircle);

    const centerCircle = document.createElementNS(svgNS, 'circle');
    centerCircle.setAttribute('cx', 0);
    centerCircle.setAttribute('cy', 0);
    centerCircle.setAttribute('r', '62');
    centerCircle.setAttribute('fill', genreColor.primary);
    centerCircle.setAttribute('filter', 'url(#mm-shadow)');
    centerCircle.setAttribute('class', 'mm-center-circle');
    centerGroup.appendChild(centerCircle);

    const ring = document.createElementNS(svgNS, 'circle');
    ring.setAttribute('cx', 0);
    ring.setAttribute('cy', 0);
    ring.setAttribute('r', '68');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', genreColor.secondary);
    ring.setAttribute('stroke-width', '2');
    ring.setAttribute('stroke-dasharray', '8 4');
    ring.setAttribute('class', 'mm-center-ring');
    centerGroup.appendChild(ring);

    // Title text wrapped
    const titleLines = wrapText(mapData.center.title, 14);
    titleLines.forEach((line, i) => {
      const offsetY = 0 - ((titleLines.length - 1) * 9) + i * 18 - 6;
      const titleText = createSvgText(svgNS, 0, offsetY, line, '13', '#FFFFFF', '800');
      centerGroup.appendChild(titleText);
    });

    const authorLabel = createSvgText(svgNS, 0, 0 + ((titleLines.length - 1) * 9) + 16, mapData.center.author, '10', genreColor.secondary, '600');
    centerGroup.appendChild(authorLabel);

    const genreBadge = createSvgText(svgNS, 0, 42, mapData.center.genre, '9', genreColor.secondary, '700');
    centerGroup.appendChild(genreBadge);

    svg.appendChild(centerGroup);

    // Inject SVG into container
    container.appendChild(svg);

    // Enable pan & zoom
    setupPanZoom(svg);
  }

  // ── Render Knowledge Tree Outline Board (Direct Full Visibility) ──
  function renderMindMapOutline(work, container) {
    container.innerHTML = '';

    if (!work) {
      container.innerHTML = '<div class="mm-empty-state"><i data-lucide="layout-grid" style="width:48px;height:48px;color:var(--text-tertiary);margin-bottom:12px;"></i><p>Chọn một tác phẩm để hiện Bảng tri thức chi tiết</p></div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const mapData = extractMindMapData(work);
    if (!mapData) return;

    const genreColor = getGenreColor(work.genre);
    const query = (mmState.outlineSearchQuery || '').toLowerCase().trim();

    // Outline Header & Search Bar
    const headerHtml = `
      <div class="mm-outline-header mb-4 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3" style="background: var(--bg-card); border: 1px solid var(--border);">
        <div class="flex items-center gap-3">
          <div style="width: 14px; height: 14px; border-radius: 50%; background: ${genreColor.primary};"></div>
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">
              ${work.title} – ${work.author}
            </h3>
            <span style="font-size: 12px; color: var(--text-secondary);">${work.genre} · Đầy đủ 6 nhánh tri thức trọng tâm chuẩn 9+</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative" style="min-width: 240px;">
            <input type="text" id="mm-outline-search" class="home-search-input" style="height: 36px; padding: 0 10px 0 32px; font-size: 12.5px; width: 100%;" placeholder="Tìm kiếm nhanh trong tác phẩm..." value="${mmState.outlineSearchQuery || ''}">
            <i data-lucide="search" style="position: absolute; left: 10px; top: 10px; width: 15px; height: 15px; color: var(--text-tertiary);"></i>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="MindMap.copyAllWorkContent()" title="Sao chép toàn bộ kiến thức tác phẩm này">
            <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
            <span>Sao chép tất cả</span>
          </button>
        </div>
      </div>
    `;

    // 6 Branches Grid
    let gridHtml = '<div class="mm-outline-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.25rem;">';

    BRANCH_DEFS.forEach((bDef) => {
      const bData = mapData.branches[bDef.key];
      if (!bData) return;

      let items = bData.items || [];
      if (query) {
        items = items.filter(it =>
          (it.heading && it.heading.toLowerCase().includes(query)) ||
          (it.summary && it.summary.toLowerCase().includes(query)) ||
          (it.fullText && it.fullText.toLowerCase().includes(query)) ||
          (it.evidence && it.evidence.toLowerCase().includes(query)) ||
          (it.tag && it.tag.toLowerCase().includes(query))
        );
      }

      gridHtml += `
        <div class="mm-outline-branch-col card card-flat p-4" style="background: var(--bg-card); border: 1px solid var(--border); border-top: 3.5px solid ${bDef.color}; border-radius: var(--radius-lg); display: flex; flex-direction: column;">
          <!-- Branch Title -->
          <div class="flex items-center justify-between pb-3 mb-3" style="border-bottom: 1px solid var(--border);">
            <div class="flex items-center gap-2">
              <span style="font-size: 1.2rem;">${bDef.icon}</span>
              <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-primary); margin: 0;">${bDef.label}</h4>
            </div>
            <span class="badge" style="background: ${bDef.color}1A; color: ${bDef.color}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px;">
              ${items.length} mục
            </span>
          </div>

          <!-- Cards Stack -->
          <div class="flex flex-col gap-3.5 flex-1">
            ${items.length === 0 ? '<div style="font-size: 12.5px; color: var(--text-tertiary); text-align: center; padding: 20px 0;">Không có kết quả khớp với tìm kiếm</div>' : ''}
            ${items.map((it, idx) => `
              <div class="mm-outline-item-card p-3.5 rounded-xl transition-all" style="background: var(--bg-tertiary); border: 1px solid var(--border); position: relative;">
                <!-- Tag & Copy -->
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div class="flex items-center gap-1.5">
                    <span style="width: 18px; height: 18px; border-radius: 50%; background: ${bDef.color}; color: #fff; font-size: 10px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center;">${idx + 1}</span>
                    <span style="font-size: 10px; font-weight: 800; color: ${bDef.color}; text-transform: uppercase; letter-spacing: 0.5px;">${it.tag || 'Ý chính'}</span>
                  </div>
                  <button class="icon-btn" onclick="MindMap.copyCardItemByIdx('${bDef.key}', ${idx})" title="Sao chép nội dung này" style="width: 26px; height: 26px; border-radius: 6px;">
                    <i data-lucide="copy" style="width: 13px; height: 13px;"></i>
                  </button>
                </div>

                <!-- Heading -->
                <h5 style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; line-height: 1.4;">${it.heading}</h5>

                <!-- Full direct text -->
                <p style="font-size: 13px; line-height: 1.65; color: var(--text-secondary); margin-bottom: 8px; white-space: pre-line;">${it.fullText || it.summary}</p>

                <!-- Evidence Box -->
                ${it.evidence ? `
                  <div class="p-2.5 rounded-lg mb-2" style="background: var(--bg-card); border-left: 3px solid ${bDef.color}; font-size: 12px; font-style: italic; color: var(--text-primary); line-height: 1.5;">
                    <span style="font-weight: 700; font-style: normal; color: ${bDef.color}; margin-right: 4px;">Dẫn chứng:</span>${it.evidence}
                  </div>
                ` : ''}

                <!-- Commentary 9+ -->
                ${it.commentary ? `
                  <div class="p-2.5 rounded-lg" style="background: rgba(217, 119, 6, 0.08); border: 1px dashed rgba(217, 119, 6, 0.35); font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                    <span style="font-weight: 700; color: #D97706; margin-right: 4px;">✨ Barem 9+:</span>${it.commentary}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    gridHtml += '</div>';

    container.innerHTML = headerHtml + gridHtml;

    // Search input listener
    const searchInput = document.getElementById('mm-outline-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        mmState.outlineSearchQuery = e.target.value;
        renderMindMapOutline(work, container);
        const newSearch = document.getElementById('mm-outline-search');
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      });
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ── Toggle Single Branch Expansion ──
  function toggleBranch(branchKey) {
    if (mmState.expandedNodes.has(branchKey)) {
      mmState.expandedNodes.delete(branchKey);
    } else {
      mmState.expandedNodes.add(branchKey);
    }

    // Auto fit view box
    if (mmState.expandedNodes.size > 0) {
      mmState.viewBox = { ...mmState.expandedViewBox };
    } else {
      mmState.viewBox = { ...mmState.defaultViewBox };
    }
    mmState.zoomLevel = 1;

    const work = getWork(mmState.selectedWorkId);
    const canvasContainer = document.getElementById('mm-svg-container');
    if (canvasContainer) renderMindMapCanvas(work, canvasContainer);

    const zoomDisplay = document.getElementById('mm-zoom-level');
    if (zoomDisplay) zoomDisplay.textContent = '100%';
  }

  // ── Pan & Zoom Engine ──
  function setupPanZoom(svg) {
    let isPanning = false;
    let startPoint = { x: 0, y: 0 };
    let startViewBox = null;

    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const vb = mmState.viewBox;

      const zoomFactor = e.deltaY > 0 ? 1.12 : 0.88;
      const newW = vb.w * zoomFactor;
      const newH = vb.h * zoomFactor;

      if (newW < 450 || newW > 4500) return;

      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;

      vb.x = vb.x + (vb.w - newW) * mx;
      vb.y = vb.y + (vb.h - newH) * my;
      vb.w = newW;
      vb.h = newH;

      mmState.zoomLevel = mmState.expandedNodes.size > 0 ? (2200 / newW) : (1300 / newW);
      svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);

      const zoomDisplay = document.getElementById('mm-zoom-level');
      if (zoomDisplay) zoomDisplay.textContent = Math.round(mmState.zoomLevel * 100) + '%';
    }, { passive: false });

    svg.addEventListener('mousedown', (e) => {
      if (e.target.closest('.mm-branch-node') || e.target.closest('.mm-child-node') || e.target.closest('.mm-center-node')) return;
      isPanning = true;
      svg.style.cursor = 'grabbing';
      startPoint = { x: e.clientX, y: e.clientY };
      startViewBox = { ...mmState.viewBox };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPanning || !startViewBox) return;
      const rect = svg.getBoundingClientRect();
      const dx = (e.clientX - startPoint.x) / rect.width * mmState.viewBox.w;
      const dy = (e.clientY - startPoint.y) / rect.height * mmState.viewBox.h;
      mmState.viewBox.x = startViewBox.x - dx;
      mmState.viewBox.y = startViewBox.y - dy;
      svg.setAttribute('viewBox', `${mmState.viewBox.x} ${mmState.viewBox.y} ${mmState.viewBox.w} ${mmState.viewBox.h}`);
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
      svg.style.cursor = 'grab';
      startViewBox = null;
    });

    // Touch Pinch & Pan
    let lastTouchDist = 0;
    svg.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isPanning = true;
        startPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        startViewBox = { ...mmState.viewBox };
      } else if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    svg.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isPanning && startViewBox) {
        const rect = svg.getBoundingClientRect();
        const dx = (e.touches[0].clientX - startPoint.x) / rect.width * mmState.viewBox.w;
        const dy = (e.touches[0].clientY - startPoint.y) / rect.height * mmState.viewBox.h;
        mmState.viewBox.x = startViewBox.x - dx;
        mmState.viewBox.y = startViewBox.y - dy;
        svg.setAttribute('viewBox', `${mmState.viewBox.x} ${mmState.viewBox.y} ${mmState.viewBox.w} ${mmState.viewBox.h}`);
      } else if (e.touches.length === 2 && lastTouchDist > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const zoomFactor = lastTouchDist / dist;
        const vb = mmState.viewBox;
        const newW = vb.w * zoomFactor;
        const newH = vb.h * zoomFactor;
        if (newW >= 450 && newW <= 4500) {
          vb.x += (vb.w - newW) / 2;
          vb.y += (vb.h - newH) / 2;
          vb.w = newW;
          vb.h = newH;
          mmState.zoomLevel = mmState.expandedNodes.size > 0 ? (2200 / newW) : (1300 / newW);
          svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
          const zoomDisplay = document.getElementById('mm-zoom-level');
          if (zoomDisplay) zoomDisplay.textContent = Math.round(mmState.zoomLevel * 100) + '%';
        }
        lastTouchDist = dist;
      }
    }, { passive: true });

    svg.addEventListener('touchend', () => {
      isPanning = false;
      startViewBox = null;
      lastTouchDist = 0;
    }, { passive: true });
  }

  // ── Public MindMap API ──
  window.MindMap = {
    state: mmState,

    render(workId) {
      if (workId) mmState.selectedWorkId = parseInt(workId, 10);
      if (!mmState.selectedWorkId && window.APP_DATA && APP_DATA.works && APP_DATA.works[0]) {
        mmState.selectedWorkId = APP_DATA.works[0].id;
      }

      const work = getWork(mmState.selectedWorkId);
      const canvasContainer = document.getElementById('mm-svg-container');
      const outlineContainer = document.getElementById('mm-outline-container');

      // Sync dropdown
      const sel = document.getElementById('mm-work-selector');
      if (sel) sel.value = mmState.selectedWorkId;

      const canvasWrapper = document.getElementById('mm-canvas-wrapper') || (canvasContainer ? canvasContainer.parentElement : null);
      const canvasActions = document.getElementById('mm-canvas-actions');

      if (mmState.viewMode === 'canvas') {
        if (canvasWrapper && canvasWrapper.classList) canvasWrapper.classList.remove('hidden');
        if (canvasActions && canvasActions.classList) canvasActions.classList.remove('hidden');
        if (canvasContainer) renderMindMapCanvas(work, canvasContainer);
        if (outlineContainer && outlineContainer.classList) outlineContainer.classList.add('hidden');
      } else {
        if (canvasWrapper && canvasWrapper.classList) canvasWrapper.classList.add('hidden');
        if (canvasActions && canvasActions.classList) canvasActions.classList.add('hidden');
        if (outlineContainer) {
          if (outlineContainer.classList) outlineContainer.classList.remove('hidden');
          renderMindMapOutline(work, outlineContainer);
        }
      }

      this.updateViewModeButtons();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    setViewMode(mode) {
      mmState.viewMode = mode;
      this.render(mmState.selectedWorkId);
    },

    updateViewModeButtons() {
      const btnCanvas = document.getElementById('mm-tab-canvas');
      const btnOutline = document.getElementById('mm-tab-outline');
      if (btnCanvas && btnOutline) {
        if (mmState.viewMode === 'canvas') {
          btnCanvas.classList.add('active');
          btnOutline.classList.remove('active');
        } else {
          btnOutline.classList.add('active');
          btnCanvas.classList.remove('active');
        }
      }
    },

    expandAll() {
      BRANCH_DEFS.forEach(b => mmState.expandedNodes.add(b.key));
      mmState.viewBox = { ...mmState.expandedViewBox };
      mmState.zoomLevel = 1;
      const zoomDisplay = document.getElementById('mm-zoom-level');
      if (zoomDisplay) zoomDisplay.textContent = '100%';
      this.render(mmState.selectedWorkId);
    },

    collapseAll() {
      mmState.expandedNodes.clear();
      mmState.viewBox = { ...mmState.defaultViewBox };
      mmState.zoomLevel = 1;
      const zoomDisplay = document.getElementById('mm-zoom-level');
      if (zoomDisplay) zoomDisplay.textContent = '100%';
      this.render(mmState.selectedWorkId);
    },

    resetView() {
      mmState.viewBox = mmState.expandedNodes.size > 0 ? { ...mmState.expandedViewBox } : { ...mmState.defaultViewBox };
      mmState.zoomLevel = 1;
      const zoomDisplay = document.getElementById('mm-zoom-level');
      if (zoomDisplay) zoomDisplay.textContent = '100%';
      const svg = document.getElementById('mm-svg-canvas');
      if (svg) svg.setAttribute('viewBox', `${mmState.viewBox.x} ${mmState.viewBox.y} ${mmState.viewBox.w} ${mmState.viewBox.h}`);
    },

    zoomIn() {
      const vb = mmState.viewBox;
      const newW = vb.w * 0.85;
      const newH = vb.h * 0.85;
      if (newW < 450) return;
      vb.x += (vb.w - newW) / 2;
      vb.y += (vb.h - newH) / 2;
      vb.w = newW;
      vb.h = newH;
      mmState.zoomLevel = mmState.expandedNodes.size > 0 ? (2200 / newW) : (1300 / newW);
      const svg = document.getElementById('mm-svg-canvas');
      if (svg) svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      const zoomDisplay = document.getElementById('mm-zoom-level');
      if (zoomDisplay) zoomDisplay.textContent = Math.round(mmState.zoomLevel * 100) + '%';
    },

    zoomOut() {
      const vb = mmState.viewBox;
      const newW = vb.w * 1.15;
      const newH = vb.h * 1.15;
      if (newW > 4500) return;
      vb.x += (vb.w - newW) / 2;
      vb.y += (vb.h - newH) / 2;
      vb.w = newW;
      vb.h = newH;
      mmState.zoomLevel = mmState.expandedNodes.size > 0 ? (2200 / newW) : (1300 / newW);
      const svg = document.getElementById('mm-svg-canvas');
      if (svg) svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      const zoomDisplay = document.getElementById('mm-zoom-level');
      if (zoomDisplay) zoomDisplay.textContent = Math.round(mmState.zoomLevel * 100) + '%';
    },

    // ── Copy Helpers ──
    copyCardItem(item) {
      if (!item) return;
      const textToCopy = `【${item.heading}】 (${item.tag || 'Kiến thức cốt lõi'})\n${item.fullText || item.summary}${item.evidence ? '\n\n«Dẫn chứng then chốt»: ' + item.evidence : ''}${item.commentary ? '\n\n«Lời bình văn học 9+»: ' + item.commentary : ''}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          if (window.app && window.app.showToast) {
            window.app.showToast(`Đã sao chép: "${item.heading}"!`, 'success');
          }
        }).catch(() => {
          if (window.app && window.app.showToast) window.app.showToast('Sao chép thất bại', 'warning');
        });
      }
    },

    copyCardItemByIdx(branchKey, idx) {
      const work = getWork(mmState.selectedWorkId);
      if (!work) return;
      const mapData = extractMindMapData(work);
      if (mapData && mapData.branches[branchKey] && mapData.branches[branchKey].items[idx]) {
        this.copyCardItem(mapData.branches[branchKey].items[idx]);
      }
    },

    copyAllWorkContent() {
      const work = getWork(mmState.selectedWorkId);
      if (!work) return;
      const mapData = extractMindMapData(work);
      if (!mapData) return;

      let allText = `========================================================\nBẢN ĐỒ TƯ DUY TOÀN DIỆN 9+: ${work.title} – ${work.author}\nThể loại: ${work.genre}\n========================================================\n\n`;

      BRANCH_DEFS.forEach(bDef => {
        const bData = mapData.branches[bDef.key];
        if (!bData || !bData.items) return;
        allText += `### ${bDef.icon} ${bDef.label.toUpperCase()}\n`;
        bData.items.forEach((it, i) => {
          allText += `\n${i + 1}. [${it.tag}] ${it.heading}\n- Phân tích: ${it.fullText || it.summary}\n`;
          if (it.evidence) allText += `- Dẫn chứng: ${it.evidence}\n`;
          if (it.commentary) allText += `- Barem 9+: ${it.commentary}\n`;
        });
        allText += '\n--------------------------------------------------------\n\n';
      });

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(allText).then(() => {
          if (window.app && window.app.showToast) {
            window.app.showToast(`Đã sao chép toàn bộ kiến thức 6 nhánh của "${work.title}"!`, 'success');
          }
        });
      }
    },

    // ── Interactive Detail Modal ──
    _activeModalCard: null,

    openDetailModal(item, branchDef) {
      const modal = document.getElementById('mm-detail-modal');
      if (!modal) return;

      const tagEl = document.getElementById('mm-modal-tag');
      const branchEl = document.getElementById('mm-modal-branch');
      const headingEl = document.getElementById('mm-modal-heading');
      const bodyEl = document.getElementById('mm-modal-body');
      const evBox = document.getElementById('mm-modal-evidence-box');
      const evText = document.getElementById('mm-modal-evidence-text');
      const commBox = document.getElementById('mm-modal-commentary-box');
      const commText = document.getElementById('mm-modal-commentary-text');

      if (tagEl) {
        tagEl.textContent = item.tag || 'Kiến thức cốt lõi';
        tagEl.style.background = branchDef.color || 'var(--accent)';
      }
      if (branchEl) {
        branchEl.textContent = branchDef.label || '';
        branchEl.style.color = branchDef.color || '';
      }
      if (headingEl) headingEl.textContent = item.heading || '';
      if (bodyEl) {
        bodyEl.textContent = item.fullText || item.summary || '';
      }

      if (evBox && evText) {
        if (item.evidence) {
          evText.textContent = item.evidence;
          evBox.classList.remove('hidden');
          evBox.style.borderLeftColor = branchDef.color || 'var(--accent)';
        } else {
          evBox.classList.add('hidden');
        }
      }

      if (commBox && commText) {
        if (item.commentary) {
          commText.textContent = item.commentary;
          commBox.classList.remove('hidden');
        } else {
          commBox.classList.add('hidden');
        }
      }

      this._activeModalCard = item;
      modal.classList.add('active');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    closeDetailModal() {
      const modal = document.getElementById('mm-detail-modal');
      if (modal) modal.classList.remove('active');
    },

    copyModalContent() {
      if (this._activeModalCard) {
        this.copyCardItem(this._activeModalCard);
      }
    },

    // ── Export SVG ──
    exportSvg() {
      const svg = document.getElementById('mm-svg-canvas');
      if (!svg) {
        if (window.app && window.app.showToast) window.app.showToast('Vui lòng chọn tác phẩm trước khi tải ảnh', 'warning');
        return;
      }
      const work = getWork(mmState.selectedWorkId);
      const title = work ? work.title.replace(/[\/\\:*?"<>|]/g, '_') : 'so_do_tu_duy';

      const clone = svg.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleEl.textContent = `
        text { font-family: 'Be Vietnam Pro', 'Inter', -apple-system, sans-serif; }
        .mm-node-bg { transition: none; }
        .mm-child-bg { fill: #ffffff; }
      `;
      clone.insertBefore(styleEl, clone.firstChild);

      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `MindMap_${title}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);

      if (window.app && window.app.showToast) {
        window.app.showToast(`Đã tải xuống Sơ đồ tư duy: ${work ? work.title : ''} (SVG sắc nét)`, 'success');
      }
    },

    // ── Fullscreen Toggle ──
    toggleFullscreen() {
      const container = document.getElementById('mm-svg-container');
      if (!container) return;
      const btn = document.getElementById('mm-fullscreen-btn');

      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        }
        if (btn) btn.innerHTML = '<i data-lucide="shrink" style="width: 14px; height: 14px;"></i><span>Thu nhỏ</span>';
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        if (btn) btn.innerHTML = '<i data-lucide="expand" style="width: 14px; height: 14px;"></i><span>Toàn màn hình</span>';
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  };

  // Listen to fullscreen changes to update button icon
  document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('mm-fullscreen-btn');
    if (!btn) return;
    if (document.fullscreenElement) {
      btn.innerHTML = '<i data-lucide="shrink" style="width: 14px; height: 14px;"></i><span>Thu nhỏ</span>';
    } else {
      btn.innerHTML = '<i data-lucide="expand" style="width: 14px; height: 14px;"></i><span>Toàn màn hình</span>';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // Listen to Escape key to close detail modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.MindMap && window.MindMap.closeDetailModal) {
      window.MindMap.closeDetailModal();
    }
  });

})();
