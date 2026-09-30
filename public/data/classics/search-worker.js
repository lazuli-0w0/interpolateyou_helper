/* SQLite stays in this worker so scanning the corpus never blocks typing. */
let databasePromise;
let sqlPromise;
let baseCatalogPromise;
let niutransCatalogPromise;
let normalizationPromise;
const shardPromises = new Map();
let characterMap;
function loadDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const [SQL, response] = await Promise.all([
        loadSql(),
        fetch(new URL('classics.sqlite', self.location.href))
      ]);
      if (!response.ok) throw new Error('Database unavailable');
      return new SQL.Database(new Uint8Array(await response.arrayBuffer()));
    })().catch(error => { databasePromise = null; throw error; });
  }
  return databasePromise;
}
function loadBaseCatalog() {
  if (!baseCatalogPromise) {
    baseCatalogPromise = fetch(new URL('catalog-base.json', self.location.href))
      .then(response => {
        if (!response.ok) throw new Error('Classics catalog unavailable');
        return response.json();
      }).catch(error => { baseCatalogPromise = null; throw error; });
  }
  return baseCatalogPromise;
}
function loadNormalization() {
  if (!normalizationPromise) {
    normalizationPromise = fetch(new URL('search-normalization.json', self.location.href))
      .then(response => {
        if (!response.ok) throw new Error('Search normalization unavailable');
        return response.json();
      }).then(mapping => { characterMap = mapping; })
      .catch(error => { normalizationPromise = null; throw error; });
  }
  return normalizationPromise;
}
function loadSql() {
  if (!sqlPromise) {
    importScripts(new URL('sql-wasm.js', self.location.href).href);
    sqlPromise = initSqlJs({ locateFile: file => new URL(file, self.location.href).href });
  }
  return sqlPromise;
}
function loadNiuTransCatalog() {
  if (!niutransCatalogPromise) {
    niutransCatalogPromise = fetch(new URL('niutrans/catalog.json', self.location.href))
      .then(response => {
        if (!response.ok) throw new Error('Classics catalog unavailable');
        return response.json();
      }).catch(error => { niutransCatalogPromise = null; throw error; });
  }
  return niutransCatalogPromise;
}
async function databaseFor(bookId) {
  if (!bookId || bookId === '*') return loadDatabase();
  const catalog = await loadNiuTransCatalog();
  if (!catalog.books.some(book => book.id === bookId)) return loadDatabase();
  if (!shardPromises.has(bookId)) {
    const promise = Promise.all([
      loadSql(),
      fetch(new URL(`niutrans/${bookId}.sqlite`, self.location.href))
    ]).then(async ([SQL, response]) => {
      if (!response.ok) throw new Error('Book unavailable');
      return new SQL.Database(new Uint8Array(await response.arrayBuffer()));
    }).catch(error => { shardPromises.delete(bookId); throw error; });
    shardPromises.set(bookId, promise);
  }
  return shardPromises.get(bookId);
}
function normalize(value) {
  return Array.from(String(value || '').normalize('NFKC').replace(/\s/g, ''))
    .map(char => characterMap[char] || char).join('').toLowerCase();
}
function rows(db, sql, params = []) {
  const statement = db.prepare(sql);
  try {
    statement.bind(params);
    const result = [];
    while (statement.step()) result.push(statement.getAsObject());
    return result;
  } finally { statement.free(); }
}
self.onmessage = async ({ data: { id, action, options = {} } }) => {
  try {
    const [niutransCatalog] = await Promise.all([loadNiuTransCatalog(), loadNormalization()]);
    let result;
    if (action === 'catalog') {
      const baseCatalog = await loadBaseCatalog();
      result = {
        books: [...baseCatalog.books, ...niutransCatalog.books].sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant')),
        chapters: [...baseCatalog.chapters, ...niutransCatalog.chapters]
      };
    } else {
      const db = await databaseFor(options.bookId);
      if (action === 'chapter') {
      result = rows(db, 'SELECT id,paragraph,original,translation FROM sentences WHERE book_id=? AND volume=? ORDER BY position', [options.bookId, Number(options.volume)]);
      } else if (action === 'search' || action === 'search-chapters') {
      const query = normalize(options.query).slice(0, 200);
      const allBooks = options.bookId === '*';
      const clauses = allBooks ? ['1=1'] : ['s.book_id = ?'];
      const params = allBooks ? [] : [options.bookId];
      if (options.volume !== '' && options.volume != null) { clauses.push('s.volume=?'); params.push(Number(options.volume)); }
      if (options.scope === 'translation') clauses.push('s.translation IS NOT NULL');
      if (query) {
        const fields = options.scope === 'original' ? ['original_search'] : options.scope === 'translation' ? ['translation_search'] : ['original_search', 'translation_search'];
        fields.push('metadata_search');
        clauses.push('(' + fields.map(field => `instr(s.${field},?)>0`).join(' OR ') + ')');
        fields.forEach(() => params.push(query));
      }
      const where = clauses.join(' AND ');
      if (action === 'search-chapters') {
        result = rows(db, `SELECT s.book_id,s.volume,s.original,s.translation,c.title AS chapter_title,MIN(s.position) AS position FROM sentences s JOIN chapters c ON c.book_id=s.book_id AND c.volume=s.volume WHERE ${where} GROUP BY s.book_id,s.volume ORDER BY s.book_id,s.volume`, params);
        if (allBooks && query) {
          result.push(...niutransCatalog.chapters.filter(chapter =>
            normalize(chapter.title + chapter.part).includes(query)
          ).map(chapter => ({ book_id: chapter.book_id, volume: chapter.volume,
            original: '', translation: null, chapter_title: chapter.title, position: 0 })));
        }
      } else {
      const total = rows(db, `SELECT COUNT(*) AS total FROM sentences s WHERE ${where}`, params)[0].total;
      const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
      const offset = Math.max(0, Number(options.offset) || 0);
      result = { total, results: rows(db, `SELECT s.book_id,s.id,s.volume,s.paragraph,s.original,s.translation,c.title AS chapter_title,b.title AS book_title FROM sentences s JOIN chapters c ON c.book_id=s.book_id AND c.volume=s.volume JOIN books b ON b.id=s.book_id WHERE ${where} ORDER BY b.title,s.volume,s.position LIMIT ? OFFSET ?`, [...params, limit, offset]) };
      }
      } else { throw new Error('Unknown request'); }
    }
    self.postMessage({ id, result });
  } catch (error) { self.postMessage({ id, error: error.message || String(error) }); }
};
