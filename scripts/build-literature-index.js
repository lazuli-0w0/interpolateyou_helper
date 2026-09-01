const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const projectRoot = path.resolve(__dirname, '..');
const poetryRoot = path.join(projectRoot, 'data-sources/chinese-poetry');
const novelRoot = path.join(projectRoot, 'data-sources/chinese-novel/resources');
const outputRoot = path.join(projectRoot, 'public/data/literature');
const shardCount = 128;
const chunkSize = 2000;
const prominentLimit = 200;
const contentLimit = 120;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeGzipJson(filePath, value) {
  fs.writeFileSync(filePath, zlib.gzipSync(JSON.stringify(value), { level: 9 }));
}

function cleanText(value) {
  if (value == null) return '';
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanNovelHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|li|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .split(/\n+/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

function flattenText(value) {
  if (Array.isArray(value)) return value.flatMap(flattenText);
  if (typeof value === 'string' || typeof value === 'number') {
    const text = cleanText(value);
    return text ? [text] : [];
  }
  return [];
}

function listFiles(directory, predicate) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath, predicate);
    return entry.isFile() && predicate(entryPath) ? [entryPath] : [];
  });
}

function normalizeSearchText(value) {
  return cleanText(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function getSearchTokens(value) {
  const characters = Array.from(normalizeSearchText(value));
  const tokens = new Set(characters);
  for (let index = 0; index < characters.length - 1; index += 1) {
    tokens.add(characters[index] + characters[index + 1]);
  }
  return tokens;
}

function hashToken(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % shardCount;
}

function inferPoetryMeta(filePath) {
  const relative = path.relative(poetryRoot, filePath);
  const collection = relative.split(path.sep)[0];
  const fileName = path.basename(filePath);

  if (['全唐诗', '全唐詩'].includes(collection)) {
    if (/^poet\.tang\.\d+\.json$/.test(fileName)) return { kind: 'poem', dynasty: '唐', collection };
    if (/^poet\.song\.\d+\.json$/.test(fileName)) return { kind: 'poem', dynasty: '宋', collection: '全宋詩' };
    return null;
  }
  if (['宋词', '宋詞'].includes(collection)) {
    return /^ci\.song\.\d+\.json$/.test(fileName)
      ? { kind: 'ci', dynasty: '宋', collection }
      : null;
  }
  if (collection === '元曲') return { kind: 'qu', dynasty: '元', collection };
  if (['五代诗词', '五代詩詞'].includes(collection)) return { kind: 'ci', dynasty: '五代', collection };
  if (['楚辞', '楚辭'].includes(collection)) return { kind: 'poem', dynasty: '先秦', collection };
  if (['诗经', '詩經'].includes(collection)) return { kind: 'poem', dynasty: '先秦', collection };
  if (['纳兰性德', '納蘭性德'].includes(collection)) return { kind: 'poem', dynasty: '清', collection };
  if (['曹操诗集', '曹操詩集'].includes(collection)) return { kind: 'poem', dynasty: '漢', collection };
  if (['四书五经', '四書五經', '幽梦影', '幽夢影', '蒙学', '蒙學', '论语', '論語'].includes(collection)) {
    return { kind: 'classic', dynasty: '', collection };
  }
  return null;
}

function extractPoetryObjects(value, inheritedTitle = '') {
  if (Array.isArray(value)) return value.flatMap(item => extractPoetryObjects(item, inheritedTitle));
  if (!value || typeof value !== 'object') return [];

  const content = [
    ...flattenText(value.paragraphs),
    ...flattenText(value.content),
    ...flattenText(value.para)
  ];
  if (content.length > 0) return [{ value, content }];

  return Object.entries(value).flatMap(([key, child]) => (
    child && typeof child === 'object' ? extractPoetryObjects(child, inheritedTitle || key) : []
  ));
}

function buildRecords() {
  const records = [];
  const books = [];
  const seen = new Set();
  const sourceCounts = {};

  function addRecord(record) {
    const title = cleanText(record.title) || '無題';
    const author = cleanText(record.author) || '佚名';
    const content = cleanText(record.content);
    if (!content || content.length < 2) return;

    const dedupeKey = `${record.kind}|${title}|${author}|${content}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const normalized = {
      id: records.length,
      title,
      author,
      dynasty: cleanText(record.dynasty),
      kind: record.kind,
      source: cleanText(record.source),
      work: cleanText(record.work),
      category: cleanText(record.category),
      content,
      preview: content.slice(0, 120)
    };
    records.push(normalized);
    sourceCounts[normalized.kind] = (sourceCounts[normalized.kind] || 0) + 1;
    return normalized.id;
  }

  const poetryFiles = listFiles(poetryRoot, filePath => filePath.endsWith('.json'));
  poetryFiles.forEach(filePath => {
    const meta = inferPoetryMeta(filePath);
    if (!meta) return;

    let data;
    try {
      data = readJson(filePath);
    } catch (error) {
      console.warn(`Skipping invalid JSON: ${filePath}`);
      return;
    }

    extractPoetryObjects(data).forEach(({ value, content }) => {
      const section = cleanText(value.section || value.chapter || value.origin);
      const title = cleanText(value.title || value.rhythmic || value.name || section || path.basename(filePath, '.json'));
      addRecord({
        ...meta,
        title,
        author: value.author || (['曹操诗集', '曹操詩集'].includes(meta.collection) ? '曹操' : ''),
        dynasty: value.dynasty || meta.dynasty,
        content: content.join(''),
        source: 'chinese-poetry',
        work: meta.collection,
        category: section
      });
    });
  });

  const infoFiles = listFiles(novelRoot, filePath => path.basename(filePath) === 'info.json');
  infoFiles.forEach(infoPath => {
    let info;
    try {
      info = readJson(infoPath);
    } catch (error) {
      console.warn(`Skipping invalid novel metadata: ${infoPath}`);
      return;
    }

    const bookDirectory = path.dirname(infoPath);
    const htmlFiles = fs.readdirSync(bookDirectory)
      .filter(name => /^\d+\.html$/.test(name))
      .sort((left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10));

    const chapters = [];

    htmlFiles.forEach(fileName => {
      const chapterIndex = Number.parseInt(fileName, 10);
      const content = cleanNovelHtml(fs.readFileSync(path.join(bookDirectory, fileName), 'utf8'));
      const recordId = addRecord({
        title: info.catalogues?.[chapterIndex] || `第 ${chapterIndex + 1} 回`,
        author: info.author?.name,
        dynasty: info.author?.dynasty,
        kind: 'novel',
        source: 'chinese-novel',
        work: info.name || path.basename(bookDirectory),
        category: info.bookType || path.basename(path.dirname(bookDirectory)),
        content
      });
      if (recordId != null) {
        chapters.push({
          id: recordId,
          title: info.catalogues?.[chapterIndex] || `第 ${chapterIndex + 1} 回`
        });
      }
    });

    if (chapters.length > 0) {
      books.push({
        id: `book-${books.length}`,
        title: cleanText(info.name || path.basename(bookDirectory)),
        author: cleanText(info.author?.name) || '佚名',
        dynasty: cleanText(info.author?.dynasty),
        category: cleanText(info.bookType || path.basename(path.dirname(bookDirectory))),
        intro: cleanText(info.intro),
        chapters
      });
    }
  });

  return { records, books, sourceCounts };
}

function writeIndexInBatches(records) {
  const batchSize = 32;

  for (let batchStart = 0; batchStart < shardCount; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, shardCount);
    const shards = Array.from({ length: batchEnd - batchStart }, () => new Map());

    function addToken(token, id, bucket) {
      const shardNumber = hashToken(token);
      if (shardNumber < batchStart || shardNumber >= batchEnd) return;
      const shard = shards[shardNumber - batchStart];
      if (!shard.has(token)) shard.set(token, { h: [], c: [] });
      const entry = shard.get(token);
      const target = bucket === 'h' ? entry.h : entry.c;
      const limit = bucket === 'h' ? prominentLimit : contentLimit;
      if (target.length < limit) target.push(id);
    }

    records.forEach(record => {
      const prominentTokens = getSearchTokens([
        record.title,
        record.author,
        record.dynasty,
        record.work,
        record.category
      ].join(' '));
      prominentTokens.forEach(token => addToken(token, record.id, 'h'));

      const contentTokens = getSearchTokens(record.content);
      contentTokens.forEach(token => {
        if (!prominentTokens.has(token)) addToken(token, record.id, 'c');
      });
    });

    shards.forEach((shard, offset) => {
      const compact = Object.fromEntries(Array.from(shard, ([token, value]) => [
        token,
        value.h.concat(value.c)
      ]));
      const shardNumber = batchStart + offset;
      writeGzipJson(
        path.join(outputRoot, 'index', String(shardNumber).padStart(3, '0') + '.json.gz'),
        compact
      );
    });

    console.log(`Wrote index shards ${batchStart}-${batchEnd - 1}`);
  }
}

function writeBaseOutput(records, books, sourceCounts) {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(outputRoot, 'index'), { recursive: true });
  fs.mkdirSync(path.join(outputRoot, 'catalog'), { recursive: true });
  fs.mkdirSync(path.join(outputRoot, 'bodies'), { recursive: true });

  for (let start = 0; start < records.length; start += chunkSize) {
    const chunkIndex = Math.floor(start / chunkSize);
    const fileName = String(chunkIndex).padStart(3, '0') + '.json';
    const chunk = records.slice(start, start + chunkSize);
    const catalog = chunk.map(record => ({
      i: record.id,
      t: record.title,
      a: record.author,
      d: record.dynasty,
      k: record.kind,
      s: record.source,
      w: record.work,
      g: record.category,
      p: record.preview
    }));
    writeGzipJson(path.join(outputRoot, 'catalog', fileName + '.gz'), catalog);
    writeGzipJson(path.join(outputRoot, 'bodies', fileName + '.gz'), chunk.map(record => record.content));
  }

  fs.writeFileSync(path.join(outputRoot, 'manifest.json'), JSON.stringify({
    version: 1,
    records: records.length,
    shardCount,
    chunkSize,
    chunks: Math.ceil(records.length / chunkSize),
    books: books.length,
    sourceCounts
  }));
  fs.writeFileSync(path.join(outputRoot, 'books.json'), JSON.stringify(books));
}

function main() {
  if (!fs.existsSync(poetryRoot) || !fs.existsSync(novelRoot)) {
    throw new Error('Literature sources are missing under data-sources/.');
  }

  const { records, books, sourceCounts } = buildRecords();
  console.log(`Normalized ${records.length} literature records`, sourceCounts);
  writeBaseOutput(records, books, sourceCounts);
  writeIndexInBatches(records);
  console.log(`Created ${outputRoot}`);
}

main();
