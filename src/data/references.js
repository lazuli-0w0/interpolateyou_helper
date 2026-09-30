import { ichingSourceUrl } from './ichingSources.js';

// Register each source once for the Settings > References page.
// Social and contact links are not references.
export const BASE_REFERENCES = [
  { id: 'moedict', group: 'words', useKey: 'references.use.meanings', title: 'g0v / moedict-data', url: 'https://github.com/g0v/moedict-data' },
  { id: 'cantoneseBooks', group: 'words', useKey: 'references.use.cantonese', title: 'jyutnet / cantonese-books-data', url: 'https://github.com/jyutnet/cantonese-books-data' },
  { id: 'tshetUinh', group: 'words', useKey: 'references.use.fanqie', title: 'TshetUinh.js', url: 'https://github.com/nk2028/tshet-uinh-js' },
  { id: 'chinesePoetry', group: 'literature', useKey: 'references.use.poetry', title: 'chinese-poetry', url: 'https://github.com/chinese-poetry/chinese-poetry' },
  { id: 'chineseNovel', group: 'literature', useKey: 'references.use.novel', title: 'chinese-novel', url: 'https://github.com/luoxuhai/chinese-novel' },
  { id: 'niutransClassics', group: 'literature', useKey: 'references.use.classics', title: 'NiuTrans / Classical-Modern', url: 'https://github.com/NiuTrans/Classical-Modern' },
  { id: 'niutransSources', group: 'literature', useKey: 'references.use.classics', title: 'NiuTrans · 雙語資料與逐篇來源', url: 'https://github.com/NiuTrans/Classical-Modern/tree/main/%E5%8F%8C%E8%AF%AD%E6%95%B0%E6%8D%AE' },
  { id: 'niutransLicense', group: 'literature', useKey: 'references.use.classics', title: 'NiuTrans · MIT License', url: 'https://github.com/NiuTrans/Classical-Modern/blob/main/LICENSE' },
  { id: 'songLunText', group: 'literature', useKey: 'references.use.classics', title: '《宋論》· 維基文庫', url: 'https://zh.wikisource.org/zh-hant/%E5%AE%8B%E8%AB%96' },
  { id: 'beimengText', group: 'literature', useKey: 'references.use.classics', title: '《三朝北盟會編》· 維基文庫', url: 'https://zh.wikisource.org/zh-hant/%E4%B8%89%E6%9C%9D%E5%8C%97%E7%9B%9F%E6%9C%83%E7%B7%A8' },
  { id: 'songLunStudy', group: 'literature', useKey: 'references.use.classics', title: '《王夫之〈易〉史互證中的經世思想》· 臺灣師範大學', url: 'https://www.ch.ntnu.edu.tw/SIS/downloadfile.php?issue_id=11&paper_id=46&periodicalsDir=DESC&periodicalsOrder=Sorter_issue_ch' },
  { id: 'analectsText', group: 'literature', useKey: 'references.use.classics', title: '《論語·學而》· 維基文庫', url: 'https://zh.wikisource.org/zh-hant/%E8%AB%96%E8%AA%9E/%E5%AD%B8%E8%80%8C%E7%AC%AC%E4%B8%80' },
  { id: 'sunziText', group: 'literature', useKey: 'references.use.classics', title: '《孫子兵法》· 維基文庫', url: 'https://zh.wikisource.org/zh-hant/%E5%AD%AB%E5%AD%90%E5%85%B5%E6%B3%95' },
  { id: 'laoziStudy', group: 'literature', useKey: 'references.use.classics', title: '《老子道德經校釋》· 中國哲學書電子化計劃', url: 'https://ctext.org/wiki.pl?chapter=373803&if=gb' },
  { id: 'qindingCipu', group: 'literature', useKey: 'references.use.cipou', title: '《欽定詞譜》', url: 'https://ctext.org/wiki.pl?if=gb&res=282768' },
  { id: 'cipouExperience', group: 'literature', useKey: 'references.use.cipou', title: '站長個人經驗與整理', url: null, local: true },
  { id: 'ichingPages', group: 'iching', useKey: 'references.use.ichingText', title: '站長整理的《I Ching.pages》', url: null, local: true },
  { id: 'ichingIndex', group: 'iching', useKey: 'references.use.ichingParaphrase', title: '易學界 · 六十四卦', url: 'https://www.yilusoso.com/lssg/842/' },
  { id: 'ichingSupplementalLine', group: 'iching', useKey: 'references.use.ichingSupplementalLine', title: '易學界 · 噬嗑初九', url: ichingSourceUrl(21) },
  { id: 'zhuXiRules', group: 'iching', useKey: 'references.use.ichingRules', title: '《易學啓蒙通釋・考變占第四》', url: 'https://www.shidianguji.com/zh/book/SK0061/chapter/1l9qr24ok8562' },
  { id: 'myMemory', group: 'services', useKey: 'references.use.liveTranslation', title: 'MyMemory Translation API', url: 'https://mymemory.translated.net/doc/spec.php' }
];

// Outbound product, contact and document links are displayed only on References.
// They are separate from the source inventory and its statistics.
export const SITE_LINKS = [
  { id: 'linktree', title: 'Interpolate You · Linktree', useKey: 'references.link.profile', url: 'https://linktr.ee/interpolateyou' },
  { id: 'patreon', title: 'Interpolate You · Patreon', useKey: 'references.link.patreon', url: 'https://patreon.com/interpolateyou' },
  { id: 'instagram', title: 'Instagram · shadow_lazuli', useKey: 'references.link.instagram', url: 'https://www.instagram.com/shadow_lazuli' },
  { id: 'whatsapp', title: 'WhatsApp · 詩經啤牌', useKey: 'references.link.whatsapp', url: 'https://wa.me/68993141' },
  { id: 'readingNotesPdf', title: '《輕文釋註—短寓其一》PDF', useKey: 'references.link.document', url: encodeURI('/輕文釋註—短寓其一.pdf') }
];

export function siteLinkUrl(id) {
  return SITE_LINKS.find(link => link.id === id)?.url || null;
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
