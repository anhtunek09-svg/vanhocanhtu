const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const views = [...html.matchAll(/id="(view-[^"]+)"/g)];
views.forEach(v => console.log(v[1]));
