import { createTranslator } from '../i18n.js';
import { readingFromValues } from './ichingTexts.js';
import { fullHexagramName } from './ichingTexts.js';
import { buildIChingReportModel, reportColumns } from './ichingReport.js';

const t = createTranslator('zh-Hant');
const values = [6, 8, 7, 9, 6, 8];

test('report is one eight-column manuscript: summary, six lines bottom-first, original judgement', () => {
  const model = buildIChingReportModel({
    values, reading: readingFromValues(values), t,
    now: new Date('2026-09-23T12:00:00+08:00')
  });
  const columns = reportColumns(model);
  expect(columns).toHaveLength(8);
  expect(columns[7].label).toBe('卦象摘要');
  expect(columns[7].summary.originalLineLabels).toEqual(model.original.lines.map(entry => entry.label));
  expect(columns[7].summary.changedLineLabels).toEqual(model.changed.lines.map(entry => entry.label));
  expect(columns[7].summary.originalName).toBeTruthy();
  expect(columns[7].summary.changedName).toBeTruthy();
  expect(columns[7].summary).not.toHaveProperty('coins');
  expect(columns.slice(1, 7).map(column => column.label)).toEqual(
    model.entries.slice(1).reverse().map(entry => entry.label)
  );
  expect(columns[0].label).toBe('卦辭');
  expect(columns[0].body).toContain(model.original.judgement);
  expect(columns[0].body).toContain(model.changed.judgement);
  expect(JSON.stringify(columns)).not.toContain('語譯');
});

test('report rejects incomplete or invalid six-line input', () => {
  const reading = readingFromValues(values);
  expect(() => buildIChingReportModel({ values: values.slice(0, 5), reading, t })).toThrow();
  expect(() => buildIChingReportModel({ values: [5, ...values.slice(1)], reading, t })).toThrow();
});

test('summary names water-over-fire and earth-over-fire hexagrams and uses line names', () => {
  const input = [7, 8, 7, 8, 9, 8];
  const reading = readingFromValues(input);
  const columns = reportColumns(buildIChingReportModel({ values: input, reading, t }));
  expect(fullHexagramName(reading.original, reading.originalHexagram.name)).toBe('水火既濟');
  expect(fullHexagramName(reading.changed, reading.changedHexagram.name)).toBe('地火明夷');
  expect(columns[7].summary.originalName).toBe('水火既濟');
  expect(columns[7].summary.changedName).toBe('地火明夷');
  expect(columns[7].summary.originalLineLabels).toEqual(['初九', '六二', '九三', '六四', '九五', '上六']);
  expect(columns[7].summary.changedLineLabels).toEqual(['初九', '六二', '九三', '六四', '六五', '上六']);
  expect(columns[7].summary.hasChange).toBe(true);
});

test('six moving yin lines keep separate original-six and changed-nine sets', () => {
  const allYin = Array(6).fill(6);
  const model = buildIChingReportModel({
    values: allYin,
    reading: readingFromValues(allYin), t
  });
  const { summary } = reportColumns(model)[7];
  expect(summary.originalLineLabels).toEqual(['初六', '六二', '六三', '六四', '六五', '上六']);
  expect(summary.changedLineLabels).toEqual(['初九', '九二', '九三', '九四', '九五', '上九']);
  expect(summary.hasChange).toBe(true);
});

test('a figure without moving lines needs just one label set', () => {
  const steady = Array(6).fill(8);
  const model = buildIChingReportModel({
    values: steady,
    reading: readingFromValues(steady), t
  });
  const columns = reportColumns(model);
  expect(columns[7].summary.hasChange).toBe(false);
  expect(columns[7].summary).not.toHaveProperty('changedName');
  expect(columns[7].summary).not.toHaveProperty('changedLineLabels');
  expect(columns[0].body).not.toContain('變卦');
  expect(JSON.stringify(columns)).not.toContain('變卦');
});

test('中孚 uses its full 風澤中孚 name in report text and summary', () => {
  const steady = [7, 7, 8, 8, 7, 7];
  const columns = reportColumns(buildIChingReportModel({ values: steady, reading: readingFromValues(steady), t }));
  expect(columns[0].body).toContain('風澤中孚');
  expect(columns[7].summary.originalName).toBe('風澤中孚');
  expect(columns[7].summary).not.toHaveProperty('changedName');
});
