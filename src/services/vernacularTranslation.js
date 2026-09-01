import { splitReadingParagraphs } from '../utils/readingFormat.js';

const MAX_CHUNK_LENGTH = 1800;

export function splitVernacularSource(text) {
  const pieces = String(text || '').match(/[^。！？；!?\n]+[。！？；!?]?|\n+/g) || [];
  const chunks = [];
  let current = '';

  for (const piece of pieces) {
    if (current.length + piece.length <= MAX_CHUNK_LENGTH) {
      current += piece;
      continue;
    }

    if (current.trim()) chunks.push(current.trim());
    current = piece;

    while (current.length > MAX_CHUNK_LENGTH) {
      chunks.push(current.slice(0, MAX_CHUNK_LENGTH));
      current = current.slice(MAX_CHUNK_LENGTH);
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function splitVernacularSegments(text, kind = 'prose') {
  return splitReadingParagraphs(text, kind).flatMap(paragraph => paragraph);
}

function chunkSegments(segments) {
  const chunks = [];
  let current = [];
  let currentLength = 0;

  segments.forEach(segment => {
    if (current.length && currentLength + segment.length > MAX_CHUNK_LENGTH) {
      chunks.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(segment);
    currentLength += segment.length;
  });

  if (current.length) chunks.push(current);
  return chunks;
}

async function translateSegmentChunk(segments, script, signal) {
  const response = await fetch('/api/translate/vernacular', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ segments, script }),
    cache: 'no-store',
    signal
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const error = new Error(payload?.error || `Vernacular translation failed (${response.status})`);
    error.code = payload?.code || 'TRANSLATION_UNAVAILABLE';
    throw error;
  }
  const payload = await response.json();
  if (!Array.isArray(payload?.translations) || payload.translations.length !== segments.length) {
    throw new Error('Vernacular translation alignment failed');
  }
  return payload.translations;
}

export async function translateVernacularLive(text, { script = 'traditional', signal, kind = 'prose' } = {}) {
  const segments = splitVernacularSegments(text, kind);
  if (segments.length === 0) return [];

  const translations = [];
  for (const chunk of chunkSegments(segments)) {
    translations.push(...await translateSegmentChunk(chunk, script, signal));
  }
  return segments.map((source, index) => ({ source, translation: translations[index] }));
}
