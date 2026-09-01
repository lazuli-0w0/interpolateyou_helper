const SEARCHABLE_FIELDS = [
  'text',
  'title',
  'name',
  'content',
  'author',
  'pinyin',
  'jyutPinyin',
  'dynasty',
  'description',
  'introduction',
  'example'
];

const NAME_FIELDS = ['name', 'title', 'alias', 'aliases'];
const WORD_FIELDS = ['text', 'traditional', 'simplified'];

function normalizeValue(value) {
  if (Array.isArray(value)) return value.join(' ');
  return value == null ? '' : String(value);
}

function convertCharacters(value, characterMap) {
  return normalizeValue(value)
    .split('')
    .map(character => characterMap.get(character) || character)
    .join('');
}

export function generateChineseSearchVariants(
  query,
  traditionalToSimplified,
  simplifiedToTraditional
) {
  const normalizedQuery = normalizeValue(query).trim().toLowerCase();
  if (!normalizedQuery) return [];

  return Array.from(new Set([
    normalizedQuery,
    convertCharacters(normalizedQuery, traditionalToSimplified),
    convertCharacters(normalizedQuery, simplifiedToTraditional)
  ]));
}

// Build one searchable string, including the nested records used by ci tune patterns.
export function buildSearchText(item) {
  if (!item) return '';

  const values = SEARCHABLE_FIELDS.map(field => normalizeValue(item[field]));

  if (Array.isArray(item.paragraphs)) {
    values.push(item.paragraphs.join(' '));
  }

  if (Array.isArray(item.variants)) {
    item.variants.forEach(variant => {
      SEARCHABLE_FIELDS.forEach(field => values.push(normalizeValue(variant[field])));
    });
  }

  return values.join(' ').toLowerCase();
}

export function matchesSearchItem(item, searchVariants) {
  const searchableText = buildSearchText(item);
  return searchVariants.some(variant => {
    const normalizedVariant = normalizeValue(variant).trim().toLowerCase();
    return normalizedVariant && searchableText.includes(normalizedVariant);
  });
}

// Cípai search is a name lookup. Pattern examples and descriptions often
// contain common characters (such as 水), but that must not make the parent
// cípai appear as a name match.
export function matchesSearchName(item, searchVariants) {
  const searchableText = NAME_FIELDS
    .map(field => normalizeValue(item && item[field]))
    .join(' ')
    .toLowerCase();

  return searchVariants.some(variant => {
    const normalizedVariant = normalizeValue(variant).trim().toLowerCase();
    return normalizedVariant && searchableText.includes(normalizedVariant);
  });
}

function normalizeJyutping(value, keepTones) {
  const normalized = normalizeValue(value).toLowerCase();
  return normalized.replace(keepTones ? /[^a-z0-9]/g : /[^a-z]/g, '');
}

function containsTokenSequence(candidateTokens, queryTokens) {
  if (queryTokens.length === 0 || candidateTokens.length < queryTokens.length) return false;
  for (let index = 0; index <= candidateTokens.length - queryTokens.length; index += 1) {
    if (queryTokens.every((token, offset) => candidateTokens[index + offset] === token)) return true;
  }
  return false;
}

function getJyutpingMatches(item, query) {
  const queryValue = normalizeValue(query).trim().toLowerCase();
  if (!/[a-z]/.test(queryValue)) return { exact: false, prefix: false, partial: false };

  const keepTones = /[1-6]/.test(queryValue);
  const normalizedQuery = normalizeJyutping(queryValue, keepTones);
  if (!normalizedQuery) return { exact: false, prefix: false, partial: false };

  const pronunciations = normalizeValue(item && item.jyutPinyin)
    .split(/[／/]/)
    .map(value => value.trim())
    .filter(Boolean);

  const queryToneCount = (queryValue.match(/[1-6]/g) || []).length;
  const isSingleTonedSyllable = queryToneCount === 1 && /^[a-z]+[1-6]$/.test(queryValue);
  const isLikelySingleTonelessSyllable = queryToneCount === 0 && /^[a-z]+$/.test(queryValue) && queryValue.length <= 6;

  if (isSingleTonedSyllable || isLikelySingleTonelessSyllable) {
    const normalizeSyllable = value => normalizeJyutping(value, isSingleTonedSyllable);
    const syllableQuery = normalizeSyllable(queryValue);
    const tokenLists = pronunciations.map(value => (
      value.split(/\s+/).map(normalizeSyllable).filter(Boolean)
    ));
    const matchesSyllable = token => (
      isSingleTonedSyllable ? token === syllableQuery : token.startsWith(syllableQuery)
    );

    return {
      exact: tokenLists.some(tokens => tokens.length === 1 && tokens[0] === syllableQuery),
      prefix: tokenLists.some(tokens => tokens.length > 0 && matchesSyllable(tokens[0])),
      partial: tokenLists.some(tokens => tokens.some(matchesSyllable))
    };
  }

  if (/\s/.test(queryValue)) {
    const queryTokens = queryValue
      .split(/\s+/)
      .map(value => normalizeJyutping(value, keepTones))
      .filter(Boolean);
    const tokenLists = pronunciations.map(value => (
      value.split(/\s+/).map(token => normalizeJyutping(token, keepTones)).filter(Boolean)
    ));

    return {
      exact: tokenLists.some(tokens => tokens.join(' ') === queryTokens.join(' ')),
      prefix: tokenLists.some(tokens => (
        tokens.slice(0, queryTokens.length).join(' ') === queryTokens.join(' ')
      )),
      partial: tokenLists.some(tokens => containsTokenSequence(tokens, queryTokens))
    };
  }

  const compactPronunciations = pronunciations
    .map(value => normalizeJyutping(value, keepTones))
    .filter(Boolean);

  return {
    exact: compactPronunciations.some(value => value === normalizedQuery),
    prefix: compactPronunciations.some(value => value.startsWith(normalizedQuery)),
    partial: compactPronunciations.some(value => value.includes(normalizedQuery))
  };
}

// Word lookup intentionally searches only the headword forms and Jyutping.
// Definitions are displayed in results but do not create broad, noisy matches.
export function matchesWordSearch(item, searchVariants, rawQuery) {
  const wordForms = WORD_FIELDS
    .map(field => normalizeValue(item && item[field]).toLowerCase())
    .filter(Boolean);
  const characterMatch = searchVariants.some(variant => {
    const normalizedVariant = normalizeValue(variant).trim().toLowerCase();
    return normalizedVariant && wordForms.some(value => value.includes(normalizedVariant));
  });
  const jyutpingMatch = getJyutpingMatches(item, rawQuery);

  return characterMatch || jyutpingMatch.partial;
}

export function getWordSearchRank(item, searchVariants, rawQuery) {
  const wordForms = WORD_FIELDS
    .map(field => normalizeValue(item && item[field]).toLowerCase())
    .filter(Boolean);
  const normalizedVariants = searchVariants
    .map(variant => normalizeValue(variant).trim().toLowerCase())
    .filter(Boolean);

  if (normalizedVariants.some(variant => wordForms.some(value => value === variant))) return 500;

  const jyutpingMatch = getJyutpingMatches(item, rawQuery);
  if (jyutpingMatch.exact) return 450;
  if (normalizedVariants.some(variant => wordForms.some(value => value.startsWith(variant)))) return 400;
  if (jyutpingMatch.prefix) return 350;
  if (normalizedVariants.some(variant => wordForms.some(value => value.includes(variant)))) return 300;
  if (jyutpingMatch.partial) return 250;
  return 0;
}

export function getPreferredMeanings(item) {
  const cantoneseMeanings = Array.isArray(item && item.cantoneseMeanings)
    ? item.cantoneseMeanings.filter(Boolean)
    : [];
  if (cantoneseMeanings.length > 0) return cantoneseMeanings;

  return Array.isArray(item && item.meanings) ? item.meanings.filter(Boolean) : [];
}

export function getSecondaryMeanings(item) {
  const cantoneseMeanings = new Set(
    Array.isArray(item && item.cantoneseMeanings) ? item.cantoneseMeanings.filter(Boolean) : []
  );
  if (cantoneseMeanings.size === 0) return [];

  return (Array.isArray(item && item.meanings) ? item.meanings : [])
    .filter(meaning => meaning && !cantoneseMeanings.has(meaning));
}

export function getLiteratureSearchTokens(value) {
  const normalized = normalizeValue(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
  const characters = Array.from(normalized);
  if (characters.length <= 1) return characters;

  const tokens = [];
  for (let index = 0; index < characters.length - 1; index += 1) {
    tokens.push(characters[index] + characters[index + 1]);
  }
  return Array.from(new Set(tokens));
}

export function getLiteratureShard(token, shardCount = 128) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % shardCount;
}

export function getLiteratureSearchRank(item, searchVariants) {
  const normalizedVariants = searchVariants
    .map(value => normalizeValue(value).trim().toLowerCase())
    .filter(Boolean);
  const title = normalizeValue(item?.title).toLowerCase();
  const author = normalizeValue(item?.author).toLowerCase();
  const work = normalizeValue(item?.work).toLowerCase();
  const category = normalizeValue(item?.category).toLowerCase();
  const preview = normalizeValue(item?.preview).toLowerCase();

  if (normalizedVariants.some(value => title === value || work === value)) return 1000;
  if (normalizedVariants.some(value => author === value)) return 900;
  if (normalizedVariants.some(value => title.startsWith(value) || work.startsWith(value))) return 800;
  if (normalizedVariants.some(value => title.includes(value) || work.includes(value))) return 700;
  if (normalizedVariants.some(value => author.includes(value))) return 650;
  if (normalizedVariants.some(value => category.includes(value))) return 600;
  if (normalizedVariants.some(value => preview.includes(value))) return 550;
  return 500;
}

// Select one page from a stream of matching records. matchedCount can be carried
// across data shards, allowing later pages to skip records already returned.
export function collectMatchingPage(items, options) {
  const {
    offset = 0,
    limit = Number.POSITIVE_INFINITY,
    matchedCount = 0,
    matches,
    mapItem = item => item
  } = options;

  const results = [];
  let seenMatches = matchedCount;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!matches(item, index)) continue;

    if (seenMatches < offset) {
      seenMatches += 1;
      continue;
    }

    if (results.length >= limit) {
      return { results, matchedCount: seenMatches, hasMore: true };
    }

    results.push(mapItem(item, index));
    seenMatches += 1;
  }

  return { results, matchedCount: seenMatches, hasMore: false };
}

export function mergeUniqueResults(existing, incoming) {
  const merged = new Map();
  [...existing, ...incoming].forEach(item => merged.set(item.id, item));
  return Array.from(merged.values());
}

// Keep the first source's record when later datasets repeat the same key.
export function takeNewItemsByKey(items, seenKeys, keySelector) {
  return items.filter(item => {
    const key = keySelector(item);
    if (key == null || key === '' || seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
}
