// Convert the plain-text export of the user-provided I Ching.pages document.
// Run: node scripts/import-iching-pages.js /path/to/export.txt
const fs = require('fs');
const path = require('path');

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Pass the Pages plain-text export path.');

const digit = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function chineseNumber(raw) {
  if (raw === '十') return 10;
  if (!raw.includes('十')) return digit[raw];
  const [tens, ones] = raw.split('十');
  return (tens ? digit[tens] : 1) * 10 + (ones ? digit[ones] : 0);
}

const text = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n?/g, '\n');
const sections = text.split(/(?=^第[一二三四五六七八九十]+卦\s*[:：])/m)
  .map(section => section.trim()).filter(section => /^第/.test(section));
if (sections.length !== 64) throw new Error(`Expected 64 hexagrams, got ${sections.length}.`);

const entries = sections.map((section, index) => {
  const paragraphs = section.split('\n').map(line => line.trim()).filter(Boolean);
  const heading = paragraphs.shift().match(/^第([一二三四五六七八九十]+)卦\s*[:：]\s*([^·]+)·([^·]+)·(.+)$/);
  if (!heading) throw new Error(`Unrecognized heading in section ${index + 1}.`);
  const number = chineseNumber(heading[1]);
  if (number !== index + 1) throw new Error(`Unexpected hexagram order: ${number}.`);
  const judgement = paragraphs.shift();
  if (!judgement) throw new Error(`Missing judgement for hexagram ${number}.`);

  const lines = Array(6).fill(null);
  const special = [];
  for (const paragraph of paragraphs) {
    const match = paragraph.match(/^(初[六九]|[六九][二三四五]|上[六九]|用[六九])[：，,]\s*(.+)$/);
    if (!match) throw new Error(`Unrecognized line in hexagram ${number}: ${paragraph}`);
    const [, label, content] = match;
    if (label.startsWith('用')) {
      special.push({ label, text: content });
      continue;
    }
    const position = label.startsWith('初') ? 1 : label.startsWith('上') ? 6
      : { 二: 2, 三: 3, 四: 4, 五: 5 }[label[1]];
    if (lines[position - 1]) throw new Error(`Duplicate position ${position} in hexagram ${number}.`);
    lines[position - 1] = { label, text: content };
  }
  return {
    number,
    sourceName: heading[2],
    sourceSubtitle: heading[3],
    sourceTrigrams: heading[4],
    judgement,
    lines,
    special
  };
});

const missing = entries.flatMap(entry => entry.lines.flatMap((line, index) =>
  line ? [] : [`${entry.number}:${index + 1}`]));
if (missing.join(',') !== '21:1') {
  throw new Error(`Unexpected missing line texts: ${missing.join(',') || 'none'}.`);
}

const outputPath = path.join(__dirname, '..', 'src', 'data', 'ichingHexagrams.json');
fs.writeFileSync(outputPath, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Imported ${entries.length} hexagrams; source missing: ${missing.join(',')}.`);
