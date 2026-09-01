import {
  READING_HISTORY_STORAGE_KEY,
  addReadingHistoryEntry,
  clearStoredReadingHistory,
  createReadingHistoryEntry,
  loadReadingHistory,
  saveReadingHistory
} from './readingHistory.js';

describe('reading history', () => {
  beforeEach(() => window.localStorage.clear());

  test('stores a compact literary snapshot without the full body', () => {
    const entry = createReadingHistoryEntry({
      id: 'literature-12',
      literatureId: 12,
      type: 'poetry',
      title: '靜夜思',
      author: '李白',
      content: 'a very long body'
    }, 'poetry');

    expect(entry.view).toBe('poetry');
    expect(entry.item.title).toBe('靜夜思');
    expect(entry.item.content).toBeUndefined();
  });

  test('moves an opened entry to the front without duplicating it', () => {
    const first = { id: 1, type: 'word', text: '春' };
    const second = { id: 2, type: 'word', text: '秋' };
    const history = addReadingHistoryEntry(addReadingHistoryEntry([], first, 'words'), second, 'words');
    const reopened = addReadingHistoryEntry(history, first, 'words');

    expect(reopened.map(entry => entry.item.text)).toEqual(['春', '秋']);
  });

  test('persists, restores and clears valid history', () => {
    const history = addReadingHistoryEntry([], { id: 1, type: 'word', text: '春' }, 'words');
    saveReadingHistory(history);

    expect(loadReadingHistory()).toHaveLength(1);
    clearStoredReadingHistory();
    expect(window.localStorage.getItem(READING_HISTORY_STORAGE_KEY)).toBeNull();
  });
});
