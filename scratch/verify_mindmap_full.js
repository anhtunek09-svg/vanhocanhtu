const fs = require('fs');
const vm = require('vm');

// Setup mock browser environment
const dom = {
  elements: {},
  createElementNS(ns, tag) {
    const el = {
      ns,
      tag,
      attributes: {},
      style: {},
      children: [],
      classList: new Set(),
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k]; },
      appendChild(child) {
        this.children.push(child);
        child.parentElement = this;
      },
      insertBefore(child, before) {
        const idx = this.children.indexOf(before);
        if (idx !== -1) this.children.splice(idx, 0, child);
        else this.children.push(child);
        child.parentElement = this;
      },
      remove() {
        if (this.parentElement) {
          const idx = this.parentElement.children.indexOf(this);
          if (idx !== -1) this.parentElement.children.splice(idx, 1);
        }
      },
      querySelectorAll(selector) {
        const res = [];
        function walk(node) {
          if (!node || !node.children) return;
          for (const c of node.children) {
            if (selector.startsWith('.') && c.attributes && c.attributes.class && c.attributes.class.includes(selector.slice(1))) {
              res.push(c);
            } else if (selector.startsWith('[') && selector.endsWith(']')) {
              const attrName = selector.slice(1, -1).split('=')[0];
              if (c.attributes && c.attributes[attrName] !== undefined) res.push(c);
            }
            walk(c);
          }
        }
        walk(this);
        return res;
      },
      querySelector(selector) {
        const list = this.querySelectorAll(selector);
        return list[0] || null;
      },
      addEventListener(evt, fn) { this[evt + 'Handler'] = fn; }
    };
    let _html = '';
    Object.defineProperty(el, 'innerHTML', {
      get() { return _html; },
      set(val) {
        _html = val;
        if (val === '') el.children = [];
      }
    });
    const set = new Set();
    el.classList = {
      add: (c) => set.add(c),
      remove: (c) => set.delete(c),
      contains: (c) => set.has(c)
    };
    return el;
  },
  createElement(tag) {
    const el = this.createElementNS(null, tag);
    el.innerHTML = '';
    return el;
  },
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = this.createElement('div');
      this.elements[id].id = id;
    }
    return this.elements[id];
  },
  addEventListener(evt, fn) {}
};

const context = {
  window: {
    APP_DATA: null,
    MindMap: null,
    app: { showToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`) },
    location: { hash: '' },
    document: dom,
    addEventListener(evt, fn) {}
  },
  document: dom,
  navigator: {
    clipboard: {
      writeText: async (t) => console.log('[Clipboard writeText length]:', t.length)
    }
  },
  requestAnimationFrame: (fn) => fn(),
  setTimeout: (fn) => fn(),
  console
};

vm.createContext(context);

// Load data.js
console.log('1. Loading js/data.js...');
const dataCode = fs.readFileSync('js/data.js', 'utf8');
vm.runInContext(dataCode, context);
console.log('   Loaded works:', context.window.APP_DATA.works.length);

// Load mindmap.js
console.log('2. Loading js/mindmap.js...');
const mmCode = fs.readFileSync('js/mindmap.js', 'utf8');
vm.runInContext(mmCode, context);
console.log('   MindMap initialized:', !!context.window.MindMap);

// Test MindMap.render for all 18 works in Canvas mode
console.log('3. Testing MindMap.render (Canvas mode) across all 18 works...');
const MindMap = context.window.MindMap;

context.window.APP_DATA.works.forEach((w) => {
  MindMap.render(w.id);
  const svg = dom.getElementById('mm-svg-container').children.find(c => c.tag === 'svg');
  if (!svg) {
    throw new Error(`Failed to render SVG for Work ${w.id} (${w.title})`);
  }
  const viewBox = svg.getAttribute('viewBox');
  if (!viewBox) throw new Error(`Missing viewBox on Work ${w.id}`);
});
console.log('   PASSED: All 18 works rendered SVG canvas cleanly!');

// Test Expand All on Work 11 (Tây Tiến)
console.log('4. Testing MindMap.expandAll() on Work 11 (Tây Tiến)...');
MindMap.render(11);
MindMap.expandAll();
const svg11 = dom.getElementById('mm-svg-container').children.find(c => c.tag === 'svg');
const childNodes = svg11.querySelectorAll('.mm-child-node');
console.log('   Total expanded child cards in Work 11:', childNodes.length);
if (childNodes.length < 15) {
  throw new Error(`Expected at least 15 child cards when expanded, got ${childNodes.length}`);
}
console.log('   PASSED: Work 11 expanded with all direct knowledge cards!');

// Test Outline Mode for all 18 works
console.log('5. Testing MindMap Outline Board Mode across all 18 works...');
MindMap.setViewMode('outline');
context.window.APP_DATA.works.forEach((w) => {
  MindMap.render(w.id);
  const outlineContainer = dom.getElementById('mm-outline-container');
  if (!outlineContainer.innerHTML || !outlineContainer.innerHTML.includes(w.title)) {
    throw new Error(`Outline failed for Work ${w.id} (${w.title})`);
  }
});
console.log('   PASSED: All 18 works rendered Knowledge Tree Outline Board cleanly!');

// Test Copy Work Content
console.log('6. Testing copyAllWorkContent...');
MindMap.copyAllWorkContent();
console.log('   PASSED: copyAllWorkContent executed successfully!');

console.log('========================================================');
console.log('ALL MIND MAP ENGINE TESTS PASSED 100%!');
console.log('========================================================');
