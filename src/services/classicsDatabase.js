let worker;
let sequence = 0;
const pending = new Map();
function resetWorker(error) {
  worker?.terminate();
  worker = null;
  pending.forEach(({ reject, timer }) => { clearTimeout(timer); reject(error); });
  pending.clear();
}
function request(action, options) {
  return new Promise((resolve, reject) => {
    if (!worker) {
      try { worker = new Worker(`${process.env.PUBLIC_URL || ''}/data/classics/search-worker.js`); }
      catch (error) { reject(error); return; }
      worker.onmessage = ({ data }) => {
        const entry = pending.get(data.id);
        if (!entry) return;
        clearTimeout(entry.timer);
        pending.delete(data.id);
        if (data.error) entry.reject(new Error(data.error)); else entry.resolve(data.result);
      };
      worker.onerror = () => resetWorker(new Error('Database worker unavailable'));
    }
    const id = ++sequence;
    const timer = setTimeout(() => resetWorker(new Error('Database request timed out')), 60000);
    pending.set(id, { resolve, reject, timer });
    worker.postMessage({ id, action, options });
  });
}
export const loadClassicsCatalog = () => request('catalog');
export const searchClassics = options => request('search', options);
export const loadClassicChapter = (bookId, volume) => request('chapter', { bookId, volume });

export const searchClassicChapters = options => request('search-chapters', options);
