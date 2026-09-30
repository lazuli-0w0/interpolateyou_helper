const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const initSqlJs = require('sql.js');
const directory = path.resolve(__dirname, '../public/data/classics');
const replies = new Map();
let dbFetches = 0;
const context = {
  URL, Uint8Array,
  importScripts: () => {},
  initSqlJs: () => initSqlJs({ locateFile: file => path.join(directory, file) }),
  fetch: async url => {
    const relative = decodeURIComponent(new URL(url).pathname.split('/data/classics/')[1]);
    const file = path.join(directory, relative);
    if (file.endsWith('.sqlite')) dbFetches++;
    return { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')), arrayBuffer: async () => Uint8Array.from(fs.readFileSync(file)).buffer };
  },
  self: { location: { href: 'https://example.test/data/classics/search-worker.js' }, postMessage: data => replies.set(data.id, data) }
};
vm.runInNewContext(fs.readFileSync(path.join(directory, 'search-worker.js'), 'utf8'), context);
let requestId = 0;
async function request(action, options) {
  const id = ++requestId;
  await context.self.onmessage({ data: { id, action, options } });
  const response = replies.get(id);
  if (response.error) throw new Error(response.error);
  return response.result;
}
(async () => {
  const catalog = await request('catalog');
  assert.equal(dbFetches, 0, 'opening the book list should not download a text database');
  assert.equal(catalog.books.length, 99);
  assert.equal(catalog.books.filter(book => !['宋論', '三朝北盟會編'].includes(book.title)).length, 97);
  assert.equal(catalog.books.reduce((sum, book) => sum + book.translated_units, 0), 972748);
  const book = catalog.books.find(item => item.title === '三朝北盟會編');
  const bookId = book.id;
  assert.equal(book.volume_count, 250);
  assert.equal(catalog.chapters.filter(chapter => chapter.book_id === bookId).length, 251);
  const chapterMatches = await request('search-chapters', { bookId: '*', query: '宋論' });
  assert.equal(chapterMatches.length, 15);
  assert.equal(new Set(chapterMatches.map(row => `${row.book_id}:${row.volume}`)).size, 15);
  const chapterParaphrases = await request('search-chapters', { bookId, query: '皇帝厭煩' });
  assert.ok(chapterParaphrases.some(row => row.volume === 1));
  const noChapter = await request('search-chapters', { bookId: '*', query: "' OR 1=1 --" });
  assert.equal(noChapter.length, 0);
  const all = await request('search', { bookId });
  assert.equal(all.total, 27822);
  const translated = await request('search', { bookId, scope: 'translation' });
  assert.equal(translated.total, 130);
  const missing = await request('search', { bookId, scope: 'translation', volume: 2 });
  assert.equal(missing.total, 0);
  const traditional = await request('search', { bookId, query: '高藥師' });
  const simplified = await request('search', { bookId, query: '高药师' });
  assert.ok(traditional.total > 0);
  assert.equal(traditional.total, simplified.total);
  const one = await request('search', { bookId, query: '宋' });
  assert.ok(one.total > 0);
  const injection = await request('search', { bookId, query: "' OR 1=1 --" });
  assert.equal(injection.total, 0);
  const literal = await request('search', { bookId, query: '%' });
  assert.equal(literal.total, 0);
  const second = await request('search', { bookId, offset: 20 });
  assert.equal(new Set([...all.results, ...second.results].map(row => row.id)).size, 40);
  const chapter = await request('chapter', { bookId, volume: 250 });
  assert.ok(chapter.length > 0);
  assert.ok(chapter.every(row => row.translation === null));
  const paraphrase = await request('search', { bookId, scope: 'translation', query: '皇帝厭煩' });
  assert.ok(paraphrase.results.some(row => row.id === 'v001-048'));
  const song = catalog.books.find(item => item.title === '宋論');
  assert.ok(song);
  assert.equal(song.volume_count, 15);
  assert.equal(catalog.chapters.filter(chapter => chapter.book_id === song.id).length, 15);
  const songAll = await request('search', { bookId: song.id });
  assert.equal(songAll.total, 5901);
  const songTranslated = await request('search', { bookId: song.id, scope: 'translation' });
  assert.equal(songTranslated.total, 151);
  assert.ok(songTranslated.results.every(row => row.book_id === song.id));
  const songEnd = await request('chapter', { bookId: song.id, volume: 15 });
  assert.ok(songEnd.length > 0);
  assert.equal((await request('chapter', { bookId: song.id, volume: 0 })).length, 0);
  const duplicateId = await request('chapter', { bookId: song.id, volume: 1 });
  assert.notEqual(duplicateId[0].original, (await request('chapter', { bookId, volume: 1 }))[0].original);
  const library = await request('search', { bookId: '*' });
  assert.equal(library.total, 33723);
  for (const [title, volumes, units] of [['論語', 20, 1171], ['老子', 81, 369], ['孫子兵法', 13, 264]]) {
    const imported = catalog.books.find(item => item.title === title);
    assert.ok(imported, `${title} missing from catalog`);
    assert.equal(imported.volume_count, volumes);
    assert.equal((await request('search', { bookId: imported.id })).total, units);
    assert.equal((await request('search', { bookId: imported.id, scope: 'translation' })).total, units);
  }
  const analects = catalog.books.find(item => item.title === '論語');
  assert.ok((await request('search', { bookId: analects.id, query: '學而時習之' })).total > 0);
  assert.ok((await request('search', { bookId: analects.id, query: '学而时习之' })).total > 0);
  const byTitle = await request('search', { bookId: '*', query: '宋論' });
  assert.equal(byTitle.total, 5901);
  assert.ok(byTitle.results.every(row => row.book_id === song.id));
  assert.equal(dbFetches, 4);
  console.log('PASS: real SQLite worker, 99 books, 1,006,190 units, 972,748 translations, selected-book shards, variants, one-character queries, pagination, literal SQL parameters, lazy database reuse.');
})().catch(error => { console.error(error); process.exitCode = 1; });
