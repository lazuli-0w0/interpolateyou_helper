const traditional = {
  eyebrow: 'TESTI CLASSICI', title: '典籍搜尋', mark: '籍', menuDescription: '搜尋典籍原文、語譯與卷次',
  keyword: '關鍵字', placeholder: '書名、作者、原文或語譯', catalogPlaceholder: '搜尋書名、章名；選書後可搜尋正文', book: '典籍', bookFilter: '選擇典籍', allBooks: '全部書目', scope: '搜尋範圍',
  allText: '原文與語譯', original: '原文', translation: '語譯', volume: '卷次', allVolumes: '全部卷次',
  search: '搜尋', volumeCount: '{{count}} 卷', readVolume: '閱讀本卷', resultCount: '{{count}} 個結果',
  empty: '沒有符合的結果', more: '載入更多', back: '返回搜尋', previous: '上一卷', next: '下一卷',
  pending: '尚未翻譯', loading: '載入中…', error: '暫時無法載入典籍', retry: '重試'
};
const simplified = {
  eyebrow: 'TESTI CLASSICI', title: '典籍搜索', mark: '籍', menuDescription: '搜索典籍原文、语译与卷次',
  keyword: '关键词', placeholder: '书名、作者、原文或语译', catalogPlaceholder: '搜索书名、章名；选书后可搜索正文', book: '典籍', bookFilter: '选择典籍', allBooks: '全部书目', scope: '搜索范围',
  allText: '原文与语译', original: '原文', translation: '语译', volume: '卷次', allVolumes: '全部卷次',
  search: '搜索', volumeCount: '{{count}} 卷', readVolume: '阅读本卷', resultCount: '{{count}} 个结果',
  empty: '没有符合的结果', more: '加载更多', back: '返回搜索', previous: '上一卷', next: '下一卷',
  pending: '尚未翻译', loading: '加载中…', error: '暂时无法加载典籍', retry: '重试'
};
const english = {
  eyebrow: 'CLASSICAL TEXTS', title: 'Classical texts', mark: '籍', menuDescription: 'Search originals, translations and volumes',
  keyword: 'Keywords', placeholder: 'Title, author, original or translation', catalogPlaceholder: 'Search titles; select a book to search its text', book: 'Book', bookFilter: 'Select a book', allBooks: 'All titles', scope: 'Search in',
  allText: 'Original and translation', original: 'Original', translation: 'Translation', volume: 'Volume', allVolumes: 'All volumes',
  search: 'Search', volumeCount: '{{count}} volumes', readVolume: 'Read volume', resultCount: '{{count}} results',
  empty: 'No matching results', more: 'Load more', back: 'Back to search', previous: 'Previous volume', next: 'Next volume',
  pending: 'Not yet translated', loading: 'Loading…', error: 'Unable to load classical texts', retry: 'Retry'
};
const italian = {
  eyebrow: 'TESTI CLASSICI', title: 'Testi classici', mark: '籍', menuDescription: 'Cerca testi originali, traduzioni e volumi',
  keyword: 'Parole chiave', placeholder: 'Titolo, autore, originale o traduzione', catalogPlaceholder: 'Cerca i titoli; seleziona un libro per cercare nel testo', book: 'Libro', bookFilter: 'Seleziona un libro', allBooks: 'Tutti i titoli', scope: 'Cerca in',
  allText: 'Originale e traduzione', original: 'Originale', translation: 'Traduzione', volume: 'Volume', allVolumes: 'Tutti i volumi',
  search: 'Cerca', volumeCount: '{{count}} volumi', readVolume: 'Leggi il volume', resultCount: '{{count}} risultati',
  empty: 'Nessun risultato', more: 'Carica altro', back: 'Torna alla ricerca', previous: 'Volume precedente', next: 'Volume successivo',
  pending: 'Non ancora tradotto', loading: 'Caricamento…', error: 'Impossibile caricare i testi classici', retry: 'Riprova'
};
export const CLASSICS_MESSAGES = Object.fromEntries(Object.entries({ 'zh-Hant': traditional, 'zh-Hans': simplified, en: english, it: italian })
  .map(([locale, messages]) => [locale, Object.fromEntries(Object.entries(messages).map(([key, text]) => [`classics.${key}`, text]))]));
