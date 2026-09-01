import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AppNavigation } from './components/AppNavigation.js';
import { LandingPage } from './components/LandingPage.js';
import { ResultModal } from './components/ResultModal.js';
import { SettingsPage } from './components/SettingsPage.js';
import { FoundersWhyPage } from './components/FoundersWhyPage.js';
import { ProductPage } from './components/ProductPage.js';
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

function AdvancedSearch({ type, staticData, locale, t, initialSelectedItem, onInitialItemHandled }) {
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [displayCount, setDisplayCount] = useState(20); // 當前顯示的項目數量
  const [selectedRhymePatterns, setSelectedRhymePatterns] = useState(new Set()); // 詞牌韻格篩選

  // 詩詞動態載入相關狀態
  const [poetryOverLimit, setPoetryOverLimit] = useState(false); // 是否超過1000項
  const [hasMorePoetry, setHasMorePoetry] = useState(true); // 是否還有更多詩詞可載入

  const itemsPerPage = 20;

  // 韻格選項
  const rhymePatterns = ['平韻格', '仄韻格', '通韻格', '換韻格', '未分類'];

  useEffect(() => {
    if (initialSelectedItem) onInitialItemHandled();
  }, [initialSelectedItem, onInitialItemHandled]);

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

    // 先應用篩選
    baseData = applyFilters(baseData);

    if (!searchQuery.trim()) {
      setResults(baseData); // 無搜索時顯示所有篩選後的數據
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      let searchResults = [];

      if (type === 'poetry' || type === 'novels') {
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
        } else {
          searchResults = baseData.filter(item => matchesSearchName(item, searchVariants));
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
  }, [allData, applyFilters, query, results, type]);

  // 僅用於篩選條件改變的搜索函數


  // 顯示項目計算
  const currentItems = results.slice(0, displayCount); // 顯示從開頭到當前顯示數量的項目

  // 轉換文本的輔助函數
  const convertText = (text) => {
    if (!text || !chineseConverter.isLoaded) return text;
    const script = locale === 'zh-Hans' ? 'simplified' : 'traditional';
    return chineseConverter.convertText(text, script);
  };

  // 顯示更多項目
  const loadMoreItems = () => {
    setDisplayCount(prev => Math.min(prev + itemsPerPage, results.length));
  };

  // 顯示全部項目
  const showAllItems = () => {
    setDisplayCount(results.length);
  };

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
        setResults(filteredData.filter(item => matchesSearchName(item, searchVariants)));
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
    if (item.type === 'poetry' || item.type === 'novel-chapter') {
      setLoading(true);
      try {
        setSelectedItem(await dataManager.loadLiteratureBody(item));
      } finally {
        setLoading(false);
      }
      return;
    }
    setSelectedItem(item);
  }, []);

  const loadNovelChapter = useCallback(async (chapterId) => {
    setLoading(true);
    try {
      const [chapter] = await dataManager.loadLiteratureRecords([chapterId]);
      setSelectedItem(await dataManager.loadLiteratureBody(chapter));
    } finally {
      setLoading(false);
    }
  }, []);

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
            onKeyPress={(e) => e.key === 'Enter' && handleAdvancedSearch(query)}
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
           dataLoaded ? t(type === 'poetry' ? 'search.statusPreloaded' : 'search.statusLoaded', { total: allData.length, count: results.length }) :
           t('search.statusLoading')}
        </div>
      </div>

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



      {/* 顯示更多按鍵 */}
      {displayCount < results.length && (
        <div className="result-pagination" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '30px 0'
        }}>
          <div className="result-pagination-count" style={{
            color: '#666',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            {convertText(`顯示 ${displayCount} / ${results.length} 個結果`)}
          </div>

          <div className="result-pagination-actions" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="pagination-button"
              onClick={loadMoreItems}
              style={{
                padding: '12px 24px',
                border: '2px solid #3faaff',
                background: '#fff',
                color: '#3faaff',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#3faaff';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#3faaff';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              📄 {convertText('顯示更多')} ({Math.min(itemsPerPage, results.length - displayCount)} {convertText('項')})
            </button>

            {results.length - displayCount > itemsPerPage && (
              <button
                className="pagination-button secondary"
                onClick={showAllItems}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #4caf50',
                  background: '#fff',
                  color: '#4caf50',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#4caf50';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.color = '#4caf50';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                📋 {convertText('顯示全部')} ({results.length - displayCount} {convertText('項')})
              </button>
            )}
          </div>

          <div className="result-pagination-meta" style={{
            color: '#999',
            marginTop: '15px',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            {convertText('每次載入')} {itemsPerPage} {convertText('項')} | {convertText('剩餘')} {results.length - displayCount} {convertText('項')}
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
        onClose={() => setSelectedItem(null)}
        onLoadNovelChapter={loadNovelChapter}
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
  const [openingPoem, setOpeningPoem] = useState(null);
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem('interpolateyou:theme') === 'dark' ? 'dark' : 'light';
    } catch (error) {
      return 'light';
    }
  });
  const [locale, setLocale] = useState(() => {
    try {
      const savedLocale = window.localStorage.getItem('interpolateyou:locale') ||
        window.localStorage.getItem('interpolateyou:language');
      return normalizeLocale(savedLocale);
    } catch (error) {
      return DEFAULT_LOCALE;
    }
  });
  const [, setConverterReady] = useState(chineseConverter.isLoaded);
  const t = useMemo(() => createTranslator(locale), [locale]);
  const viewConfig = VIEW_CONFIG[view];
  const openFeaturedPoem = useCallback((poemEntry) => {
    setOpeningPoem(poemEntry);
    setView('poetry');
  }, []);
  const clearOpeningPoem = useCallback(() => setOpeningPoem(null), []);

  const updateLocale = useCallback((nextLocale) => {
    const normalizedLocale = normalizeLocale(nextLocale);
    setLocale(normalizedLocale);
    try {
      window.localStorage.setItem('interpolateyou:locale', normalizedLocale);
    } catch (error) {
      // The preference still applies for this session when storage is unavailable.
    }
  }, []);

  const updateTheme = useCallback((nextTheme) => {
    const normalizedTheme = nextTheme === 'dark' ? 'dark' : 'light';
    setTheme(normalizedTheme);
    try {
      window.localStorage.setItem('interpolateyou:theme', normalizedTheme);
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
      ) : view === 'product-bookmark' || view === 'product-cards' || view === 'product-reading-notes' ? (
        <ProductPage
          product={view === 'product-cards' ? 'cards' : view === 'product-reading-notes' ? 'reading-notes' : 'bookmark'}
          t={t}
        />
      ) : (
        <AdvancedSearch
          key={view}
          type={view}
          staticData={viewConfig.getStaticData()}
          locale={locale}
          t={t}
          initialSelectedItem={view === 'poetry' ? openingPoem : null}
          onInitialItemHandled={clearOpeningPoem}
        />
      )}
    </div>
  );
}

export default App;
