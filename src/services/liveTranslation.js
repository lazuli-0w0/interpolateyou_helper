const TRANSLATION_LOCALES = {
  en: { source: 'zh-TW', target: 'en-GB' },
  it: { source: 'zh-TW', target: 'it-IT' }
};

const MAX_CHUNK_LENGTH = 420;

function splitIntoChunks(text) {
  const pieces = text.match(/[^。！？!?\n]+[。！？!?]?|\n+/g) || [text];
  const chunks = [];
  let current = '';

  for (const piece of pieces) {
    if (current.length + piece.length <= MAX_CHUNK_LENGTH) {
      current += piece;
      continue;
    }

    if (current) chunks.push(current);
    current = piece;
    while (current.length > MAX_CHUNK_LENGTH) {
      chunks.push(current.slice(0, MAX_CHUNK_LENGTH));
      current = current.slice(MAX_CHUNK_LENGTH);
    }
  }

  if (current) chunks.push(current);
  return chunks.filter(chunk => chunk.trim());
}

async function translateChunk(text, language) {
  const { source, target } = TRANSLATION_LOCALES[language];
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', `${source}|${target}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Translation request failed (${response.status})`);

  const data = await response.json();
  const translatedText = data?.responseData?.translatedText;
  if (!translatedText) throw new Error('Translation was unavailable');
  return translatedText;
}

export function supportsLiveTranslation(locale) {
  return Object.prototype.hasOwnProperty.call(TRANSLATION_LOCALES, locale);
}

export async function translateEntryLive(text, locale) {
  if (!supportsLiveTranslation(locale) || !text?.trim()) return '';

  const chunks = splitIntoChunks(text);
  const translatedChunks = [];
  for (const chunk of chunks) {
    translatedChunks.push(await translateChunk(chunk, locale));
  }
  return translatedChunks.join('');
}
