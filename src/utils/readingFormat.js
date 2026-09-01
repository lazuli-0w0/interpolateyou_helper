const POETRY_ENDINGS = '。';
const PROSE_ENDINGS = '。！？；';
const CLOSING_MARKS = '」』】）》’”';

const escapeCharacterClass = value => value.replace(/[\\\]\-^]/g, '\\$&');

export function splitReadingParagraphs(content, kind = 'prose') {
  const text = String(content || '').replace(/\r\n?/g, '\n').trim();
  if (!text) return [];

  const endings = kind === 'poetry' ? POETRY_ENDINGS : PROSE_ENDINGS;
  const safeEndings = escapeCharacterClass(endings);
  const safeClosings = escapeCharacterClass(CLOSING_MARKS);
  const sentencePattern = new RegExp(
    `[^${safeEndings}\\n]+[${safeEndings}]?[${safeClosings}]?`,
    'g'
  );

  const sourceParagraphs = kind === 'poetry'
    ? [text.replace(/\s*\n+\s*/g, '')]
    : text.split(/\n+/);

  return sourceParagraphs
    .map(paragraph => (paragraph.match(sentencePattern) || [paragraph])
      .map(sentence => sentence.trim())
      .filter(Boolean))
    .filter(paragraph => paragraph.length > 0);
}
