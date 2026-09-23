import { getHexagram, hexagramNumberFromFigure, readingFromValues, zhuXiSelections } from './ichingTexts.js';

test('all 64 upper/lower trigram combinations map to distinct numbered hexagrams', () => {
  const trigrams = ['111', '110', '101', '100', '011', '010', '001', '000'];
  const names = ['乾', '兌', '離', '震', '巽', '坎', '艮', '坤'];
  const asLines = key => [...key].map(bit => bit === '1');
  const numbers = trigrams.flatMap(lower => trigrams.map(upper =>
    hexagramNumberFromFigure([...asLines(lower), ...asLines(upper)])));
  expect(new Set(numbers).size).toBe(64);
  expect(Math.min(...numbers)).toBe(1);
  expect(Math.max(...numbers)).toBe(64);

  const sourceHeadingMismatches = [];
  const sourceLineMismatches = [];
  trigrams.forEach((lower, lowerIndex) => trigrams.forEach((upper, upperIndex) => {
    const figure = [...asLines(lower), ...asLines(upper)];
    const entry = getHexagram(hexagramNumberFromFigure(figure));
    if (entry.sourceTrigrams !== `${names[upperIndex]}上${names[lowerIndex]}下`) {
      sourceHeadingMismatches.push(entry.number);
    }
    entry.lines.forEach((line, index) => {
      if (line && line.label.includes(figure[index] ? '六' : '九')) {
        sourceLineMismatches.push(`${entry.number}:${index + 1}`);
      }
    });
  }));
  expect(sourceHeadingMismatches.sort((a, b) => a - b)).toEqual([8]);
  expect(sourceLineMismatches).toEqual([]);
});

test('the supplied 夬-to-乾 example uses changed 上九 and original other lines', () => {
  const reading = readingFromValues([7, 7, 7, 7, 7, 6]);
  expect(reading.originalHexagram.number).toBe(43);
  expect(reading.originalHexagram.name).toBe('夬');
  expect(reading.changedHexagram.number).toBe(1);
  expect(reading.changedHexagram.name).toBe('乾');
  expect(reading.selectedLines[0].line.text).toBe('壯於前趾，往不勝為吝。');
  expect(reading.selectedLines[5]).toMatchObject({
    moving: true, hexagramNumber: 1,
    line: { label: '上九', text: '亢龍有悔。' }
  });
});

test('中孚 is displayed with its upper and lower trigram names', () => {
  const reading = readingFromValues([7, 7, 8, 8, 7, 7]);
  expect(reading.originalHexagram.number).toBe(61);
  expect(reading.originalHexagram.fullName).toBe('風澤中孚');
  expect(reading.changedHexagram.fullName).toBe('風澤中孚');
  expect(reading.selectedLines[0].hexagramName).toBe('風澤中孚');
});

test('the one missing source line is visibly supplemented without rewriting the supplied document', () => {
  const reading = readingFromValues([7, 8, 8, 7, 8, 7]);
  expect(reading.originalHexagram.number).toBe(21);
  expect(reading.selectedLines[0].line).toMatchObject({
    label: '初九', text: '屨校滅趾，無咎。', supplemental: true
  });
  expect(getHexagram(21).lines).toHaveLength(6);
});

test('Zhu Xi selection follows each moving-line count without changing the full six-line record', () => {
  const cases = [
    { values: [7, 7, 7, 7, 7, 7], kinds: ['judgement'], sources: ['original'], positions: [0] },
    { values: [7, 7, 7, 7, 9, 7], kinds: ['line'], sources: ['original'], positions: [5] },
    { values: [7, 9, 7, 7, 9, 7], kinds: ['line', 'line'], sources: ['original', 'original'], positions: [2, 5], primary: 5 },
    { values: [9, 9, 9, 7, 7, 7], kinds: ['judgement', 'judgement'], sources: ['original', 'changed'], positions: [0, 0], primarySource: 'original' },
    { values: [7, 9, 9, 9, 7, 7], kinds: ['judgement', 'judgement'], sources: ['original', 'changed'], positions: [0, 0], primarySource: 'changed' },
    { values: [9, 9, 9, 9, 7, 7], kinds: ['line', 'line'], sources: ['changed', 'changed'], positions: [5, 6], primary: 5 },
    { values: [9, 9, 9, 9, 9, 7], kinds: ['line'], sources: ['changed'], positions: [6] },
    { values: [9, 6, 6, 6, 9, 6], kinds: ['judgement'], sources: ['changed'], positions: [0] }
  ];
  cases.forEach(({ values, kinds, sources, positions, primary, primarySource }) => {
    const reading = readingFromValues(values);
    const entries = zhuXiSelections(reading).entries;
    expect(entries.map(entry => entry.kind)).toEqual(kinds);
    expect(entries.map(entry => entry.source)).toEqual(sources);
    expect(entries.map(entry => entry.position)).toEqual(positions);
    expect(entries.filter(entry => entry.primary).map(entry => entry.position)).toEqual(primarySource ? [0] : primary ? [primary] : []);
    if (primarySource) expect(entries.find(entry => entry.primary).source).toBe(primarySource);
    expect(reading.selectedLines).toHaveLength(6);
  });
});

test('one moving line uses the original line, while six moving lines in Qian/Kun use special texts', () => {
  const example = zhuXiSelections(readingFromValues([7, 8, 7, 8, 9, 8]));
  expect(example.entries[0]).toMatchObject({
    kind: 'line', source: 'original', hexagramNumber: 63, position: 5,
    line: { label: '九五', text: '東鄰殺牛，不如西鄰之禴祭，實受其福。' }
  });
  expect(zhuXiSelections(readingFromValues([9, 9, 9, 9, 9, 9])).entries[0])
    .toMatchObject({ kind: 'special', hexagramNumber: 1, line: { label: '用九' } });
  expect(zhuXiSelections(readingFromValues([6, 6, 6, 6, 6, 6])).entries[0])
    .toMatchObject({ kind: 'special', hexagramNumber: 2, line: { label: '用六' } });
});
