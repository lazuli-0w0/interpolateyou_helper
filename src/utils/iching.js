export const COIN_TEXT = 'text';
export const COIN_REVERSE = 'reverse';

// The user-specified face mapping is: three Tongbao = old yin (6), two
// Tongbao = young yin (8), two Manchu = young yang (7), and three Manchu =
// old yang (9). Lines are supplied in casting order: bottom to top.
export function lineValueFromCoins(faces) {
  if (!Array.isArray(faces) || faces.length !== 3 ||
      faces.some(face => face !== COIN_TEXT && face !== COIN_REVERSE)) {
    throw new TypeError('A cast needs exactly three valid coin faces.');
  }
  const manchuCount = faces.filter(face => face === COIN_REVERSE).length;
  return [6, 8, 7, 9][manchuCount];
}

export function lineFromValue(value) {
  if (![6, 7, 8, 9].includes(value)) throw new RangeError('A line value must be 6, 7, 8, or 9.');
  const isYang = value === 7 || value === 9;
  const isMoving = value === 6 || value === 9;
  return { value, isYang, isMoving, changedYang: isMoving ? !isYang : isYang };
}

export function hexagramsFromLines(values) {
  if (!Array.isArray(values) || values.length !== 6) {
    throw new TypeError('A hexagram needs six lines, bottom first.');
  }
  const lines = values.map(lineFromValue);
  return {
    lines,
    original: lines.map(line => line.isYang),
    changed: lines.map(line => line.changedYang),
    movingPositions: lines.flatMap((line, index) => line.isMoving ? [index + 1] : [])
  };
}

export function randomCoinFaces(cryptoSource = typeof window === 'undefined' ? undefined : window.crypto) {
  if (!cryptoSource || typeof cryptoSource.getRandomValues !== 'function') {
    throw new Error('Secure randomness is unavailable in this browser.');
  }
  const bytes = cryptoSource.getRandomValues(new Uint8Array(3));
  // Three independent fair faces give 6/8/7/9 in a 1:3:3:1 ratio.
  // Drawing a line value uniformly would overproduce moving lines.
  return Array.from(bytes, byte => (byte & 1) === 0 ? COIN_TEXT : COIN_REVERSE);
}
