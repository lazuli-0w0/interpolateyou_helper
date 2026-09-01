import {
  buildSearchText,
  collectMatchingPage,
  generateChineseSearchVariants,
  getPreferredMeanings,
  getSecondaryMeanings,
  getLiteratureSearchRank,
  getLiteratureSearchTokens,
  getLiteratureShard,
  getWordSearchRank,
  matchesSearchItem,
  matchesSearchName,
  matchesWordSearch,
  mergeUniqueResults,
  takeNewItemsByKey
} from './search';

describe('search helpers', () => {
  test('searches nested ci tune pattern details', () => {
    const cipou = {
      id: 1,
      name: '一七令',
      variants: [{ author: '白居易', introduction: '七平韻', example: '明月夜' }]
    };

    expect(matchesSearchItem(cipou, ['白居易'])).toBe(true);
    expect(matchesSearchItem(cipou, ['明月夜'])).toBe(true);
    expect(buildSearchText(cipou)).toContain('七平韻');
  });

  test('limits ci tune name search to names and aliases', () => {
    const descriptionOnlyMatch = {
      name: '一七令',
      variants: [{ description: '谷水咽還流' }]
    };
    const nameMatch = { name: '水調歌頭', variants: [] };

    expect(matchesSearchName(descriptionOnlyMatch, ['水'])).toBe(false);
    expect(matchesSearchName(nameMatch, ['水'])).toBe(true);
  });

  test('matches a Traditional Chinese query against a Simplified Chinese name', () => {
    const variants = generateChineseSearchVariants(
      '水調歌頭',
      new Map([['調', '调'], ['頭', '头']]),
      new Map([['调', '調'], ['头', '頭']])
    );

    expect(variants).toContain('水调歌头');
    expect(matchesSearchName({ name: '水调歌头' }, variants)).toBe(true);
  });

  test('returns a later page without repeating earlier matches', () => {
    const records = Array.from({ length: 8 }, (_, id) => ({ id, matches: id % 2 === 0 }));
    const page = collectMatchingPage(records, {
      offset: 2,
      limit: 2,
      matches: item => item.matches
    });

    expect(page.results.map(item => item.id)).toEqual([4, 6]);
    expect(page.hasMore).toBe(false);
  });

  test('reports when another matching page is available', () => {
    const page = collectMatchingPage([1, 2, 3], {
      limit: 2,
      matches: () => true
    });

    expect(page.results).toEqual([1, 2]);
    expect(page.hasMore).toBe(true);
  });

  test('deduplicates appended results by stable id', () => {
    expect(mergeUniqueResults(
      [{ id: 'a', title: 'first' }],
      [{ id: 'a', title: 'updated' }, { id: 'b', title: 'second' }]
    )).toEqual([
      { id: 'a', title: 'updated' },
      { id: 'b', title: 'second' }
    ]);
  });

  test('keeps the preferred source when word datasets overlap', () => {
    const seenWords = new Set();
    const preferred = takeNewItemsByKey(
      [{ word: '國', source: 'primary' }, { word: '水', source: 'primary' }],
      seenWords,
      item => item.word
    );
    const fallback = takeNewItemsByKey(
      [{ word: '國', source: 'fallback' }, { word: '月', source: 'fallback' }],
      seenWords,
      item => item.word
    );

    expect([...preferred, ...fallback]).toEqual([
      { word: '國', source: 'primary' },
      { word: '水', source: 'primary' },
      { word: '月', source: 'fallback' }
    ]);
  });

  test('finds dictionary words by Traditional or Simplified characters', () => {
    const item = { text: '國家', simplified: '国家', jyutPinyin: 'gwok3 gaa1' };

    expect(matchesWordSearch(item, ['國家', '国家'], '國家')).toBe(true);
    expect(matchesWordSearch(item, ['国家', '國家'], '国家')).toBe(true);
  });

  test('finds words by spaced, compact, toned, or toneless Jyutping', () => {
    const item = { text: '國家', jyutPinyin: 'gwok3 gaa1' };

    expect(matchesWordSearch(item, ['gwok3 gaa1'], 'gwok3 gaa1')).toBe(true);
    expect(matchesWordSearch(item, ['gwok3gaa1'], 'gwok3gaa1')).toBe(true);
    expect(matchesWordSearch(item, ['gwok gaa'], 'gwok gaa')).toBe(true);
  });

  test('matches short Jyutping on syllable boundaries instead of inside another syllable', () => {
    expect(matchesWordSearch(
      { text: '唔', jyutPinyin: 'm4／ng4／ng2' },
      ['ng4'],
      'ng4'
    )).toBe(true);
    expect(matchesWordSearch(
      { text: '上', jyutPinyin: 'soeng4' },
      ['ng4'],
      'ng4'
    )).toBe(false);
  });

  test('does not match words through definition text', () => {
    const item = {
      text: '國家',
      jyutPinyin: 'gwok3 gaa1',
      meanings: ['有土地、人民、主權的政治團體。']
    };

    expect(matchesWordSearch(item, ['政治'], '政治')).toBe(false);
  });

  test('ranks an exact headword above a partial headword match', () => {
    const variants = ['水'];

    expect(getWordSearchRank({ text: '水' }, variants, '水')).toBeGreaterThan(
      getWordSearchRank({ text: '水國' }, variants, '水')
    );
  });

  test('prioritizes Cantonese Books meanings and keeps MOE as secondary data', () => {
    const item = {
      cantoneseMeanings: ['粵語典籍釋義'],
      meanings: ['教育部釋義', '粵語典籍釋義']
    };

    expect(getPreferredMeanings(item)).toEqual(['粵語典籍釋義']);
    expect(getSecondaryMeanings(item)).toEqual(['教育部釋義']);
  });

  test('creates overlapping literature tokens for phrase search', () => {
    expect(getLiteratureSearchTokens('床前明月')).toEqual(['床前', '前明', '明月']);
    expect(getLiteratureSearchTokens('水')).toEqual(['水']);
    expect(getLiteratureShard('明月')).toBe(getLiteratureShard('明月'));
  });

  test('ranks an exact literature title above a body-only candidate', () => {
    const variants = ['靜夜思'];
    expect(getLiteratureSearchRank({ title: '靜夜思' }, variants)).toBeGreaterThan(
      getLiteratureSearchRank({ title: '無題', preview: '靜夜思故鄉' }, variants)
    );
  });
});
