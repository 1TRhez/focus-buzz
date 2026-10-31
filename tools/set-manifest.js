// ??: node tools/set-manifest.js <designWidth|-> <entry|-> [--add-probe]
const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../src/manifest.json');
const m = JSON.parse(fs.readFileSync(file, 'utf8'));
const [width, entry] = process.argv.slice(2);
if (width && width !== '-') m.config.designWidth = Number(width);
if (entry && entry !== '-') {
  const normalized = entry.replace(/\\/g, '/');
  if (!m.router.pages[normalized]) throw new Error('entry not in router.pages: ' + normalized);
  m.router.entry = normalized;
}
if (process.argv.includes('--add-probe')) m.router.pages['pages/probe'] = { component: 'index' };
if (process.argv.includes('--rm-probe')) delete m.router.pages['pages/probe'];
fs.writeFileSync(file, JSON.stringify(m, null, 2) + '\n');
console.log('designWidth =', m.config.designWidth, '| entry =', m.router.entry,
  '| pages =', Object.keys(m.router.pages).join(','));
