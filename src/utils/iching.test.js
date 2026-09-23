import {
  COIN_REVERSE,
  COIN_TEXT,
  hexagramsFromLines,
  lineValueFromCoins,
  randomCoinFaces
} from './iching.js';

test('the four outcomes follow the specified Tongbao/Manchu mapping', () => {
  expect(lineValueFromCoins([COIN_TEXT, COIN_TEXT, COIN_TEXT])).toBe(6);
  expect(lineValueFromCoins([COIN_REVERSE, COIN_TEXT, COIN_TEXT])).toBe(8);
  expect(lineValueFromCoins([COIN_REVERSE, COIN_REVERSE, COIN_TEXT])).toBe(7);
  expect(lineValueFromCoins([COIN_REVERSE, COIN_REVERSE, COIN_REVERSE])).toBe(9);
});

test('six bottom-first values deterministically produce original and changed figures', () => {
  const values = [6, 7, 8, 9, 7, 8];
  const first = hexagramsFromLines(values);
  expect(first.original).toEqual([false, true, false, true, true, false]);
  expect(first.changed).toEqual([true, true, false, false, true, false]);
  expect(first.movingPositions).toEqual([1, 4]);
  expect(hexagramsFromLines(values)).toEqual(first);
});

test('random casting consumes cryptographic bytes and never falls back silently', () => {
  const secureSource = { getRandomValues: jest.fn(array => { array.set([0, 1, 254]); return array; }) };
  expect(randomCoinFaces(secureSource)).toEqual([COIN_TEXT, COIN_REVERSE, COIN_TEXT]);
  expect(secureSource.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
  expect(() => randomCoinFaces(null)).toThrow('Secure randomness');
});

test('three independent coin faces make moving lines one quarter of all casts', () => {
  const counts = { 6: 0, 7: 0, 8: 0, 9: 0 };
  for (let combination = 0; combination < 8; combination += 1) {
    const secureSource = { getRandomValues: array => {
      array.set([0, 1, 2].map(index => (combination >> index) & 1));
      return array;
    } };
    counts[lineValueFromCoins(randomCoinFaces(secureSource))] += 1;
  }
  expect(counts).toEqual({ 6: 1, 7: 3, 8: 3, 9: 1 });
  expect(counts[6] + counts[9]).toBe(2);
});
