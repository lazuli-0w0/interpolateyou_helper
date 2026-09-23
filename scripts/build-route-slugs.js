const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const output = path.join(root, 'public/data/route-slugs');
const pronunciations = JSON.parse(fs.readFileSync(path.join(root, 'public/data/character-pronunciations.json')));
const words = JSON.parse(fs.readFileSync(path.join(root, 'public/data/moedict-words.json')));
const books = JSON.parse(fs.readFileSync(path.join(root, 'public/data/literature/books.json')));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/data/literature/manifest.json')));
const cipaiSource = fs.readFileSync(path.join(root, 'src/complete_cipai_names.js'), 'utf8');
const cipaiNames = [...cipaiSource.matchAll(/^\s*"(\d+)":\s*"([^"]+)"/gm)];

function firstJyutping(value) {
  return String(value || '').split(/[／/,;]/)[0].replace(/[1-6]/g, '').trim().toLowerCase();
}

function slugForTitle(title) {
  const syllables = [];
  for (const char of String(title || '')) {
    if (/\p{Script=Han}/u.test(char)) {
      const reading = firstJyutping(pronunciations[char]?.j).match(/[a-z]+/)?.[0];
      // Retain a stable ASCII fallback for characters absent from the source dictionary.
      syllables.push(reading || `u${char.codePointAt(0).toString(36)}`);
    } else if (/[a-z0-9]/i.test(char)) {
      if (!syllables.length || !/[a-z0-9]$/i.test(syllables[syllables.length - 1])) syllables.push(char.toLowerCase());
      else syllables[syllables.length - 1] += char.toLowerCase();
    }
  }
  return syllables.join('-') || 'opera';
}

const indexes = { words: {}, poetry: {}, novels: {}, cipou: {} };
function add(view, title, id, explicitReading) {
  const reading = firstJyutping(explicitReading);
  const slug = reading && /^[a-z]+(?:\s+[a-z]+)*$/.test(reading)
    ? reading.split(/\s+/).join('-') : slugForTitle(title);
  (indexes[view][slug] ||= []).push(id);
}

words.forEach((word, index) => add('words', word.t, index + 1, word.j));
for (let chunk = 0; chunk < manifest.chunks; chunk += 1) {
  const filename = path.join(root, 'public/data/literature/catalog', `${String(chunk).padStart(3, '0')}.json.gz`);
  const records = JSON.parse(zlib.gunzipSync(fs.readFileSync(filename)));
  records.forEach(record => {
    if (record) add(record.k === 'novel' ? 'novels' : 'poetry', record.t, record.i);
  });
}
books.forEach(book => add('novels', book.title, book.id));
cipaiNames.forEach(([, id, name]) => add('cipou', name, Number(id)));

// These are the two homophones explicitly shown in the product URL specification.
if (indexes.words.luk) {
  const preferred = [68839, 77835];
  indexes.words.luk.sort((a, b) => {
    const aIndex = preferred.indexOf(a);
    const bIndex = preferred.indexOf(b);
    return (aIndex < 0 ? Infinity : aIndex) - (bIndex < 0 ? Infinity : bIndex) || a - b;
  });
}

for (const [view, entries] of Object.entries(indexes)) {
  const folder = path.join(output, view);
  fs.mkdirSync(folder, { recursive: true });
  const shards = Array.from({ length: 64 }, () => ({}));
  for (const [slug, ids] of Object.entries(entries)) {
    let hash = 0;
    for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    shards[hash % 64][slug] = ids;
  }
  shards.forEach((entriesInShard, shard) => {
    fs.writeFileSync(path.join(folder, `${String(shard).padStart(2, '0')}.json`), JSON.stringify(entriesInShard));
  });
  console.log(`${view}: ${Object.keys(entries).length} Jyutping slugs`);
}
