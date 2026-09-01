import {
  FEATURED_POEMS,
  getFeaturedPoemPresentation,
  pickFeaturedPoem
} from './featuredPoems.js';

test('featured poem picker never repeats the previous poem', () => {
  const previous = FEATURED_POEMS[0];
  expect(pickFeaturedPoem(previous.id, 0).id).not.toBe(previous.id);
  expect(pickFeaturedPoem(previous.id, 0.999999).id).not.toBe(previous.id);
});

test('featured poem picker returns an item from the curated collection', () => {
  const result = pickFeaturedPoem(null, 0.42);
  expect(FEATURED_POEMS).toContain(result);
  expect(result.lines.length).toBeGreaterThan(0);
});

test('featured poem picker supports an extended collection', () => {
  const collection = [
    { id: 'one', weight: 1 },
    { id: 'two', weight: 1 },
    { id: 'three', weight: 1 }
  ];
  expect(pickFeaturedPoem('one', 0, collection).id).toBe('two');
  expect(pickFeaturedPoem('one', 0.999, collection).id).toBe('three');
});

test('featured poem presentation scales text by poem length', () => {
  expect(getFeaturedPoemPresentation({ lines: ['短詩一句。'] }).density).toBe('spacious');
  expect(getFeaturedPoemPresentation({ lines: ['甲'.repeat(50)] }).density).toBe('compact');
  expect(getFeaturedPoemPresentation({ lines: ['甲'.repeat(70)] }).density).toBe('dense');
});

test('featured poem presentation truncates long poems without growing the card', () => {
  const result = getFeaturedPoemPresentation({ lines: ['甲'.repeat(30), '乙'.repeat(30), '丙'.repeat(30), '丁'.repeat(30)] });
  expect(result.truncated).toBe(true);
  expect(result.lines.join('').endsWith('……')).toBe(true);
  expect(result.lines.join('').replace('……', '').length).toBeLessThanOrEqual(84);
});

test('featured poem presentation limits the number of visible lines', () => {
  const result = getFeaturedPoemPresentation({ lines: ['一。', '二。', '三。', '四。', '五。'] });
  expect(result.lines).toHaveLength(4);
  expect(result.lines[3]).toBe('四……');
});
