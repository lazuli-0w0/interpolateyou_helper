import { loadClassicsCatalog, loadClassicChapter, searchClassicChapters } from './classicsDatabase.js';
import { chineseConverter } from '../utils/ChineseConverter.js';

export async function loadClassicBooks() {
  const catalog = await loadClassicsCatalog();
  const chaptersByBook = new Map();
  catalog.chapters.forEach(chapter => {
    if (!chaptersByBook.has(chapter.book_id)) chaptersByBook.set(chapter.book_id, []);
    chaptersByBook.get(chapter.book_id).push(chapter);
  });
  return catalog.books.map(book => ({
    ...book, id: `classic-book:${book.id}`, bookId: book.id,
    type: 'classic-book', category: '典籍', kindLabel: '典籍',
    chapters: (chaptersByBook.get(book.id) || []).map(chapter => ({
      id: `classic-chapter:${book.id}:${chapter.volume}`, bookId: book.id,
      volume: chapter.volume, title: chapter.title,
      author: book.author, work: book.title, category: '典籍', type: 'classic-chapter'
    }))
  }));
}

export async function searchClassicLiterature(query, loadedCount = 0, maxLoad = 1000, bookId = '*') {
  const [books, rows] = await Promise.all([
    loadClassicBooks(), searchClassicChapters({ bookId, query, scope: 'all' })
  ]);
  const normalize = value => String(chineseConverter.isLoaded ? chineseConverter.convertText(value, 'simplified') : value).normalize('NFKC').replace(/\s/g, '').toLowerCase();
  const term = normalize(query);
  const matches = books.filter(book => (bookId === '*' || book.bookId === bookId)
    && normalize([book.title, book.author].join(' ')).includes(term));
  const chapters = rows.map(row => {
    const book = books.find(item => item.bookId === row.book_id);
    const chapter = book?.chapters.find(item => item.volume === row.volume);
    return chapter && { ...chapter, preview: row.original.slice(0, 140), translationPreview: row.translation };
  }).filter(Boolean);
  const combined = [...matches, ...chapters];
  const results = combined.slice(loadedCount, maxLoad);
  return { results, hasMore: maxLoad < combined.length, totalMatches: combined.length };
}

export async function loadClassicEntry(item) {
  if (item.type === 'classic-book') {
    return (await loadClassicBooks()).find(book => book.id === item.id) || item;
  }
  const sentences = await loadClassicChapter(item.bookId, item.volume);
  const paragraphs = [];
  let previous;
  sentences.forEach(sentence => {
    if (sentence.paragraph !== previous) paragraphs.push('');
    paragraphs[paragraphs.length - 1] += sentence.original;
    previous = sentence.paragraph;
  });
  return { ...item, sentences, content: paragraphs.join('\n\n') };
}
