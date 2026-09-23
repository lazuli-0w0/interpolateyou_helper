import hexagrams from './ichingHexagrams.json';
import { ichingParaphrases, ichingParaphrase } from './ichingParaphrases.js';
import { ichingSourceUrl } from './ichingSources.js';

test('all 64 hexagrams have a judgement and six individually written paraphrases', () => {
  expect(Object.keys(ichingParaphrases)).toHaveLength(64);
  hexagrams.forEach(hexagram => {
    const readings = ichingParaphrases[hexagram.number];
    expect(readings).toHaveLength(7);
    readings.forEach((reading, index) => {
      expect(typeof reading).toBe('string');
      expect(reading.trim().length).toBeGreaterThan(5);
      expect(ichingParaphrase(hexagram.number, index)).toBe(reading);
    });
  });
});

test('all references resolve to the matching hexagram article, not the article ID', () => {
  expect(ichingSourceUrl(1)).toBe('https://www.yilusoso.com/lssg/1/');
  expect(ichingSourceUrl(16)).toBe('https://www.yilusoso.com/lssg/64/');
  expect(ichingSourceUrl(21)).toBe('https://www.yilusoso.com/lssg/82/');
  expect(ichingSourceUrl(64)).toBe('https://www.yilusoso.com/lssg/217/');
  hexagrams.forEach(hexagram => expect(ichingSourceUrl(hexagram.number)).toMatch(/^https:\/\/www\.yilusoso\.com\/lssg\/\d+\/$/));
});
