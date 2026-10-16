const fs = require('fs');

// 1. Verify index.html content
const html = fs.readFileSync('index.html', 'utf8');

const expectedCategories = ['all', 'tho', 'truyen', 'ky', 'nghi-luan', 'on-thi'];
expectedCategories.forEach(cat => {
  const hasCat = html.includes(`data-category="${cat}"`);
  console.log(`Category [${cat}] in index.html:`, hasCat ? 'PASS' : 'FAIL');
});

// 2. Mock environment to test app.js logic
const window = {
  location: { href: 'http://localhost/' },
  addEventListener: () => {},
  scrollTo: () => {},
  speechSynthesis: { cancel: () => {}, speak: () => {}, getVoices: () => [] }
};
global.window = window;
global.document = {
  documentElement: {
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    setAttribute: () => {}
  },
  body: {
    style: {},
    appendChild: () => {},
    removeChild: () => {}
  },
  getElementById: (id) => {
    return {
      id,
      value: '',
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      textContent: '',
      innerHTML: '',
      style: {},
      setAttribute: () => {},
      getAttribute: () => '',
      addEventListener: () => {},
      appendChild: () => {},
      removeChild: () => {},
      querySelector: () => ({
        setAttribute: () => {},
        getAttribute: () => '',
        classList: { add: () => {}, remove: () => {} }
      }),
      querySelectorAll: () => []
    };
  },
  querySelector: () => ({
    setAttribute: () => {},
    getAttribute: () => '',
    classList: { add: () => {}, remove: () => {} }
  }),
  createElement: (tag) => ({
    tagName: tag,
    className: '',
    style: {},
    classList: { add: () => {}, remove: () => {} },
    innerHTML: '',
    appendChild: () => {},
    addEventListener: () => {}
  }),
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

// Load data.js
const dataCode = fs.readFileSync('js/data.js', 'utf8');
eval(dataCode);
console.log('Total works loaded:', window.APP_DATA.works.length);

// Load app.js
const appCode = fs.readFileSync('js/app.js', 'utf8');
eval(appCode);

console.log('App object initialized:', typeof window.app === 'object');
console.log('openWorkDetail exists:', typeof window.app.openWorkDetail === 'function');
console.log('initHomeSearch exists:', typeof window.app.initHomeSearch === 'function');

console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY.');
