export const READING_NOTES_STORAGE_KEY = 'interpolateyou:reading-notes:v1';
export const MAX_READING_NOTES = 200;

function createNoteId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createReadingNote({ text, annotation = '', source = {} }) {
  const normalizedText = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalizedText) return null;

  const now = new Date().toISOString();
  return {
    id: createNoteId(),
    text: normalizedText.slice(0, 1000),
    annotation: String(annotation || '').trim().slice(0, 4000),
    source: {
      id: source.id,
      literatureId: source.literatureId,
      type: source.type,
      text: source.text,
      name: source.name,
      title: source.title || source.name || source.text || '',
      author: source.author || '',
      dynasty: source.dynasty || '',
      work: source.work || '',
      category: source.category || ''
    },
    createdAt: now,
    updatedAt: now
  };
}

export function addReadingNote(notes, draft) {
  const note = createReadingNote(draft);
  return note ? [note, ...notes].slice(0, MAX_READING_NOTES) : notes;
}

export function loadReadingNotes() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(READING_NOTES_STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed
        .filter(note => note?.id && note?.text && !Number.isNaN(Date.parse(note?.createdAt)))
        .slice(0, MAX_READING_NOTES)
      : [];
  } catch (error) {
    return [];
  }
}

export function saveReadingNotes(notes) {
  try {
    window.localStorage.setItem(READING_NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    // Notes remain available for the current session when storage is unavailable.
  }
}
