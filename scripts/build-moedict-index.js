const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'data-sources/moedict/dict-revised.json');
const cantoneseBooksPath = path.join(projectRoot, 'data-sources/cantonese-books-data');
const outputPath = path.join(projectRoot, 'public/data/moedict-words.json');
const qieyunOutputPath = path.join(projectRoot, 'public/data/qieyun-readings.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function cleanText(value) {
  if (value == null) return '';

  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCharacterMap(filePath) {
  return new Map(readJson(filePath).map(entry => [entry.i, entry.o]));
}

function convertCharacters(value, characterMap) {
  return String(value || '')
    .split('')
    .map(character => characterMap.get(character) || character)
    .join('');
}

function buildJyutpingMap(filePath) {
  const rawData = readJson(filePath);
  const candidates = new Map();

  Object.values(rawData).forEach(entries => {
    entries.forEach(entry => {
      const encodedWords = entry[0];
      const score = Number(entry[1]) || 0;
      if (typeof encodedWords !== 'string') return;

      encodedWords.split(',').forEach(encodedWord => {
        const separatorIndex = encodedWord.indexOf(':');
        if (separatorIndex < 1) return;

        const word = encodedWord.slice(0, separatorIndex).trim();
        const pronunciations = encodedWord
          .slice(separatorIndex + 1)
          .split(':')
          .map(value => value.trim())
          .filter(Boolean);
        if (!word || pronunciations.length === 0) return;

        const current = candidates.get(word);
        if (!current || score > current.score) {
          candidates.set(word, { score, pronunciations: new Set(pronunciations) });
        } else if (score === current.score) {
          pronunciations.forEach(value => current.pronunciations.add(value));
        }
      });
    });
  });

  return new Map(Array.from(candidates, ([word, value]) => [
    word,
    Array.from(value.pronunciations).join('／')
  ]));
}

function listJsonFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listJsonFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.json') ? [entryPath] : [];
  });
}

function extractHeadwords(value) {
  if (typeof value === 'string') return [cleanText(value)].filter(Boolean);
  if (Array.isArray(value)) return value.flatMap(extractHeadwords);
  if (value && typeof value === 'object' && value.字元) return extractHeadwords(value.字元);
  return [];
}

function extractTextValues(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = cleanText(value);
    return text ? [text] : [];
  }
  if (Array.isArray(value)) return value.flatMap(extractTextValues);
  return [];
}

function collectScopedValues(node, targetKeys, isRoot = true) {
  if (!node || typeof node !== 'object') return [];
  if (!isRoot && !Array.isArray(node) && Object.prototype.hasOwnProperty.call(node, '字頭')) {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap(value => collectScopedValues(value, targetKeys, false));
  }

  const values = [];
  Object.entries(node).forEach(([key, value]) => {
    if (targetKeys.has(key)) {
      // Prefer the punctuated edition when both raw and punctuated definitions exist.
      if (key === '釋義' && node.附標點釋義) return;
      values.push(...extractTextValues(value));
      return;
    }
    values.push(...collectScopedValues(value, targetKeys, false));
  });
  return values;
}

function loadCantoneseBooksData(directory) {
  const readingKeys = new Set(['粵拼讀音', '粵拼擬音']);
  const definitionKeys = new Set([
    '附標點釋義',
    '釋義',
    '解釋',
    '註解',
    '釋義或用例',
    '引用字釋義'
  ]);
  const records = new Map();
  const jsonFiles = listJsonFiles(directory);

  function addRecord(words, readings, meanings, source, sourceYear) {
    const validReadings = Array.from(new Set(readings.filter(value => (
      /^[a-z]+[1-6](?:\s+[a-z]+[1-6])*$/i.test(value)
    ))));
    const validMeanings = Array.from(new Set(meanings.filter(value => (
      value && value !== '同上' && value !== '同右' && value !== '同左'
    ))));

    words.forEach(rawWord => {
      const word = cleanText(rawWord);
      if (!word || word.length > 16 || /^\{\[[^\]]+\]\}$/.test(word)) return;

      if (!records.has(word)) {
        records.set(word, {
          readings: new Map(),
          meanings: new Map(),
          sources: new Set()
        });
      }
      const record = records.get(word);
      record.sources.add(source);

      validReadings.forEach(reading => {
        const current = record.readings.get(reading) || { count: 0, year: 0 };
        current.count += 1;
        current.year = Math.max(current.year, sourceYear);
        record.readings.set(reading, current);
      });

      validMeanings.forEach(meaning => {
        const current = record.meanings.get(meaning);
        if (!current || sourceYear > current.year) {
          record.meanings.set(meaning, { year: sourceYear, source });
        }
      });
    });
  }

  function walk(node, context, source, sourceYear) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(value => walk(value, context, source, sourceYear));
      return;
    }

    const words = Object.prototype.hasOwnProperty.call(node, '字頭')
      ? extractHeadwords(node.字頭)
      : [];
    const localReadings = collectScopedValues(node, readingKeys);
    const readings = Array.from(new Set([...(context.readings || []), ...localReadings]));

    if (words.length > 0) {
      addRecord(
        words,
        readings,
        collectScopedValues(node, definitionKeys),
        source,
        sourceYear
      );
    }

    Object.values(node).forEach(value => {
      if (value && typeof value === 'object') {
        walk(value, { readings }, source, sourceYear);
      }
    });
  }

  jsonFiles.forEach(filePath => {
    const source = path.relative(directory, filePath).split(path.sep)[0];
    const years = Array.from(source.matchAll(/\d{4}/g), match => Number(match[0]));
    const sourceYear = years.length > 0 ? Math.max(...years) : 1700;
    walk(readJson(filePath), { readings: [] }, source, sourceYear);
  });

  return new Map(Array.from(records, ([word, record]) => {
    const readings = Array.from(record.readings)
      .sort((left, right) => (
        right[1].count - left[1].count || right[1].year - left[1].year || left[0].localeCompare(right[0])
      ))
      .slice(0, 12)
      .map(([reading]) => reading);
    const meanings = Array.from(record.meanings)
      .sort((left, right) => right[1].year - left[1].year || left[0].length - right[0].length)
      .slice(0, 10)
      .map(([meaning]) => meaning);

    return [word, {
      readings,
      meanings,
      sourceCount: record.sources.size
    }];
  }));
}

function getCantoneseBookEntry(word, simplifiedWord, cantoneseBooks, fanJianMap, jianFanMap) {
  const directCandidates = Array.from(new Set([
    word,
    simplifiedWord,
    convertCharacters(word, fanJianMap),
    convertCharacters(word, jianFanMap)
  ].filter(Boolean)));

  const matches = directCandidates
    .map(candidate => cantoneseBooks.get(candidate))
    .filter(Boolean);
  if (matches.length === 0) return null;

  return {
    readings: Array.from(new Set(matches.flatMap(match => match.readings))),
    meanings: Array.from(new Set(matches.flatMap(match => match.meanings))),
    sourceCount: Math.max(...matches.map(match => match.sourceCount))
  };
}

function findJyutping(
  word,
  simplifiedWord,
  cantoneseBooks,
  jyutpingMap,
  fanJianMap,
  jianFanMap
) {
  const directCandidates = Array.from(new Set([
    word,
    simplifiedWord,
    convertCharacters(word, fanJianMap),
    convertCharacters(word, jianFanMap)
  ].filter(Boolean)));

  const cantoneseBookEntry = getCantoneseBookEntry(
    word,
    simplifiedWord,
    cantoneseBooks,
    fanJianMap,
    jianFanMap
  );
  if (cantoneseBookEntry && cantoneseBookEntry.readings.length > 0) {
    return { value: cantoneseBookEntry.readings.join('／'), source: 'cantonese-books' };
  }

  for (const candidate of directCandidates) {
    const direct = jyutpingMap.get(candidate);
    if (direct) return { value: direct, source: 'phrase' };
  }

  const characterReadings = Array.from(word).map(character => {
    const candidates = Array.from(new Set([
      character,
      convertCharacters(character, fanJianMap),
      convertCharacters(character, jianFanMap)
    ]));

    for (const candidate of candidates) {
      const cantoneseReading = cantoneseBooks.get(candidate)?.readings?.[0];
      if (cantoneseReading) return cantoneseReading;
      const reading = jyutpingMap.get(candidate);
      if (reading) return reading.split('／')[0];
    }
    return '';
  });

  if (characterReadings.length > 0 && characterReadings.every(Boolean)) {
    return { value: characterReadings.join(' '), source: 'characters' };
  }

  return { value: '', source: '' };
}

function extractMeanings(entry) {
  const meanings = [];
  const seen = new Set();

  (entry.heteronyms || []).forEach(heteronym => {
    (heteronym.definitions || []).forEach(definition => {
      const text = cleanText(definition.def);
      if (!text) return;
      const type = cleanText(definition.type);
      const meaning = type ? `【${type}】${text}` : text;
      if (seen.has(meaning)) return;
      seen.add(meaning);
      meanings.push(meaning);
    });
  });

  return meanings;
}

function extractMandarinPinyin(entry) {
  return Array.from(new Set((entry.heteronyms || [])
    .map(heteronym => cleanText(heteronym.pinyin))
    .filter(Boolean)));
}

function mergePronunciations(existingValue, newValues) {
  return Array.from(new Set([
    ...String(existingValue || '').split('／').filter(Boolean),
    ...newValues
  ])).join('／');
}

function buildMandarinCharacterMap(dictionary) {
  const readings = new Map();

  dictionary.forEach(entry => {
    const word = cleanText(entry.title);
    if (Array.from(word).length !== 1) return;

    const values = extractMandarinPinyin(entry);
    if (values.length === 0) return;
    readings.set(word, mergePronunciations(readings.get(word), values));
  });

  return readings;
}

function deriveMandarinPinyin(word, characterMap, fanJianMap, jianFanMap) {
  const readings = Array.from(word).map(character => {
    const candidates = Array.from(new Set([
      character,
      convertCharacters(character, fanJianMap),
      convertCharacters(character, jianFanMap)
    ]));
    return candidates.map(candidate => characterMap.get(candidate)).find(Boolean) || '';
  });

  return readings.length > 0 && readings.every(Boolean) ? readings.join(' ') : '';
}

async function writeQieyunReadings(records) {
  const TshetUinh = require('tshet-uinh');
  const characters = new Set(records.flatMap(record => Array.from(record.t)));
  const qieyunReadings = {};

  characters.forEach(character => {
    const readings = Array.from(new Set(TshetUinh.資料.query字頭(character)
      .map(result => cleanText(result.反切))
      .filter(Boolean)))
      .slice(0, 8)
      .map(fanqie => `${fanqie}切`);
    if (readings.length > 0) qieyunReadings[character] = readings.join('／');
  });

  fs.writeFileSync(qieyunOutputPath, JSON.stringify(qieyunReadings));
  console.log(`Created ${qieyunOutputPath}`);
  console.log(`With Qieyun fanqie: ${Object.keys(qieyunReadings).length} characters`);
  console.log(`Qieyun size: ${(fs.statSync(qieyunOutputPath).size / 1024 / 1024).toFixed(1)} MB`);
}

function loadCorpus(jianFanMap) {
  const corpus = new Map();
  const files = ['ciZu.json', 'cijyu.json'];

  files.forEach(fileName => {
    const items = readJson(path.join(projectRoot, 'public/data', fileName));
    items.forEach(item => {
      if (!item.word) return;
      const traditional = convertCharacters(item.word, jianFanMap);
      const current = corpus.get(traditional);
      if (!current || (Number(item.count) || 0) > current.count) {
        corpus.set(traditional, {
          simplified: item.word,
          count: Number(item.count) || 0,
          next_zi: item.next_zi || ''
        });
      }
    });
  });

  return corpus;
}

async function buildIndex() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Dictionary source is missing: ${sourcePath}`);
  }

  const dictionary = readJson(sourcePath);
  const fanJianMap = buildCharacterMap(path.join(projectRoot, 'public/data/fanjian.json'));
  const jianFanMap = buildCharacterMap(path.join(projectRoot, 'public/data/jianfan.json'));
  const cantoneseBooks = loadCantoneseBooksData(cantoneseBooksPath);
  const jyutpingMap = buildJyutpingMap(path.join(projectRoot, 'public/data/wan_file/jyutwan.json'));
  const corpus = loadCorpus(jianFanMap);
  const mandarinCharacterMap = buildMandarinCharacterMap(dictionary);
  const recordsByWord = new Map();

  dictionary.forEach(entry => {
    const word = cleanText(entry.title);
    if (!word || /^\{\[[^\]]+\]\}$/.test(word)) return;

    const simplified = convertCharacters(word, fanJianMap);
    const corpusData = corpus.get(word) || corpus.get(convertCharacters(simplified, jianFanMap));
    const cantoneseBookEntry = getCantoneseBookEntry(
      word,
      simplified,
      cantoneseBooks,
      fanJianMap,
      jianFanMap
    );
    const jyutping = findJyutping(
      word,
      simplified,
      cantoneseBooks,
      jyutpingMap,
      fanJianMap,
      jianFanMap
    );
    const meanings = extractMeanings(entry);
    const mandarinPinyin = extractMandarinPinyin(entry);
    const existing = recordsByWord.get(word);

    if (existing) {
      const meaningKeys = new Set(existing.m || []);
      meanings.forEach(meaning => {
        if (!meaningKeys.has(meaning)) {
          if (!existing.m) existing.m = [];
          existing.m.push(meaning);
          meaningKeys.add(meaning);
        }
      });
      const mergedPinyin = mergePronunciations(existing.p, mandarinPinyin);
      if (mergedPinyin) existing.p = mergedPinyin;
      return;
    }

    recordsByWord.set(word, {
      t: word,
      ...(simplified !== word ? { s: simplified } : {}),
      ...(jyutping.value ? { j: jyutping.value } : {}),
      ...(mandarinPinyin.length > 0 ? { p: mandarinPinyin.join('／') } : {}),
      ...(cantoneseBookEntry?.meanings.length ? { cm: cantoneseBookEntry.meanings } : {}),
      ...(cantoneseBookEntry ? { b: cantoneseBookEntry.sourceCount } : {}),
      ...(meanings.length > 0 ? { m: meanings } : {}),
      ...(corpusData ? {
        c: corpusData.count,
        ...(corpusData.next_zi ? { n: corpusData.next_zi } : {})
      } : {})
    });
  });

  corpus.forEach((corpusData, traditional) => {
    if (recordsByWord.has(traditional)) return;

    const jyutping = findJyutping(
      traditional,
      corpusData.simplified,
      cantoneseBooks,
      jyutpingMap,
      fanJianMap,
      jianFanMap
    );
    const cantoneseBookEntry = getCantoneseBookEntry(
      traditional,
      corpusData.simplified,
      cantoneseBooks,
      fanJianMap,
      jianFanMap
    );
    const mandarinPinyin = deriveMandarinPinyin(
      traditional,
      mandarinCharacterMap,
      fanJianMap,
      jianFanMap
    );

    recordsByWord.set(traditional, {
      t: traditional,
      ...(corpusData.simplified !== traditional ? { s: corpusData.simplified } : {}),
      ...(jyutping.value ? { j: jyutping.value } : {}),
      ...(mandarinPinyin ? { p: mandarinPinyin } : {}),
      ...(cantoneseBookEntry?.meanings.length ? { cm: cantoneseBookEntry.meanings } : {}),
      ...(cantoneseBookEntry ? { b: cantoneseBookEntry.sourceCount } : {}),
      c: corpusData.count,
      ...(corpusData.next_zi ? { n: corpusData.next_zi } : {})
    });
  });

  cantoneseBooks.forEach((cantoneseBookEntry, word) => {
    const traditional = convertCharacters(word, jianFanMap);
    if (recordsByWord.has(traditional)) return;

    const simplified = convertCharacters(traditional, fanJianMap);
    const mandarinPinyin = deriveMandarinPinyin(
      traditional,
      mandarinCharacterMap,
      fanJianMap,
      jianFanMap
    );
    recordsByWord.set(traditional, {
      t: traditional,
      ...(simplified !== traditional ? { s: simplified } : {}),
      ...(cantoneseBookEntry.readings.length ? { j: cantoneseBookEntry.readings.join('／') } : {}),
      ...(mandarinPinyin ? { p: mandarinPinyin } : {}),
      ...(cantoneseBookEntry.meanings.length ? { cm: cantoneseBookEntry.meanings } : {}),
      b: cantoneseBookEntry.sourceCount
    });
  });

  const records = Array.from(recordsByWord.values())
    .sort((left, right) => {
      const scoreDifference = (right.c || 0) - (left.c || 0);
      if (scoreDifference !== 0) return scoreDifference;
      const cantoneseDifference = Number(Boolean(right.b)) - Number(Boolean(left.b));
      if (cantoneseDifference !== 0) return cantoneseDifference;
      const definitionDifference = Number(Boolean(right.m)) - Number(Boolean(left.m));
      if (definitionDifference !== 0) return definitionDifference;
      return left.t.localeCompare(right.t, 'zh-Hant');
    });

  fs.writeFileSync(outputPath, JSON.stringify(records));
  await writeQieyunReadings(records);

  const dictionaryCount = records.filter(record => record.m).length;
  const jyutpingCount = records.filter(record => record.j).length;
  const mandarinPinyinCount = records.filter(record => record.p).length;
  const cantoneseBooksCount = records.filter(record => record.b).length;
  const cantoneseMeaningCount = records.filter(record => record.cm).length;
  console.log(`Created ${outputPath}`);
  console.log(`Records: ${records.length}`);
  console.log(`With definitions: ${dictionaryCount}`);
  console.log(`With Jyutping: ${jyutpingCount}`);
  console.log(`With Mandarin Pinyin: ${mandarinPinyinCount}`);
  console.log(`With Cantonese Books data: ${cantoneseBooksCount}`);
  console.log(`With Cantonese Books definitions: ${cantoneseMeaningCount}`);
  console.log(`Size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)} MB`);
}

buildIndex().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
