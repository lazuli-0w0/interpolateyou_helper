import { ichingSourceUrl } from './ichingSources.js';

// Register a source here once. The Settings > References page and inline
// citations read from this catalogue; social/contact links are not sources.
export const BASE_REFERENCES = [
  { id: 'moedict', group: 'words', useKey: 'references.use.meanings', title: 'g0v / moedict-data', url: 'https://github.com/g0v/moedict-data' },
  { id: 'cantoneseBooks', group: 'words', useKey: 'references.use.cantonese', title: 'jyutnet / cantonese-books-data', url: 'https://github.com/jyutnet/cantonese-books-data' },
  { id: 'tshetUinh', group: 'words', useKey: 'references.use.fanqie', title: 'TshetUinh.js', url: 'https://github.com/nk2028/tshet-uinh-js' },
  { id: 'chinesePoetry', group: 'literature', useKey: 'references.use.poetry', title: 'chinese-poetry', url: 'https://github.com/chinese-poetry/chinese-poetry' },
  { id: 'chineseNovel', group: 'literature', useKey: 'references.use.novel', title: 'chinese-novel', url: 'https://github.com/luoxuhai/chinese-novel' },
  { id: 'qindingCipu', group: 'literature', useKey: 'references.use.cipou', title: '《欽定詞譜》', url: 'https://ctext.org/wiki.pl?if=gb&res=282768' },
  { id: 'cipouExperience', group: 'literature', useKey: 'references.use.cipou', title: '站長個人經驗與整理', url: null, local: true },
  { id: 'ichingPages', group: 'iching', useKey: 'references.use.ichingText', title: '站長整理的《I Ching.pages》', url: null, local: true },
  { id: 'ichingIndex', group: 'iching', useKey: 'references.use.ichingParaphrase', title: '易學界 · 六十四卦', url: 'https://www.yilusoso.com/lssg/842/' },
  { id: 'zhuXiRules', group: 'iching', useKey: 'references.use.ichingRules', title: '《易學啓蒙通釋・考變占第四》', url: 'https://www.shidianguji.com/zh/book/SK0061/chapter/1l9qr24ok8562' },
  { id: 'myMemory', group: 'services', useKey: 'references.use.liveTranslation', title: 'MyMemory Translation API', url: 'https://mymemory.translated.net/doc/spec.php' }
];

export function referenceUrl(id, { hexagramNumber } = {}) {
  if (id === 'ichingArticle') return ichingSourceUrl(hexagramNumber);
  return BASE_REFERENCES.find(reference => reference.id === id)?.url || null;
}

export function allReferences() {
  return BASE_REFERENCES;
}

export function referenceStats(references = allReferences()) {
  return {
    total: references.length,
    linked: references.filter(reference => reference.url).length,
    local: references.filter(reference => reference.local).length
  };
}
