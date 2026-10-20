const fs = require('fs');
const vm = require('vm');

const dataCode = fs.readFileSync('js/data.js', 'utf8');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(dataCode, ctx);
const works = ctx.window.APP_DATA.works;

function wrapText(text, maxLen) {
  if (!text) return [''];
  const words = text.split(/\s+/);
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
  return str.length > max ? str.substring(0, max) + '…' : str;
}

function extractMindMapData(work) {
  if (!work) return null;
  const pInfo = work.authorPortraitInfo || {};
  const spec = work.expressionSpec || {};
  const data = {
    center: { title: work.title, author: work.author, genre: work.genre },
    branches: {}
  };

  // Branch 1: context
  data.branches.context = {
    key: 'context',
    label: 'Hoàn cảnh & Xuất xứ',
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

  // Branch 2: author
  data.branches.author = {
    key: 'author',
    label: 'Tác giả & Phong cách',
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

  // Branch 3: evidence
  const evidenceItems = [];
  (work.quotes || []).slice(0, 3).forEach((q, idx) => {
    evidenceItems.push({
      tag: `Dẫn chứng ${idx + 1}`,
      heading: `Dẫn chứng then chốt #${idx + 1}`,
      summary: `«${q}»`,
      evidence: `Văn bản: ${work.title}`,
      fullText: `Dẫn chứng then chốt: «${q}».\nChi tiết đắt giá làm điểm tựa phân tích và chứng minh luận điểm khi triển khai bài viết đạt chuẩn 9+.`
    });
  });
  (work.scholarlyQuotes || []).slice(0, 2).forEach((sq, idx) => {
    evidenceItems.push({
      tag: 'Lý luận 9+',
      heading: `Nhận định: ${sq.critic}`,
      summary: `«${sq.quote}»`,
      evidence: `Nhà phê bình: ${sq.critic}`,
      commentary: `Vận dụng nhận định của ${sq.critic} vào phần đánh giá nâng cao, mở bài hoặc kết bài để bài văn đạt barem điểm 9+.`,
      fullText: `Nhận định của ${sq.critic}:\n«${sq.quote}»`
    });
  });
  data.branches.evidence = {
    key: 'evidence',
    label: 'Dẫn chứng & Lý luận',
    items: evidenceItems
  };

  // Branch 4: themes
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
    label: 'Chủ đề & Tư tưởng',
    items: themeItems
  };

  // Branch 5: content
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
    label: 'Nội dung phân tích',
    items: contentItems
  };

  // Branch 6: art
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
      fullText: `Giọng điệu: ${spec.dominantTone}\nPhong cách: ${spec.languageStyle || ''}\nKết cấu: ${spec.formAndStructure || ''}`
    });
  }
  data.branches.art = {
    key: 'art',
    label: 'Nghệ thuật đặc sắc',
    items: artItems
  };

  return data;
}

// Layout Calculation & Collision Check
const BRANCH_DEFS = [
  { key: 'context',  side: 'left',  posRole: 'top',    color: '#D97706' },
  { key: 'author',   side: 'left',  posRole: 'center', color: '#2563EB' },
  { key: 'evidence', side: 'left',  posRole: 'bottom', color: '#16364A' },
  { key: 'themes',   side: 'right', posRole: 'top',    color: '#059669' },
  { key: 'content',  side: 'right', posRole: 'center', color: '#B65335' },
  { key: 'art',      side: 'right', posRole: 'bottom', color: '#7C3AED' }
];

const CARD_W = 340;
const GAP_Y = 16;
const SECTOR_GAP = 30;

function calculateCardHeight(item) {
  // Heading: wrap at 38 chars
  const hLines = wrapText(item.heading, 38).slice(0, 2);
  // Summary: wrap at 44 chars, show up to 4 lines
  const sLines = wrapText(item.summary, 44).slice(0, 4);
  const hasEv = !!item.evidence;
  const hasComm = !!item.commentary;
  let h = 28 + (hLines.length * 16) + (sLines.length * 15) + 12;
  if (hasEv) h += 22;
  if (hasComm) h += 24;
  return Math.max(88, h);
}

function computeSideLayout(sideBranches, mapData, side) {
  // sideBranches: [topDef, centerDef, bottomDef]
  const isRight = side === 'right';
  const childX = isRight ? 680 : -680;
  const branchX = isRight ? 320 : -320;

  // Compute cards for each branch
  const branchHeights = {};
  const branchCards = {};

  sideBranches.forEach(bDef => {
    const bData = mapData.branches[bDef.key];
    const items = bData ? bData.items || [] : [];
    const cards = items.map(it => ({
      item: it,
      h: calculateCardHeight(it)
    }));
    const totalH = cards.reduce((s, c) => s + c.h, 0) + Math.max(0, cards.length - 1) * GAP_Y;
    branchHeights[bDef.key] = totalH;
    branchCards[bDef.key] = cards;
  });

  const topDef = sideBranches.find(b => b.posRole === 'top');
  const midDef = sideBranches.find(b => b.posRole === 'center');
  const botDef = sideBranches.find(b => b.posRole === 'bottom');

  const hTop = branchHeights[topDef.key];
  const hMid = branchHeights[midDef.key];
  const hBot = branchHeights[botDef.key];

  // Middle center is at y = 0
  const startY_mid = -hMid / 2;
  const endY_mid = startY_mid + hMid;

  // Top sits strictly above middle with SECTOR_GAP
  const endY_top = Math.min(-140, startY_mid - SECTOR_GAP);
  const startY_top = endY_top - hTop;

  // Bottom sits strictly below middle with SECTOR_GAP
  const startY_bot = Math.max(140, endY_mid + SECTOR_GAP);
  const endY_bot = startY_bot + hBot;

  // Branch node Y positions (anchor to the center of their card block or default)
  const branchY = {
    [topDef.key]: Math.min(-240, startY_top + hTop / 2),
    [midDef.key]: 0,
    [botDef.key]: Math.max(240, startY_bot + hBot / 2)
  };

  // Place cards
  const placedRects = [];

  function placeBranchCards(bDef, startY) {
    let curY = startY;
    branchCards[bDef.key].forEach((c, idx) => {
      const rect = {
        branch: bDef.key,
        idx,
        x: isRight ? (childX - CARD_W / 2) : (childX - CARD_W / 2),
        y: curY,
        w: CARD_W,
        h: c.h
      };
      placedRects.push(rect);
      curY += c.h + GAP_Y;
    });
  }

  placeBranchCards(topDef, startY_top);
  placeBranchCards(midDef, startY_mid);
  placeBranchCards(botDef, startY_bot);

  return { placedRects, branchY, bounds: { minY: startY_top, maxY: endY_bot } };
}

// Test on all 18 works!
let totalOverlaps = 0;
let maxSpanY = 0;

works.forEach(w => {
  const mapData = extractMindMapData(w);
  const leftBranches = BRANCH_DEFS.filter(b => b.side === 'left');
  const rightBranches = BRANCH_DEFS.filter(b => b.side === 'right');

  const leftLayout = computeSideLayout(leftBranches, mapData, 'left');
  const rightLayout = computeSideLayout(rightBranches, mapData, 'right');

  // Check overlaps in left
  const leftRects = leftLayout.placedRects;
  for (let i = 0; i < leftRects.length; i++) {
    for (let j = i + 1; j < leftRects.length; j++) {
      const r1 = leftRects[i];
      const r2 = leftRects[j];
      const overlap = !(r1.y + r1.h <= r2.y || r2.y + r2.h <= r1.y);
      if (overlap) {
        console.error(`COLLISION in Work ${w.id} (${w.title}) LEFT: ${r1.branch}[${r1.idx}] and ${r2.branch}[${r2.idx}]!`);
        totalOverlaps++;
      }
    }
  }

  // Check overlaps in right
  const rightRects = rightLayout.placedRects;
  for (let i = 0; i < rightRects.length; i++) {
    for (let j = i + 1; j < rightRects.length; j++) {
      const r1 = rightRects[i];
      const r2 = rightRects[j];
      const overlap = !(r1.y + r1.h <= r2.y || r2.y + r2.h <= r1.y);
      if (overlap) {
        console.error(`COLLISION in Work ${w.id} (${w.title}) RIGHT: ${r1.branch}[${r1.idx}] and ${r2.branch}[${r2.idx}]!`);
        totalOverlaps++;
      }
    }
  }

  const workSpanY = Math.max(
    Math.abs(leftLayout.bounds.minY), Math.abs(leftLayout.bounds.maxY),
    Math.abs(rightLayout.bounds.minY), Math.abs(rightLayout.bounds.maxY)
  );
  if (workSpanY > maxSpanY) maxSpanY = workSpanY;
});

console.log('--------------------------------------------------');
console.log('TOTAL OVERLAPS ACROSS ALL 18 WORKS FULLY EXPANDED:', totalOverlaps);
console.log('MAX Y EXTENT (Half height):', maxSpanY);
console.log('RECOMMENDED VIEWBOX HEIGHT:', (maxSpanY * 2 + 100));
console.log('TEST RESULT:', totalOverlaps === 0 ? 'PASSED 100% COLLISION FREE!' : 'FAILED');
