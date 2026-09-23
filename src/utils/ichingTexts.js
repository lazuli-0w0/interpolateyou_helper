import hexagrams from '../data/ichingHexagrams.json';
import { hexagramsFromLines } from './iching.js';

// Rows are the lower trigram; columns are the upper trigram. Each trigram
// key is written from its bottom line to its top line (1 = yang, 0 = yin).
const TRIGRAM_KEYS = ['111', '110', '101', '100', '011', '010', '001', '000'];
const TRIGRAM_ELEMENTS = {
  '111': '天', '110': '澤', '101': '火', '100': '雷',
  '011': '風', '010': '水', '001': '山', '000': '地'
};
const HEXAGRAM_MATRIX = [
  [1, 43, 14, 34, 9, 5, 26, 11],
  [10, 58, 38, 54, 61, 60, 41, 19],
  [13, 49, 30, 55, 37, 63, 22, 36],
  [25, 17, 21, 51, 42, 3, 27, 24],
  [44, 28, 50, 32, 57, 48, 18, 46],
  [6, 47, 64, 40, 59, 29, 4, 7],
  [33, 31, 56, 62, 53, 39, 52, 15],
  [12, 45, 35, 16, 20, 8, 23, 2]
];

// The supplied document spells these two names differently from its lookup
// diagram and common hexagram names. Retain the exact source in sourceName.
const STANDARD_NAMES = { 24: '復', 31: '咸' };
const SUPPLEMENTAL_LINES = {
  21: {
    0: {
      label: '初九',
      text: '屨校滅趾，無咎。',
      supplemental: true
    }
  }
};

export function hexagramNumberFromFigure(bottomFirstLines) {
  if (!Array.isArray(bottomFirstLines) || bottomFirstLines.length !== 6 ||
      bottomFirstLines.some(line => typeof line !== 'boolean')) {
    throw new TypeError('A figure needs six boolean lines, bottom first.');
  }
  const key = lines => lines.map(line => line ? '1' : '0').join('');
  const lower = TRIGRAM_KEYS.indexOf(key(bottomFirstLines.slice(0, 3)));
  const upper = TRIGRAM_KEYS.indexOf(key(bottomFirstLines.slice(3, 6)));
  return HEXAGRAM_MATRIX[lower][upper];
}

export function fullHexagramName(bottomFirstLines, shortName) {
  if (!Array.isArray(bottomFirstLines) || bottomFirstLines.length !== 6 ||
      bottomFirstLines.some(line => typeof line !== 'boolean')) {
    throw new TypeError('A figure needs six boolean lines, bottom first.');
  }
  const key = lines => lines.map(line => line ? '1' : '0').join('');
  const lower = key(bottomFirstLines.slice(0, 3));
  const upper = key(bottomFirstLines.slice(3, 6));
  return upper === lower
    ? `${shortName}為${TRIGRAM_ELEMENTS[upper]}`
    : `${TRIGRAM_ELEMENTS[upper]}${TRIGRAM_ELEMENTS[lower]}${shortName}`;
}

export function getHexagram(number) {
  const entry = hexagrams[number - 1];
  if (!entry || entry.number !== number) throw new RangeError(`Unknown hexagram ${number}.`);
  const supplemental = SUPPLEMENTAL_LINES[number];
  return {
    ...entry,
    name: STANDARD_NAMES[number] || entry.sourceName,
    lines: supplemental
      ? entry.lines.map((line, index) => line?.text ? line : supplemental[index] || line)
      : entry.lines
  };
}

export function readingFromValues(values) {
  const figures = hexagramsFromLines(values);
  const originalEntry = getHexagram(hexagramNumberFromFigure(figures.original));
  const changedEntry = getHexagram(hexagramNumberFromFigure(figures.changed));
  const original = { ...originalEntry, fullName: fullHexagramName(figures.original, originalEntry.name) };
  const changed = { ...changedEntry, fullName: fullHexagramName(figures.changed, changedEntry.name) };
  const selectedLines = figures.lines.map((line, index) => {
    const source = line.isMoving ? changed : original;
    return {
      position: index + 1,
      moving: line.isMoving,
      hexagramNumber: source.number,
      hexagramName: source.fullName,
      line: source.lines[index]
    };
  });
  return { ...figures, originalHexagram: original, changedHexagram: changed, selectedLines };
}

// Text selection described in 《易學啓蒙通釋・考變占第四》. This is separate
// from the user's six-line transcription above, which always shows every line.
export function zhuXiSelections(reading) {
  const { originalHexagram: original, changedHexagram: changed, movingPositions } = reading;
  const count = movingPositions.length;
  const unchangedPositions = [1, 2, 3, 4, 5, 6].filter(position => !movingPositions.includes(position));
  const judgement = (hexagram, source) => ({
    kind: 'judgement', source, hexagramNumber: hexagram.number,
    hexagramName: hexagram.fullName, position: 0, text: hexagram.judgement
  });
  const line = (hexagram, source, position, primary = false) => ({
    kind: 'line', source, hexagramNumber: hexagram.number,
    hexagramName: hexagram.fullName, position, line: hexagram.lines[position - 1],
    primary
  });

  let entries;
  if (count === 0) {
    entries = [judgement(original, 'original')];
  } else if (count <= 2) {
    entries = movingPositions.map(position => line(original, 'original', position, count === 2 && position === Math.max(...movingPositions)));
  } else if (count === 3) {
    // In the source's 20 three-line figures, the first ten all change the
    // initial (bottom) line. They privilege 貞 (original); the latter ten 悔.
    const originalPrimary = movingPositions.includes(1);
    entries = [
      { ...judgement(original, 'original'), primary: originalPrimary },
      { ...judgement(changed, 'changed'), primary: !originalPrimary }
    ];
  } else if (count <= 5) {
    entries = unchangedPositions.map(position => line(changed, 'changed', position, count === 4 && position === Math.min(...unchangedPositions)));
  } else if (original.number === 1 || original.number === 2) {
    entries = [{
      kind: 'special', source: 'original', hexagramNumber: original.number,
      hexagramName: original.fullName, position: 7, line: original.special[0]
    }];
  } else {
    entries = [judgement(changed, 'changed')];
  }
  return { movingCount: count, entries };
}
