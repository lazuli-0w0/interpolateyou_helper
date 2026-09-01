import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppNavigation } from './components/AppNavigation.js';
import { LandingPage } from './components/LandingPage.js';
import { ResultModal } from './components/ResultModal.js';
import { SettingsPage } from './components/SettingsPage.js';
import { FoundersWhyPage } from './components/FoundersWhyPage.js';
import { ProductPage } from './components/ProductPage.js';
import { ForumPage } from './components/ForumPage.js';
import { ReadingHistoryPage } from './components/ReadingHistoryPage.js';
import { ReadingNotesPage } from './components/ReadingNotesPage.js';
import { chineseConverter } from './utils/ChineseConverter.js';
import { createTranslator, DEFAULT_LOCALE, getDocumentLanguage, normalizeLocale } from './i18n.js';
import {
  getPreferredMeanings,
  getWordSearchRank,
  matchesSearchName,
  matchesWordSearch,
  mergeUniqueResults
} from './utils/search.js';
import { dataManager } from './services/DataManager.js';
import {
  addReadingHistoryEntry,
  clearStoredReadingHistory,
  loadReadingHistory,
  saveReadingHistory
} from './services/readingHistory.js';
import { addReadingNote, loadReadingNotes, saveReadingNotes } from './services/readingNotes.js';
import './App.css';

const VIEW_CONFIG = {
  words: {
    eyebrowKey: 'tool.words.eyebrow',
    titleKey: 'tool.words.title',
    descriptionKey: 'tool.words.description',
    markKey: 'tool.words.mark',
    placeholderKey: 'tool.words.placeholder',
    getStaticData: () => dataManager.getStaticWords()
  },
  poetry: {
    eyebrowKey: 'tool.poetry.eyebrow',
    titleKey: 'tool.poetry.title',
    descriptionKey: 'tool.poetry.description',
    markKey: 'tool.poetry.mark',
    placeholderKey: 'tool.poetry.placeholder',
    getStaticData: () => dataManager.getStaticPoetry()
  },
  novels: {
    eyebrowKey: 'tool.novels.eyebrow',
    titleKey: 'tool.novels.title',
    descriptionKey: 'tool.novels.description',
    markKey: 'tool.novels.mark',
    placeholderKey: 'tool.novels.placeholder',
    getStaticData: () => []
  },
  cipou: {
    eyebrowKey: 'tool.cipou.eyebrow',
    titleKey: 'tool.cipou.title',
    descriptionKey: 'tool.cipou.description',
    markKey: 'tool.cipou.mark',
    placeholderKey: 'tool.cipou.placeholder',
    getStaticData: () => dataManager.getStaticCipou()
  }
};

const PRODUCT_VIEW_BY_ROUTE = {
  'product-bookmark': 'bookmark',
  'product-cards': 'cards',
  'product-reading-notes': 'reading-notes'
};

const VIEW_BY_ENTRY_TYPE = {
  word: 'words',
  poetry: 'poetry',
  'novel-book': 'novels',
  'novel-chapter': 'novels',
  cipou: 'cipou'
};

async function resolveSavedEntry(snapshot) {
  if (!snapshot) return null;

  if (snapshot.literatureId != null) {
    const [record] = await dataManager.loadLiteratureRecords([snapshot.literatureId]);
    return dataManager.loadLiteratureBody(record || snapshot);
  }

  if (snapshot.type === 'poetry') {
    if (snapshot.content) return snapshot;
    const matches = await dataManager.searchPoetryData(snapshot.title || snapshot.text || '', 0, 200);
    const exactMatch = matches.results.find(item => (
      item.title === snapshot.title && (!snapshot.author || item.author === snapshot.author)
    ));
    return dataManager.loadLiteratureBody(exactMatch || matches.results[0] || snapshot);
  }

  if (snapshot.type === 'novel-chapter') {
    const matches = await dataManager.searchNovelData(snapshot.title || '', 0, 200);
    const exactMatch = matches.results.find(item => (
      item.type === 'novel-chapter' && item.title === snapshot.title &&
      (!snapshot.author || item.author === snapshot.author)
    ));
    return dataManager.loadLiteratureBody(exactMatch || snapshot);
  }

  if (snapshot.type === 'novel-book') {
    const books = await dataManager.loadNovelsData();
    return books.find(book => (
      String(book.id) === String(snapshot.id) || book.title === snapshot.title
    )) || snapshot;
  }

  if (snapshot.type === 'word') {
    const words = await dataManager.loadWordsData();
    return words.find(word => (
      String(word.id) === String(snapshot.id) || word.text === (snapshot.text || snapshot.title)
    )) || snapshot;
  }

  if (snapshot.type === 'cipou') {
    const patterns = await dataManager.loadCipouData();
    return patterns.find(pattern => (
      String(pattern.id) === String(snapshot.id) || pattern.name === (snapshot.name || snapshot.title)
    )) || snapshot;
  }

  return snapshot;
}

const STORAGE_KEYS = {
  locale: 'interpolateyou:locale',
  legacyLocale: 'interpolateyou:language',
  theme: 'interpolateyou:theme'
};

export function getSearchResultTitle(item, type) {
  if (item?.type === 'word' || type === 'words') return item?.text || '';
  if (item?.type === 'cipou' || type === 'cipou') return item?.name || item?.title || '';
  return item?.title || item?.name || item?.text || '';
}

function collectFacetValues(items, valueSelector) {
  const counts = new Map();

  items.forEach(item => {
    const values = valueSelector(item);
    (Array.isArray(values) ? values : [values]).forEach(value => {
      const normalized = typeof value === 'string' ? value.trim() : '';
      if (!normalized || normalized === '未知') return;
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-Hant'))
    .map(([value]) => value);
}

function collectCommonPoetryTerms(items, limit = 60) {
  const counts = new Map();

  items.forEach(item => {
    const termsInWork = new Set();
    const passages = String(item?.content || item?.preview || '').match(/[\u3400-\u9fff]+/g) || [];

    passages.forEach(passage => {
      for (let index = 0; index < passage.length - 1; index += 1) {
        termsInWork.add(passage.slice(index, index + 2));
      }
    });

    termsInWork.forEach(term => counts.set(term, (counts.get(term) || 0) + 1));
  });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-Hant'))
    .slice(0, limit)
    .map(([term]) => term);
}

export function getSearchBrowseGroups(type, data) {
  if (!Array.isArray(data) || data.length === 0) return [];

  if (type === 'words') return [];

  const authorValues = collectFacetValues(data, item => (
    type === 'cipou'
      ? (item.variants || []).map(variant => variant.author)
      : item.author
  ));
  const dynastyValues = type === 'cipou' ? [] : collectFacetValues(data, item => item.dynasty);
  const commonPoetryTerms = type === 'poetry' ? collectCommonPoetryTerms(data) : [];

  return [
    authorValues.length ? { id: 'author', labelKey: 'search.browseAuthor', values: authorValues } : null,
    dynastyValues.length ? { id: 'dynasty', labelKey: 'search.browseDynasty', values: dynastyValues } : null,
    commonPoetryTerms.length ? { id: 'common', labelKey: 'search.browseCommon', values: commonPoetryTerms } : null
  ].filter(Boolean);
}

export function matchesCipouSearch(item, searchVariants) {
  const normalizedVariants = searchVariants.map(value => String(value).trim().toLowerCase());
  return matchesSearchName(item, searchVariants) || (item.variants || []).some(variant => {
    const author = String(variant.author || '').toLowerCase();
    return normalizedVariants.some(value => value && author.includes(value));
  });
}

function AdvancedSearch({
  type,
  staticData,
  locale,
  t,
  initialSelectedItem,
  onInitialItemHandled,
  onEntryOpened,
  onSaveReadingNote
}) {
  const viewConfig = VIEW_CONFIG[type];
  const presentation = {
    eyebrow: t(viewConfig.eyebrowKey),
    title: t(viewConfig.titleKey),
    description: t(viewConfig.descriptionKey),
    mark: t(viewConfig.markKey),
    placeholder: t(viewConfig.placeholderKey)
  };
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedItem, setSelectedItem] = useState(initialSelectedItem || null);
  const [previousNovelItem, setPreviousNovelItem] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [displayCount, setDisplayCount] = useState(20); // 當前顯示的項目數量
  const [resultView, setResultView] = useState('detailed');
  const [browseCategory, setBrowseCategory] = useState('author');
  const [selectedBrowseValues, setSelectedBrowseValues] = useState({});
  const [selectedRhymePatterns, setSelectedRhymePatterns] = useState(new Set()); // 詞牌韻格篩選
  const loadMoreSentinelRef = useRef(null);

  // 詩詞動態載入相關狀態
  const [poetryOverLimit, setPoetryOverLimit] = useState(false); // 是否超過1000項
  const [hasMorePoetry, setHasMorePoetry] = useState(true); // 是否還有更多詩詞可載入

  const itemsPerPage = 20;

  // 韻格選項
  const rhymePatterns = ['平韻格', '仄韻格', '通韻格', '換韻格', '未分類'];

  useEffect(() => {
    if (initialSelectedItem) {
      onEntryOpened(initialSelectedItem, type);
      onInitialItemHandled();
    }
  }, [initialSelectedItem, onEntryOpened, onInitialItemHandled, type]);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setProgress(0);
      setLoadError('');

      try {
        let data = [];

        // 模拟加载进度
        for (let i = 0; i <= 30; i += 10) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (type === 'words') {
          data = await dataManager.loadWordsData();
        } else if (type === 'poetry') {
          data = await dataManager.loadPoetryData();
        } else if (type === 'novels') {
          data = await dataManager.loadNovelsData();
        } else if (type === 'cipou') {
          data = await dataManager.loadCipouData();
        }

        // 完成加载进度
        for (let i = 40; i <= 100; i += 20) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setAllData(data);

        setResults(data);

        setDataLoaded(true);

      } catch (error) {
        console.error('載入數據出錯:', error);
        const fallback = ['poetry', 'novels'].includes(type) ? [] : staticData;
        setAllData(fallback);
        setResults(fallback);
        setDataLoaded(true);
        setLoadError(error.message || '載入失敗');
      } finally {
        setLoading(false);
        setProgress(100);
      }
    };

    loadData();
  }, [type, staticData]);

  // 應用篩選邏輯
  const applyFilters = useCallback((data) => {
    let filteredData = data;

    // 詞牌韻格篩選
    if (type === 'cipou' && selectedRhymePatterns.size > 0) {
      filteredData = filteredData.filter(item =>
        selectedRhymePatterns.has(item.rhymePattern)
      );
    }

    return filteredData;
  }, [type, selectedRhymePatterns]);

  // AI搜索函数
  const handleAdvancedSearch = useCallback(async (searchQuery = query, additionalLoad = 0) => {
    let baseData = allData;
    const browseSelections = Object.entries(selectedBrowseValues)
      .map(([category, values]) => ({ category, values: Array.from(values) }))
      .filter(selection => selection.values.length > 0);
    const hasBrowseSelections = browseSelections.length > 0;

    // 先應用篩選
    baseData = applyFilters(baseData);

    if (!searchQuery.trim() && !hasBrowseSelections) {
      setResults(baseData); // 無搜索時顯示所有篩選後的數據
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      let searchResults = [];

      if ((type === 'poetry' || type === 'novels') && hasBrowseSelections) {
        const searchLiterature = type === 'novels'
          ? dataManager.searchNovelData.bind(dataManager)
          : dataManager.searchPoetryData.bind(dataManager);
        const authorValues = browseSelections.find(selection => selection.category === 'author')?.values || [];
        const dynastyValues = browseSelections.find(selection => selection.category === 'dynasty')?.values || [];
        const commonValues = browseSelections.find(selection => selection.category === 'common')?.values || [];
        const queryGroups = [];

        if (searchQuery.trim()) queryGroups.push([searchQuery.trim()]);
        if (commonValues.length) queryGroups.push(commonValues);
        if (!queryGroups.length && authorValues.length) queryGroups.push(authorValues);
        if (!queryGroups.length && dynastyValues.length) queryGroups.push(dynastyValues);

        setProgress(30);
        const groupResults = await Promise.all(queryGroups.map(async terms => {
          const searches = await Promise.all(terms.map(term => searchLiterature(term, 0, 5000)));
          return searches.reduce((combined, result) => mergeUniqueResults(combined, result.results), []);
        }));
        const resultKey = item => String(item.literatureId ?? item.id);
        searchResults = groupResults[0] || [];

        groupResults.slice(1).forEach(group => {
          const allowed = new Set(group.map(resultKey));
          searchResults = searchResults.filter(item => allowed.has(resultKey(item)));
        });
        if (authorValues.length) {
          searchResults = searchResults.filter(item => authorValues.includes(item.author));
        }
        if (dynastyValues.length) {
          searchResults = searchResults.filter(item => dynastyValues.includes(item.dynasty));
        }
        setPoetryOverLimit(false);
        setHasMorePoetry(false);
      } else if (type === 'poetry' || type === 'novels') {
        // 詩詞與小說均使用分片文學索引。
        const currentResultsCount = additionalLoad > 0 ? results.length : 0;
        const maxLoad = currentResultsCount + (additionalLoad || 1000);

        setProgress(30);
        const poetrySearchResult = type === 'novels'
          ? await dataManager.searchNovelData(searchQuery, currentResultsCount, maxLoad)
          : await dataManager.searchPoetryData(searchQuery, currentResultsCount, maxLoad);

        if (additionalLoad > 0) {
          // 追加載入模式
          searchResults = mergeUniqueResults(results, poetrySearchResult.results);
        } else {
          // 新搜索模式
          searchResults = poetrySearchResult.results;
        }

        // Only offer another page when the corpus scan found another match.
        setPoetryOverLimit(poetrySearchResult.hasMore);
        setHasMorePoetry(poetrySearchResult.hasMore);

      } else {
        const searchVariants = dataManager.generateSearchVariants(searchQuery.toLowerCase());
        setProgress(70);
        if (type === 'words') {
          searchResults = baseData
            .filter(item => matchesWordSearch(item, searchVariants, searchQuery))
            .sort((left, right) => {
              const rankDifference = getWordSearchRank(right, searchVariants, searchQuery) -
                getWordSearchRank(left, searchVariants, searchQuery);
              return rankDifference || (right.score || 0) - (left.score || 0);
            });
        } else if (type === 'cipou') {
          searchResults = searchQuery.trim()
            ? baseData.filter(item => matchesCipouSearch(item, searchVariants))
            : baseData;
        } else {
          searchResults = baseData.filter(item => matchesSearchName(item, searchVariants));
        }
      }

      if (type === 'cipou' && hasBrowseSelections) {
        const authorValues = browseSelections.find(selection => selection.category === 'author')?.values || [];
        if (authorValues.length) {
          searchResults = searchResults.filter(item => (
            item.variants || []
          ).some(variant => authorValues.includes(variant.author)));
        }
      }

      setResults(searchResults);

    } catch (error) {
      console.error('搜索出错:', error);
      setResults([]);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }, [allData, applyFilters, query, results, selectedBrowseValues, type]);

  // 僅用於篩選條件改變的搜索函數


  // 顯示項目計算
  const currentItems = results.slice(0, displayCount); // 顯示從開頭到當前顯示數量的項目
  const browseGroups = useMemo(() => getSearchBrowseGroups(type, allData), [allData, type]);
  const activeBrowseGroup = browseGroups.find(group => group.id === browseCategory) || browseGroups[0];
  const selectedBrowseCount = Object.values(selectedBrowseValues)
    .reduce((count, values) => count + values.size, 0);

  // 轉換文本的輔助函數
  const convertText = (text) => {
    if (!text || !chineseConverter.isLoaded) return text;
    const script = locale === 'zh-Hans' ? 'simplified' : 'traditional';
    return chineseConverter.convertText(text, script);
  };

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || displayCount >= results.length || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      setDisplayCount(current => Math.min(current + itemsPerPage, results.length));
    }, { rootMargin: '280px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayCount, results.length]);

  const handleBrowseToggle = useCallback((value, category) => {
    setSelectedBrowseValues(previous => {
      const next = { ...previous };
      const categoryValues = new Set(next[category] || []);
      if (categoryValues.has(value)) categoryValues.delete(value);
      else categoryValues.add(value);
      next[category] = categoryValues;
      return next;
    });
  }, []);

  // 載入更多詩詞 (1000項或全部)
  const loadMorePoetry = async (loadAll = false) => {
    if (!['poetry', 'novels'].includes(type) || loading) return;

    try {
      setLoading(true);
      const currentCount = results.length;
      const additionalLoad = loadAll ? 999999 : 1000;

      // 使用當前已載入的數量作為起始點，載入更多詩詞
      const searchResults = type === 'novels'
        ? await dataManager.searchNovelData(query, currentCount, currentCount + additionalLoad)
        : await dataManager.searchPoetryData(query, currentCount, currentCount + additionalLoad);

      if (searchResults && searchResults.results) {
        // 合併新結果到現有結果
        const newResults = mergeUniqueResults(results, searchResults.results);
        setResults(newResults);
        setDisplayCount(20); // 重置顯示數量為前20項

        // 檢查是否還有更多結果可載入
        const hasMoreResults = searchResults.hasMore;
        setHasMorePoetry(hasMoreResults);
        setPoetryOverLimit(hasMoreResults);

        console.log(`📚 載入更多詩詞完成：新增 ${searchResults.results.length} 首，總計 ${newResults.length} 首，還有更多: ${hasMoreResults}`);
      }
    } catch (error) {
      console.error('載入更多詩詞失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置搜索時重置顯示數量
  useEffect(() => {
    setDisplayCount(20);
  }, [results]);

  // 篩選條件改變時重新應用篩選到當前結果
  useEffect(() => {
    if (dataLoaded && allData.length > 0) {
      const filteredData = applyFilters(allData);
      if (!query.trim()) {
        setResults(filteredData);
      } else if (type === 'cipou') {
        const searchVariants = dataManager.generateSearchVariants(query.toLowerCase());
        setResults(filteredData.filter(item => matchesCipouSearch(item, searchVariants)));
      }
    }
  }, [selectedRhymePatterns, allData, dataLoaded, query, applyFilters, type]);

  // 韻格篩選處理函數
  const handleRhymePatternToggle = (pattern) => {
    setSelectedRhymePatterns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pattern)) {
        newSet.delete(pattern);
      } else {
        newSet.add(pattern);
      }
      return newSet;
    });
  };

  // 加载项目详情 (按需加载)
  const loadItemDetails = useCallback(async (item) => {
    setPreviousNovelItem(null);
    if (item.type === 'poetry' || item.type === 'novel-chapter') {
      setLoading(true);
      try {
        const loadedItem = await dataManager.loadLiteratureBody(item);
        setSelectedItem(loadedItem);
        onEntryOpened(loadedItem, type);
      } finally {
        setLoading(false);
      }
      return;
    }
    setSelectedItem(item);
    onEntryOpened(item, type);
  }, [onEntryOpened, type]);

  const loadNovelChapter = useCallback(async (chapterId) => {
    setPreviousNovelItem(selectedItem?.type === 'novel-book' ? selectedItem : null);
    setLoading(true);
    try {
      const [chapter] = await dataManager.loadLiteratureRecords([chapterId]);
      const loadedChapter = await dataManager.loadLiteratureBody(chapter);
      setSelectedItem(loadedChapter);
      onEntryOpened(loadedChapter, type);
    } finally {
      setLoading(false);
    }
  }, [onEntryOpened, selectedItem, type]);

  const closeSelectedItem = useCallback(() => {
    setSelectedItem(null);
    setPreviousNovelItem(null);
  }, []);

  const returnFromNovelChapter = useCallback(() => {
    setSelectedItem(previousNovelItem);
    setPreviousNovelItem(null);
  }, [previousNovelItem]);

  return (
    <main className={`search-page search-page-${type}`}>
      <div className="search-page-orb search-page-orb-one" aria-hidden="true" />
      <div className="search-page-orb search-page-orb-two" aria-hidden="true" />
      <div className="search-page-inner">
        <header className="search-page-header">
          <div>
            <p className="search-page-eyebrow">{presentation.eyebrow}</p>
            <h1>{presentation.title}</h1>
            <p className="search-page-description">{presentation.description}</p>
          </div>
          <div className="search-page-mark" aria-hidden="true">{presentation.mark}</div>
        </header>

        <section className="search-workspace" aria-label={presentation.title}>
      {/* 搜索区域 */}
      <div className="search-controls-panel">
        <div className="search-controls">
          <input
            className="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={presentation.placeholder}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              handleAdvancedSearch(query);
            }}
            disabled={loading}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            className="search-submit-button"
            onClick={() => {
              setPoetryOverLimit(false);
              setHasMorePoetry(true);
              handleAdvancedSearch(query);
            }}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#ccc' : '#3faaff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? t('search.loading') : t('search.action')}
          </button>
        </div>

        {/* 詞牌韻格篩選 */}
        {type === 'cipou' && (
          <div className="rhyme-filter">
            <div className="rhyme-filter-title" style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              {t('search.rhymeFilter')}
            </div>
            <div className="rhyme-filter-options" style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              {rhymePatterns.map(pattern => (
                <label
                  key={pattern}
                  className={`rhyme-filter-option ${selectedRhymePatterns.has(pattern) ? 'selected' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: selectedRhymePatterns.has(pattern) ? '#e3f2fd' : '#f5f5f5',
                    border: selectedRhymePatterns.has(pattern) ? '2px solid #2196f3' : '2px solid #ddd',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: selectedRhymePatterns.has(pattern) ? 'bold' : 'normal',
                    color: selectedRhymePatterns.has(pattern) ? '#1976d2' : '#666',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedRhymePatterns.has(pattern)) {
                      e.currentTarget.style.background = '#e8f4f8';
                      e.currentTarget.style.borderColor = '#81c784';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedRhymePatterns.has(pattern)) {
                      e.currentTarget.style.background = '#f5f5f5';
                      e.currentTarget.style.borderColor = '#ddd';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRhymePatterns.has(pattern)}
                    onChange={() => handleRhymePatternToggle(pattern)}
                    style={{
                      margin: 0,
                      transform: 'scale(1.1)'
                    }}
                  />
                  <span>{convertText(pattern)}</span>
                </label>
              ))}

              {/* 清除篩選按鈕 */}
              {selectedRhymePatterns.size > 0 && (
                <button
                  className="rhyme-filter-clear"
                  onClick={() => setSelectedRhymePatterns(new Set())}
                  style={{
                    padding: '4px 8px',
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                  title={t('search.clearFilters')}
                >
                  {t('search.clear')}
                </button>
              )}
            </div>

            {/* 篩選統計 */}
            {selectedRhymePatterns.size > 0 && (
              <div className="rhyme-filter-summary" style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '6px'
              }}>
                {t('search.selectedFilters', { count: selectedRhymePatterns.size })}
              </div>
            )}
          </div>
        )}

        {/* 进度条 */}
        {loading && (
          <div className="search-progress">
            <div className="search-progress-track" style={{
              width: '100%',
              height: '4px',
              background: '#f0f0f0',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div className="search-progress-value" style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #90ffbb, #90ffcc)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div className="search-progress-label">
              {t('search.progress', { progress: Math.round(progress) })}
            </div>
          </div>
        )}

        {/* 结果统计 */}
        <div className="search-status" aria-live="polite">
          {loadError ? t('search.statusUnavailable') : query ? t('search.statusQuery', { query, count: results.length }) :
           selectedBrowseCount ? t('search.statusFiltered', { count: results.length }) :
           dataLoaded ? t(type === 'poetry' ? 'search.statusPreloaded' : 'search.statusLoaded', { total: allData.length, count: results.length }) :
           t('search.statusLoading')}
        </div>

        <div className="result-view-options" role="group" aria-label={t('search.viewMode')}>
          <button
            type="button"
            className={resultView === 'detailed' ? 'active' : ''}
            aria-pressed={resultView === 'detailed'}
            onClick={() => setResultView('detailed')}
          >
            {t('search.viewDetailed')}
          </button>
          <button
            type="button"
            className={resultView === 'titles' ? 'active' : ''}
            aria-pressed={resultView === 'titles'}
            onClick={() => setResultView('titles')}
          >
            {t('search.viewTitles')}
          </button>
        </div>
      </div>

      {activeBrowseGroup && (
        <section className="search-browse search-browse-panel" aria-labelledby={`search-browse-title-${type}`}>
          <div className="search-browse-heading">
            <div>
              <strong id={`search-browse-title-${type}`}>{t('search.browseTitle')}</strong>
              <span>{t('search.browseDescription')}</span>
            </div>
            <span>{t('search.browseCount', { count: activeBrowseGroup.values.length })}</span>
          </div>
          <div className="search-browse-tabs-row">
            <div className="search-browse-tabs" role="tablist" aria-label={t('search.browseTitle')}>
              {browseGroups.map(group => (
                <button
                  type="button"
                  role="tab"
                  key={group.id}
                  aria-selected={activeBrowseGroup.id === group.id}
                  className={activeBrowseGroup.id === group.id ? 'active' : ''}
                  onClick={() => setBrowseCategory(group.id)}
                >
                  {t(group.labelKey)}
                </button>
              ))}
            </div>
            {selectedBrowseCount > 0 && (
              <div className="search-browse-selection-summary">
                <span>{t('search.browseSelected', { count: selectedBrowseCount })}</span>
                <button type="button" onClick={() => setSelectedBrowseValues({})}>
                  {t('search.clear')}
                </button>
              </div>
            )}
          </div>
          <div className="search-browse-values" role="tabpanel" aria-label={t(activeBrowseGroup.labelKey)}>
            {activeBrowseGroup.values.map(value => {
              const isSelected = selectedBrowseValues[activeBrowseGroup.id]?.has(value) || false;
              return (
                <button
                  type="button"
                  key={`${activeBrowseGroup.id}-${value}`}
                  className={isSelected ? 'active' : ''}
                  aria-pressed={isSelected}
                  aria-label={t('search.browseValue', { category: t(activeBrowseGroup.labelKey), value: convertText(value) })}
                  onClick={() => handleBrowseToggle(value, activeBrowseGroup.id)}
                >
                  {convertText(value)}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {loadError && (
        <div role="alert" className="search-alert" style={{ background: '#fff3cd', border: '1px solid #e2b93b', color: '#6f5600', padding: '14px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          <strong>{convertText('資料載入失敗')}</strong>：{convertText(loadError)}
          <button onClick={() => window.location.reload()} style={{ marginLeft: '12px', border: 0, borderRadius: '5px', padding: '6px 10px', cursor: 'pointer' }}>
            {convertText('重試')}
          </button>
        </div>
      )}

      {/* 詩詞超過1000項提示 - 移到頂部 */}
      {(type === 'poetry' || type === 'novels') && poetryOverLimit && (
        <div className="search-limit-notice" style={{
          background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
          border: '2px solid #ffc107',
          borderRadius: '10px',
          padding: '20px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#856404', marginBottom: '10px' }}>
            ⚠️ {convertText('搜索結果超過 1000 項')}
          </div>
          <div style={{ color: '#856404', marginBottom: '15px' }}>
            {convertText(`目前已載入 ${results.length} 首詩詞，還有更多結果可載入`)}
          </div>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {hasMorePoetry && (
              <button
                onClick={() => loadMorePoetry(false)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📊 {convertText('載入更多 1000 項')}
            </button>
            )}
            {hasMorePoetry && (
              <button
                onClick={() => loadMorePoetry(true)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ⚡ {convertText('載入全部結果')}
              </button>
            )}
            {!hasMorePoetry && (
              <div style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                ✅ {convertText('已載入所有結果')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 结果列表 - 20个一页 */}
      {resultView === 'titles' ? (
        <ol className="result-title-list">
          {currentItems.map((item, index) => {
            const title = convertText(getSearchResultTitle(item, type));
            const author = (item.type === 'poetry' || type === 'poetry') && item.author
              ? convertText(item.author)
              : '';
            const accessibleTitle = author ? `${title} · ${author}` : title;
            return (
              <li key={`title-${item.type || type}-${item.id}-${index}`}>
                <button
                  type="button"
                  className="result-title-button"
                  onClick={() => loadItemDetails(item)}
                  aria-label={t('search.openTitle', { title: accessibleTitle })}
                >
                  <span className="result-title-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="result-title-main">
                    <strong>{title}</strong>
                    {author && <small>{author}</small>}
                  </span>
                  <span className="result-title-arrow" aria-hidden="true">↗</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
      <div className="result-list">
        {currentItems.map((item, index) => (
          <div
            key={`${item.type || type}-${item.id}-${index}`}
            onClick={() => loadItemDetails(item)}
            className={`result-card ${item.type || type}`}
            style={{
              background: '#fff',
              padding: '16px',
              margin: '8px 0',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {/* 词语类型 */}
            {(item.type === 'word' || type === 'words') && (
              <div>
                <div className="result-card-heading">
                  <strong className="result-card-title" style={{ fontSize: '18px', color: '#111100' }}>{convertText(item.text)}</strong>
                </div>
                <div className="result-pronunciations" style={{ color: '#7f8c8d', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {item.jyutPinyin && <div className="pronunciation jyutping" style={{ color: '#e67e22', fontWeight: 'bold' }}>{t('search.jyutping')}{item.jyutPinyin}</div>}
                  {item.mandarinPinyin && <div className="pronunciation mandarin" style={{ color: '#2471a3', fontWeight: 'bold' }}>{t('search.mandarin')}{item.mandarinPinyin}</div>}
                  {item.qieyunPinyin && <div className="pronunciation qieyun" style={{ color: '#7d3c98', fontWeight: 'bold' }}>{t('search.qieyun')}{item.qieyunPinyin}</div>}
                </div>
                {getPreferredMeanings(item).length > 0 && (
                  <div className="result-card-preview" style={{ color: '#555', marginTop: '8px', lineHeight: '1.6', fontSize: '14px' }}>
                    <strong>{convertText((item.cantoneseMeanings || []).length ? '粵語典籍釋義' : '釋義')}：</strong>
                    {convertText(getPreferredMeanings(item)[0])}
                    {getPreferredMeanings(item).length > 1 && (
                      <span style={{ color: '#999', marginLeft: '6px' }}>
                        +{getPreferredMeanings(item).length - 1} {convertText('項')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 詩詞類型 */}
            {(item.type === 'poetry' || type === 'poetry') && (
              <div>
                <div className="result-card-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong className="result-card-title" style={{ fontSize: '18px', color: '#6890ff' }}>{convertText(item.title)}</strong>
                  {item.kindLabel && <span className="result-tag" style={{ background: '#e8efff', color: '#315fb5', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{convertText(item.kindLabel)}</span>}
                </div>
                <div className="result-card-meta" style={{ color: '#7f8c8d', marginTop: '4px' }}>
                  {[item.dynasty, item.author, item.work].filter(Boolean).map(convertText).join(' · ')}
                </div>
                <div className="result-card-preview" style={{ color: '#95a5a6', marginTop: '4px', fontSize: '14px' }}>
                  {item.preview ? convertText(item.preview) + '...' : convertText('點擊查看詳情')}
                </div>
              </div>
            )}

            {(item.type === 'novel-book' || item.type === 'novel-chapter') && (
              <div>
                <div className="result-card-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <strong className="result-card-title" style={{ fontSize: '18px', color: '#8a5a2b' }}>{convertText(item.title)}</strong>
                  <span className="result-tag" style={{ background: '#fff0d8', color: '#8a5a2b', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {convertText(item.type === 'novel-book' ? `${item.chapters.length} 章` : '小說章回')}
                  </span>
                </div>
                <div className="result-card-meta" style={{ color: '#7f8c8d', marginTop: '4px' }}>
                  {[item.dynasty, item.author, item.type === 'novel-chapter' ? item.work : item.category].filter(Boolean).map(convertText).join(' · ')}
                </div>
                {item.preview && <div className="result-card-preview" style={{ color: '#777', marginTop: '8px', fontSize: '14px', lineHeight: 1.6 }}>{convertText(item.preview)}...</div>}
              </div>
            )}

            {/* 詞牌類型 */}
            {(item.type === 'cipou' || type === 'cipou') && (
              <div>
                <div className="result-card-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong className="result-card-title" style={{ fontSize: '18px', color: '#ffcc7b' }}>{convertText(item.name)}</strong>
                  <div className="result-card-tags" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {/* 韻格標籤 */}
                    {item.rhymePattern && (
                      <span className="result-tag rhyme-tag" style={{
                        background: item.rhymePattern === '平韻格' ? '#e8f5e8' :
                                  item.rhymePattern === '仄韻格' ? '#fff3e0' :
                                  item.rhymePattern === '通韻格' ? '#e3f2fd' :
                                  item.rhymePattern === '換韻格' ? '#f3e5f5' : '#f5f5f5',
                        color: item.rhymePattern === '平韻格' ? '#2e7d32' :
                               item.rhymePattern === '仄韻格' ? '#f57c00' :
                               item.rhymePattern === '通韻格' ? '#1976d2' :
                               item.rhymePattern === '換韻格' ? '#7b1fa2' : '#666',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '1px solid currentColor'
                      }}>
                        🎵 {convertText(item.rhymePattern)}
                      </span>
                    )}
                    <span className="result-tag" style={{
                      background: '#fff500',
                      color: '#111100',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {convertText('詞牌')}
                    </span>
                    {item.variants && (
                      <span className="result-tag" style={{
                        background: '#ffcc7b',
                        color: '#111100',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {convertText(`${item.variants.length}個變體`)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="result-card-preview" style={{ color: '#7f8c8d', marginTop: '4px' }}>
                  {item.variants && item.variants.length > 0 ?
                    convertText(item.variants[0].introduction) :
                    convertText(item.desc || item.description || '點擊查看詞牌格式')
                  }
                </div>
                {item.variants && item.variants.length > 0 && (
                  <div className="result-card-meta" style={{ color: '#95a5a6', marginTop: '4px', fontSize: '14px' }}>
                    {convertText('主要作者')}: {convertText(item.variants.filter(v => v.isMain).map(v => v.author).join('、') ||
                             item.variants[0].author)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      )}



      {/* 捲動至列表底部時自動顯示下一批 */}
      {displayCount < results.length && (
        <div
          ref={loadMoreSentinelRef}
          className="result-pagination result-pagination-auto"
          role="status"
          aria-live="polite"
        >
          <div className="result-pagination-count">
            {convertText(`顯示 ${displayCount} / ${results.length} 個結果`)}
          </div>
          <div className="result-pagination-meta">
            <span className="result-pagination-spinner" aria-hidden="true" />
            {t('search.autoLoadMore', {
              count: Math.min(itemsPerPage, results.length - displayCount),
              remaining: results.length - displayCount
            })}
          </div>
        </div>
      )}

      {/* 全部加載完成提示 */}
      {displayCount >= results.length && results.length > 20 && (
        <div className="result-complete" style={{
          textAlign: 'center',
          padding: '20px 0',
          color: '#999',
          fontSize: '14px'
        }}>
          ✅ {convertText(`已顯示全部 ${results.length} 個結果`)}
        </div>
      )}

      <ResultModal
        selectedItem={selectedItem}
        type={type}
        locale={locale}
        t={t}
        convertText={convertText}
        onClose={closeSelectedItem}
        onBack={returnFromNovelChapter}
        onLoadNovelChapter={loadNovelChapter}
        onSaveReadingNote={onSaveReadingNote}
      />

      {/* 詩詞模式專用提示 */}
      {!loading && results.length === 0 && !query && type === 'poetry' && (
        <div className="search-empty-state" style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📜</div>
          <h3>{convertText('請輸入關鍵字搜尋詩詞')}</h3>
          <p style={{ marginTop: '10px' }}>{convertText('支援搜尋詩名、作者、詩句內容')}</p>
        </div>
      )}

      {!loading && results.length === 0 && !query && type === 'novels' && (
        <div className="search-empty-state" style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
          <h3>{convertText('正在載入小說書庫')}</h3>
          <p style={{ marginTop: '10px' }}>{convertText('可搜尋書名、作者、章回和正文')}</p>
        </div>
      )}

      {/* 无结果提示 */}
      {!loading && results.length === 0 && query && (
        <div className="search-empty-state" style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
          <h3>{convertText('找不到')} "{query}" {convertText('的相關結果')}</h3>
          <p style={{ marginTop: '10px' }}>{convertText('請嘗試其他關鍵字')}</p>
        </div>
      )}
        </section>
      </div>
    </main>
  );
}

function App() {
  const [view, setView] = useState('home');
  const [openingEntry, setOpeningEntry] = useState(null);
  const [readingHistory, setReadingHistory] = useState(loadReadingHistory);
  const [readingNotes, setReadingNotes] = useState(loadReadingNotes);
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEYS.theme) === 'dark' ? 'dark' : 'light';
    } catch (error) {
      return 'light';
    }
  });
  const [locale, setLocale] = useState(() => {
    try {
      const savedLocale = window.localStorage.getItem(STORAGE_KEYS.locale) ||
        window.localStorage.getItem(STORAGE_KEYS.legacyLocale);
      return normalizeLocale(savedLocale);
    } catch (error) {
      return DEFAULT_LOCALE;
    }
  });
  const [, setConverterReady] = useState(chineseConverter.isLoaded);
  const t = useMemo(() => createTranslator(locale), [locale]);
  const viewConfig = VIEW_CONFIG[view];
  const product = PRODUCT_VIEW_BY_ROUTE[view];
  const recordReading = useCallback((item, fallbackView) => {
    setReadingHistory(currentHistory => {
      const nextHistory = addReadingHistoryEntry(currentHistory, item, fallbackView);
      saveReadingHistory(nextHistory);
      return nextHistory;
    });
  }, []);
  const openFeaturedPoem = useCallback((poemEntry) => {
    setOpeningEntry({ view: 'poetry', item: poemEntry });
    setView('poetry');
  }, []);
  const clearOpeningEntry = useCallback(() => setOpeningEntry(null), []);
  const clearReadingHistory = useCallback(() => {
    setReadingHistory([]);
    clearStoredReadingHistory();
  }, []);
  const saveReadingNote = useCallback(draft => {
    setReadingNotes(currentNotes => {
      const nextNotes = addReadingNote(currentNotes, draft);
      saveReadingNotes(nextNotes);
      return nextNotes;
    });
  }, []);
  const deleteReadingNote = useCallback(noteId => {
    setReadingNotes(currentNotes => {
      const nextNotes = currentNotes.filter(note => note.id !== noteId);
      saveReadingNotes(nextNotes);
      return nextNotes;
    });
  }, []);
  const openStoredEntry = useCallback(async (snapshot, targetView) => {
    const item = await resolveSavedEntry(snapshot);
    if (!item || !targetView) return;
    setOpeningEntry({ view: targetView, item });
    setView(targetView);
  }, []);
  const openHistoryEntry = useCallback(entry => (
    openStoredEntry(entry.item, entry.view)
  ), [openStoredEntry]);
  const openReadingNote = useCallback(note => (
    openStoredEntry(note.source, VIEW_BY_ENTRY_TYPE[note.source?.type])
  ), [openStoredEntry]);

  const updateLocale = useCallback((nextLocale) => {
    const normalizedLocale = normalizeLocale(nextLocale);
    setLocale(normalizedLocale);
    try {
      window.localStorage.setItem(STORAGE_KEYS.locale, normalizedLocale);
    } catch (error) {
      // The preference still applies for this session when storage is unavailable.
    }
  }, []);

  const updateTheme = useCallback((nextTheme) => {
    const normalizedTheme = nextTheme === 'dark' ? 'dark' : 'light';
    setTheme(normalizedTheme);
    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, normalizedTheme);
    } catch (error) {
      // The preference still applies for this session when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = getDocumentLanguage(locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    chineseConverter.loadDictionaries().then(() => setConverterReady(chineseConverter.isLoaded));
  }, []);

  return (
    <div className={`app-shell theme-${theme}`}>
      <AppNavigation view={view} onViewChange={setView} t={t} />

      {view === 'home' ? (
        <LandingPage onNavigate={setView} onOpenPoem={openFeaturedPoem} locale={locale} t={t} />
      ) : view === 'settings-language' ? (
        <SettingsPage
          section="language"
          locale={locale}
          onLocaleChange={updateLocale}
          theme={theme}
          onThemeChange={updateTheme}
          t={t}
        />
      ) : view === 'settings-appearance' ? (
        <SettingsPage
          section="appearance"
          locale={locale}
          onLocaleChange={updateLocale}
          theme={theme}
          onThemeChange={updateTheme}
          t={t}
        />
      ) : view === 'founders-why' ? (
        <FoundersWhyPage locale={locale} />
      ) : view === 'forum' ? (
        <ForumPage t={t} />
      ) : view === 'reading-history' ? (
        <ReadingHistoryPage
          history={readingHistory}
          locale={locale}
          t={t}
          onOpen={openHistoryEntry}
          onClear={clearReadingHistory}
        />
      ) : view === 'reading-notes' ? (
        <ReadingNotesPage
          notes={readingNotes}
          locale={locale}
          t={t}
          onOpen={openReadingNote}
          onDelete={deleteReadingNote}
        />
      ) : product ? (
        <ProductPage product={product} t={t} />
      ) : viewConfig ? (
        <AdvancedSearch
          key={view}
          type={view}
          staticData={viewConfig.getStaticData()}
          locale={locale}
          t={t}
          initialSelectedItem={openingEntry?.view === view ? openingEntry.item : null}
          onInitialItemHandled={clearOpeningEntry}
          onEntryOpened={recordReading}
          onSaveReadingNote={saveReadingNote}
        />
      ) : (
        <LandingPage onNavigate={setView} onOpenPoem={openFeaturedPoem} locale={locale} t={t} />
      )}
    </div>
  );
}

export default App;
