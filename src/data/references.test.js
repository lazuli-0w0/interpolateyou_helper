import { allReferences, BASE_REFERENCES, referenceStats } from './references.js';

test('the central catalogue lists distinct sources without 64 repeated article links', () => {
  const references = allReferences();
  const stats = referenceStats(references);
  expect(references.filter(reference => reference.group === 'ichingArticles')).toHaveLength(0);
  expect(stats.total).toBe(BASE_REFERENCES.length);
  expect(stats.local).toBe(2);
  expect(stats.linked).toBe(stats.total - stats.local);
  expect(new Set(references.filter(reference => reference.url).map(reference => reference.url)).size).toBe(stats.linked);
  expect(references.find(reference => reference.id === 'ichingPages').title).toContain('站長整理');
  expect(references.find(reference => reference.id === 'qindingCipu').title).toBe('《欽定詞譜》');
  expect(references.find(reference => reference.id === 'cipouExperience').local).toBe(true);
});

test('source links live in the References catalogue', () => {
  const reference = id => allReferences().find(item => item.id === id);
  expect(reference('chinesePoetry').url).toBe('https://github.com/chinese-poetry/chinese-poetry');
  expect(reference('ichingSupplementalLine').url).toBe('https://www.yilusoso.com/lssg/82/');
  expect(reference('zhuXiRules').url).toContain('shidianguji.com');
  expect(reference('ichingPages').url).toBeNull();
});
