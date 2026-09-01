import { chineseConverter } from './utils/ChineseConverter.js';

export const DEFAULT_LOCALE = 'zh-Hant';

// Add future locales such as English or Italian here and provide a matching
// message dictionary below; the settings UI will render the new option.
export const LOCALE_OPTIONS = [
  {
    value: 'zh-Hant',
    mark: '繁',
    label: '繁體中文',
    secondaryLabel: 'Traditional Chinese',
    descriptionKey: 'settings.language.traditionalDescription'
  },
  {
    value: 'zh-Hans',
    mark: '简',
    label: '简体中文',
    secondaryLabel: 'Simplified Chinese',
    descriptionKey: 'settings.language.simplifiedDescription'
  }
];

const MESSAGES = {
  'zh-Hant': {
    'brand.name': '覺知 你',
    'nav.main': '主選單',
    'nav.tools': '工具',
    'nav.tools.eyebrow': 'TOOLS · 古典中文工具箱',
    'nav.tools.title': '從哪裡開始？',
    'nav.tools.description': '搜尋字詞與作品，閱讀古典小說，也從格律重新認識中文的聲音。',
    'nav.settings': '設定',
    'nav.settings.eyebrow': 'IMPOSTAZIONI PERSONALI',
    'nav.settings.title': '設定你的體驗',
    'nav.settings.description': '集中管理所有工具共用的顯示方式與偏好。',
    'nav.foundersWhy': 'Founder’s Why',
    'nav.credentials': '開啟 Interpolate You 個人連結',

    'tool.words.mark': '字',
    'tool.words.eyebrow': 'Linguistica del lessico · 音義與典籍',
    'tool.words.title': '詞語搜尋',
    'tool.words.description': '從字形、粵拼與普拼，循著聲音找到詞義。',
    'tool.words.menuDescription': '查字義、粵拼、普拼與反切',
    'tool.words.placeholder': '輸入詞語、繁簡體字或粵拼...',
    'tool.poetry.mark': '詩',
    'tool.poetry.eyebrow': 'Poesia del lessico · 歷代詩文',
    'tool.poetry.title': '詩詞搜尋',
    'tool.poetry.description': '以題名、作者或一句詩，翻開歷代中文作品。',
    'tool.poetry.menuDescription': '從題名、作者或詩句尋找全文',
    'tool.poetry.placeholder': '搜尋詩詞...',
    'tool.novels.mark': '卷',
    'tool.novels.eyebrow': 'Finzione del lessico · 古典章回',
    'tool.novels.title': '小說閱讀',
    'tool.novels.description': '從書名、人物與正文，進入古典小說的長卷。',
    'tool.novels.menuDescription': '翻閱古典小說與章回正文',
    'tool.novels.placeholder': '搜尋書名、作者、章回或正文...',
    'tool.cipou.mark': '韻',
    'tool.cipou.eyebrow': 'Prosa del lessico · 詞牌格律',
    'tool.cipou.title': '詞牌搜尋',
    'tool.cipou.description': '查看詞牌變體、平仄格式與歷代例詞。',
    'tool.cipou.menuDescription': '探索詞牌、格律與歷代例詞',
    'tool.cipou.placeholder': '搜尋詞牌...',

    'landing.kicker': 'INTERPOLATE YOU · 覺知 你',
    'landing.titleLineOne': '在一句詩裡，',
    'landing.titleLineTwo': '遇見下一個字。',
    'landing.lead': '查詞、讀詩、翻小說，也沿著格律重新發現中文的聲音。',
    'landing.startPoetry': '開始尋詩',
    'landing.anotherPoem': '換一首詩',
    'landing.featured': '本次詩選',
    'landing.openPoem': '查看《{{title}}》全文',
    'landing.featuredFooter': '從 500 首精選名篇中，遇見不同的詩',
    'landing.openFull': '查看全文',
    'landing.showAnother': '顯示另一首詩',
    'landing.menuLabel': '功能選單',
    'landing.menuTitle': '從哪裡開始？',
    'landing.menuSubtitle': '四種方式，走進古典中文',

    'settings.feature.mark': '文',
    'settings.feature.label': '語言與文字',
    'settings.feature.description': '選擇繁體或簡體中文顯示',
    'settings.page.eyebrow': 'IMPOSTAZIONI PERSONALI',
    'settings.page.title': '設定',
    'settings.page.intro': '一次設定，套用到所有工具。',
    'settings.language.eyebrow': 'LANGUAGE & SCRIPT',
    'settings.language.title': '語言與文字',
    'settings.language.description': '選擇整個使用者介面與搜尋內容的顯示語言。',
    'settings.language.groupLabel': '介面顯示語言',
    'settings.language.traditionalDescription': '以繁體中文顯示整個使用者介面與搜尋內容。',
    'settings.language.simplifiedDescription': '以簡體中文顯示整個使用者介面與搜尋內容。',

    'search.loading': '搜尋中...',
    'search.action': '🔍 搜尋',
    'search.rhymeFilter': '🎵 韻格分類篩選（可多選）：',
    'search.clearFilters': '清除所有篩選',
    'search.clear': '✕ 清除',
    'search.selectedFilters': '已選擇 {{count}} 個韻格分類',
    'search.progress': '搜尋進度：{{progress}}%',
    'search.statusUnavailable': '資料暫時無法載入',
    'search.statusQuery': '「{{query}}」找到 {{count}} 個結果',
    'search.statusLoaded': '已載入 {{total}} 個項目，顯示 {{count}} 個',
    'search.statusLoading': '正在載入資料...',
    'search.jyutping': '粵拼：',
    'search.mandarin': '普拼：',
    'search.qieyun': '切韻：'
  },
  'zh-Hans': {
    'brand.name': '覺知 你',
    'nav.main': '主菜单',
    'nav.tools': '工具',
    'nav.tools.eyebrow': 'TOOLS · 古典中文工具箱',
    'nav.tools.title': '从哪里开始？',
    'nav.tools.description': '搜索字词与作品，阅读古典小说，也从格律重新认识中文的声音。',
    'nav.settings': '设置',
    'nav.settings.eyebrow': 'IMPOSTAZIONI PERSONALI',
    'nav.settings.title': '设置你的体验',
    'nav.settings.description': '集中管理所有工具共用的显示方式与偏好。',
    'nav.foundersWhy': 'Founder’s Why',
    'nav.credentials': '打开 Interpolate You 个人链接',

    'tool.words.mark': '字',
    'tool.words.eyebrow': 'Linguistica del lessico · 音义与典籍',
    'tool.words.title': '词语搜索',
    'tool.words.description': '从字形、粤拼与普拼，循着声音找到词义。',
    'tool.words.menuDescription': '查字义、粤拼、普拼与反切',
    'tool.words.placeholder': '输入词语、繁简体字或粤拼...',
    'tool.poetry.mark': '诗',
    'tool.poetry.eyebrow': 'Poesia del lessico · 历代诗文',
    'tool.poetry.title': '诗词搜索',
    'tool.poetry.description': '以题名、作者或一句诗，翻开历代中文作品。',
    'tool.poetry.menuDescription': '从题名、作者或诗句寻找全文',
    'tool.poetry.placeholder': '搜索诗词...',
    'tool.novels.mark': '卷',
    'tool.novels.eyebrow': 'Finzione del lessico · 古典章回',
    'tool.novels.title': '小说阅读',
    'tool.novels.description': '从书名、人物与正文，进入古典小说的长卷。',
    'tool.novels.menuDescription': '翻阅古典小说与章回正文',
    'tool.novels.placeholder': '搜索书名、作者、章回或正文...',
    'tool.cipou.mark': '韵',
    'tool.cipou.eyebrow': 'Prosa del lessico · 词牌格律',
    'tool.cipou.title': '词牌搜索',
    'tool.cipou.description': '查看词牌变体、平仄格式与历代例词。',
    'tool.cipou.menuDescription': '探索词牌、格律与历代例词',
    'tool.cipou.placeholder': '搜索词牌...',

    'landing.kicker': 'INTERPOLATE YOU · 覺知 你',
    'landing.titleLineOne': '在一句诗里，',
    'landing.titleLineTwo': '遇见下一个字。',
    'landing.lead': '查词、读诗、翻小说，也沿着格律重新发现中文的声音。',
    'landing.startPoetry': '开始寻诗',
    'landing.anotherPoem': '换一首诗',
    'landing.featured': '本次诗选',
    'landing.openPoem': '查看《{{title}}》全文',
    'landing.featuredFooter': '从 500 首精选名篇中，遇见不同的诗',
    'landing.openFull': '查看全文',
    'landing.showAnother': '显示另一首诗',
    'landing.menuLabel': '功能菜单',
    'landing.menuTitle': '从哪里开始？',
    'landing.menuSubtitle': '四种方式，走进古典中文',

    'settings.feature.mark': '文',
    'settings.feature.label': '语言与文字',
    'settings.feature.description': '选择繁体或简体中文显示',
    'settings.page.eyebrow': 'IMPOSTAZIONI PERSONALI',
    'settings.page.title': '设置',
    'settings.page.intro': '一次设置，应用到所有工具。',
    'settings.language.eyebrow': 'LANGUAGE & SCRIPT',
    'settings.language.title': '语言与文字',
    'settings.language.description': '选择整个用户界面与搜索内容的显示语言。',
    'settings.language.groupLabel': '界面显示语言',
    'settings.language.traditionalDescription': '以繁体中文显示整个用户界面与搜索内容。',
    'settings.language.simplifiedDescription': '以简体中文显示整个用户界面与搜索内容。',

    'search.loading': '搜索中...',
    'search.action': '🔍 搜索',
    'search.rhymeFilter': '🎵 韵格分类筛选（可多选）：',
    'search.clearFilters': '清除所有筛选',
    'search.clear': '✕ 清除',
    'search.selectedFilters': '已选择 {{count}} 个韵格分类',
    'search.progress': '搜索进度：{{progress}}%',
    'search.statusUnavailable': '数据暂时无法加载',
    'search.statusQuery': '“{{query}}”找到 {{count}} 个结果',
    'search.statusLoaded': '已加载 {{total}} 个项目，显示 {{count}} 个',
    'search.statusLoading': '正在加载数据...',
    'search.jyutping': '粤拼：',
    'search.mandarin': '普拼：',
    'search.qieyun': '切韵：'
  }
};

export function normalizeLocale(value) {
  if (value === 'simplified') return 'zh-Hans';
  if (value === 'traditional') return 'zh-Hant';
  return MESSAGES[value] ? value : DEFAULT_LOCALE;
}

export function createTranslator(locale) {
  const normalizedLocale = normalizeLocale(locale);
  return (key, variables = {}) => {
    const template = MESSAGES[normalizedLocale]?.[key] ?? MESSAGES[DEFAULT_LOCALE]?.[key] ?? key;
    return Object.entries(variables).reduce(
      (message, [name, value]) => message.replaceAll(`{{${name}}}`, String(value)),
      template
    );
  };
}

export function convertContentForLocale(text, locale) {
  if (!text) return text;
  const normalizedLocale = normalizeLocale(locale);
  if (normalizedLocale === 'zh-Hans') return chineseConverter.convertText(text, 'simplified');
  if (normalizedLocale === 'zh-Hant') return chineseConverter.convertText(text, 'traditional');
  return text;
}

export function getDocumentLanguage(locale) {
  return normalizeLocale(locale);
}
