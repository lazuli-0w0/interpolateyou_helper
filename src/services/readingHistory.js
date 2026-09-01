export const READING_HISTORY_STORAGE_KEY = 'interpolateyou:reading-history:v1';
export const MAX_READING_HISTORY_ITEMS = 50;

const ROUTE_BY_ITEM_TYPE = {
  word: 'words',
  poetry: 'poetry',
  'novel-book': 'novels',
  'novel-chapter': 'novels',
  cipou: 'cipou'
};

function getEntryIdentity(item) {
  return item?.literatureId ?? item?.id ?? item?.text ?? item?.name ?? item?.title;
}

export function createReadingHistoryEntry(item, fallbackView) {
  if (!item) return null;

  const itemType = item.type || fallbackView;
  const identity = getEntryIdentity(item);
  const view = ROUTE_BY_ITEM_TYPE[itemType] || fallbackView;
  if (identity == null || identity === '' || !view) return null;

  return {
    id: `${itemType}:${identity}`,
    view,
    item: {
      id: item.id,
      literatureId: item.literatureId,
      type: itemType,
      text: item.text,
      title: item.title,
      name: item.name,
      author: item.author,
      dynasty: item.dynasty,
      work: item.work,
      category: item.category,
      kindLabel: item.kindLabel,
      preview: item.preview,
      content: item.literatureId == null && itemType === 'poetry' ? item.content : undefined
    },
    openedAt: new Date().toISOString()
  };
}

export function addReadingHistoryEntry(history, item, fallbackView) {
  const entry = createReadingHistoryEntry(item, fallbackView);
  if (!entry) return history;

  return [entry, ...history.filter(existing => existing.id !== entry.id)]
    .slice(0, MAX_READING_HISTORY_ITEMS);
}

export function loadReadingHistory() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(READING_HISTORY_STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed
        .filter(entry => entry?.id && entry?.view && entry?.item && !Number.isNaN(Date.parse(entry?.openedAt)))
        .slice(0, MAX_READING_HISTORY_ITEMS)
      : [];
  } catch (error) {
    return [];
  }
}

export function saveReadingHistory(history) {
  try {
    window.localStorage.setItem(READING_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    // History remains available for the current session when storage is unavailable.
  }
}

export function clearStoredReadingHistory() {
  try {
    window.localStorage.removeItem(READING_HISTORY_STORAGE_KEY);
  } catch (error) {
    // The in-memory history is still cleared by the caller.
  }
}
