import {
  READING_NOTES_STORAGE_KEY,
  addReadingNote,
  createReadingNote,
  loadReadingNotes,
  saveReadingNotes
} from './readingNotes.js';

describe('reading notes', () => {
  beforeEach(() => window.localStorage.clear());

  test('keeps the selected text and the annotation written by the user', () => {
    const note = createReadingNote({
      text: '  床前明月光  ',
      annotation: 'Remember this image.',
      source: { title: '靜夜思', author: '李白', type: 'poetry' }
    });

    expect(note.text).toBe('床前明月光');
    expect(note.annotation).toBe('Remember this image.');
    expect(note.source).toEqual(expect.objectContaining({ title: '靜夜思', author: '李白', type: 'poetry' }));
  });

  test('allows a note without a personal annotation', () => {
    expect(createReadingNote({ text: '明月' }).annotation).toBe('');
  });

  test('persists notes under a separate versioned key', () => {
    const notes = addReadingNote([], { text: '明月' });
    saveReadingNotes(notes);

    expect(loadReadingNotes()).toHaveLength(1);
    expect(window.localStorage.getItem(READING_NOTES_STORAGE_KEY)).not.toBeNull();
  });
});
