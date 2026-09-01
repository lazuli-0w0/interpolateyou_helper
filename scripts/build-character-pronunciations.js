const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'public/data/moedict-words.json');
const outputPath = path.join(projectRoot, 'public/data/character-pronunciations.json');

const words = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const pronunciations = {};

for (const item of words) {
  if (Array.from(item.t || '').length !== 1 || (!item.j && !item.p)) continue;

  const reading = { j: item.j || '', p: item.p || '' };
  if (!pronunciations[item.t]) pronunciations[item.t] = reading;
  if (item.s && !pronunciations[item.s]) pronunciations[item.s] = reading;
}

fs.writeFileSync(outputPath, `${JSON.stringify(pronunciations)}\n`);
console.log(`Wrote ${Object.keys(pronunciations).length} character readings to ${outputPath}`);
