import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App, { getCipouWordCount, getSearchBrowseGroups, sortCipouResults } from './App.js';
import { dataManager } from './services/DataManager.js';
import { READING_NOTES_STORAGE_KEY } from './services/readingNotes.js';
import { chineseConverter } from './utils/ChineseConverter.js';

jest.mock('./services/DataManager.js', () => ({
  dataManager: {
    getStaticWords: jest.fn(() => []),
    getStaticPoetry: jest.fn(() => []),
    getStaticCipou: jest.fn(() => []),
    loadLiteratureRecords: jest.fn(),
    loadLiteratureBody: jest.fn(),
    loadWordsData: jest.fn(() => Promise.resolve([])),
    loadPoetryData: jest.fn(() => Promise.resolve([])),
    searchPoetryData: jest.fn(() => Promise.resolve({ results: [], hasMore: false })),
    loadNovelsData: jest.fn(() => Promise.resolve([])),
    loadCipouData: jest.fn(() => Promise.resolve([])),
    generateSearchVariants: jest.fn(query => [query]),
    loadCharacterPronunciations: jest.fn(() => Promise.resolve({}))
  }
}));

jest.mock('./utils/ChineseConverter.js', () => ({
  chineseConverter: {
    isLoaded: true,
    loadDictionaries: jest.fn(() => Promise.resolve()),
    convertText: jest.fn(text => text)
  }
}));

describe('reading note entry navigation', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
    global.fetch = jest.fn(async url => ({
      ok: true,
      json: async () => String(url).includes('character-pronunciations')
        ? { 一: { j: 'jat1' }, 七: { j: 'cat1' }, 令: { j: 'ling6' } }
        : String(url).includes('route-slugs') ? { 'jat-cat-ling': [17] } : []
    }));
    chineseConverter.loadDictionaries.mockResolvedValue(undefined);
    chineseConverter.convertText.mockImplementation(text => text);
    dataManager.getStaticWords.mockReturnValue([]);
    dataManager.getStaticPoetry.mockReturnValue([]);
    dataManager.getStaticCipou.mockReturnValue([]);
    dataManager.loadWordsData.mockResolvedValue([]);
    dataManager.loadPoetryData.mockResolvedValue([]);
    dataManager.searchPoetryData.mockResolvedValue({ results: [], hasMore: false });
    dataManager.loadNovelsData.mockResolvedValue([]);
    dataManager.loadCipouData.mockResolvedValue([]);
    dataManager.generateSearchVariants.mockImplementation(query => [query]);
    dataManager.loadCharacterPronunciations.mockResolvedValue({});
    window.localStorage.setItem(READING_NOTES_STORAGE_KEY, JSON.stringify([{
      id: 'note-1',
      text: '綺美',
      annotation: '',
      source: {
        literatureId: 17,
        type: 'poetry',
        title: '一七令',
        author: '白居易'
      },
      createdAt: '2026-09-01T05:00:00.000Z'
    }]));
    dataManager.loadLiteratureRecords.mockResolvedValue([{
      id: 'literature-17',
      literatureId: 17,
      type: 'poetry',
      title: '一七令',
      author: '白居易',
      dynasty: '唐'
    }]);
    dataManager.loadLiteratureBody.mockImplementation(item => Promise.resolve({
      ...item,
      content: '詩。綺美。'
    }));
  });

  test('opens the original reader from a saved note', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '紀錄' }));
    fireEvent.click(screen.getByRole('button', { name: /閱讀筆記 保存選文/ }));
    fireEvent.click(screen.getByRole('button', { name: '返回「一七令 · 白居易」原文' }));

    await waitFor(() => expect(dataManager.loadLiteratureRecords).toHaveBeenCalledWith([17]));
    expect(await screen.findByRole('heading', { name: '一七令' })).toBeInTheDocument();
    expect(screen.getByText('詩。綺美。')).toBeInTheDocument();
  });

  test('opens the shared References catalogue from Settings', async () => {
    render(<App />);
    await act(async () => { await Promise.resolve(); });
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    fireEvent.click(screen.getByRole('button', { name: /References 集中查看/ }));
    expect(screen.getByRole('heading', { name: 'References' })).toBeInTheDocument();
    expect(screen.getByText('站長整理的《I Ching.pages》')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/impostazioni/riferimenti');
  });

  test('opens a page directly from its URL and follows browser history', async () => {
    window.history.replaceState({}, '', '/strumenti/i-ching');
    render(<App />);
    expect(screen.getByRole('heading', { name: '通寶起卦' })).toBeInTheDocument();

    window.history.pushState({}, '', '/impostazioni/riferimenti');
    fireEvent(window, new PopStateEvent('popstate'));
    expect(screen.getByRole('heading', { name: 'References' })).toBeInTheDocument();
  });

  test('uses the requested Italian overline on the reading-notes product', () => {
    window.history.replaceState({}, '', '/prodotti/note-di-testi-leggeri');
    render(<App />);
    expect(screen.getByText('SPIEGAZIONE DELLE FRASI SELEZIONATE')).toBeInTheDocument();
  });

  test('opens a saved work directly from its unique URL', async () => {
    window.history.replaceState({}, '', '/strumento/poesia-del-lessico/poesia/jat-cat-ling');
    render(<App />);
    expect(await screen.findByRole('heading', { name: '一七令' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/strumento/poesia-del-lessico/poesia/jat-cat-ling');
  });

  test('switches a search page to a compact title-only list', async () => {
    dataManager.loadWordsData.mockResolvedValue([{
      id: 'word-1',
      type: 'word',
      text: '知音',
      cantoneseMeanings: ['知己。']
    }]);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /詞 詞語搜尋/ }));
    expect(await screen.findByText('知己。')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '只看標題' }));

    expect(screen.getByRole('button', { name: '開啟「知音」' })).toBeInTheDocument();
    expect(screen.queryByText('知己。')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '只看標題' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows the author beside poetry titles in title-only view', async () => {
    dataManager.loadPoetryData.mockResolvedValue([{
      id: 'poem-1',
      type: 'poetry',
      title: '卜算子',
      author: '蘇軾',
      dynasty: '宋',
      preview: '缺月掛疏桐'
    }]);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /詩 詩詞搜尋/ }));
    expect(await screen.findByText('缺月掛疏桐...')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '只看標題' }));

    const result = screen.getByRole('button', { name: '開啟「卜算子 · 蘇軾」' });
    expect(result).toHaveTextContent('卜算子');
    expect(result).toHaveTextContent('蘇軾');
  });

  test('does not relabel preloaded results while a new search is only being typed', async () => {
    dataManager.loadPoetryData.mockResolvedValue([{
      id: 'poem-1', type: 'poetry', title: '清明', author: '杜牧', preview: '清明時節雨紛紛'
    }]);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /詩 詩詞搜尋/ }));
    expect(await screen.findByText('清明時節雨紛紛...')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('搜尋詩詞...'), { target: { value: '李白' } });

    expect(screen.getByText(/目前只預載 1 個項目/)).toBeInTheDocument();
    expect(screen.queryByText(/「李白」找到/)).not.toBeInTheDocument();
  });

  test('keeps a search draft and result display choice after visiting another page', async () => {
    dataManager.loadPoetryData.mockResolvedValue([{
      id: 'poem-1', type: 'poetry', title: '清明', author: '杜牧', preview: '清明時節雨紛紛'
    }]);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /詩 詩詞搜尋/ }));
    expect(await screen.findByText('清明時節雨紛紛...')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('搜尋詩詞...'), { target: { value: '李白' } });
    fireEvent.click(screen.getByRole('button', { name: '只看標題' }));
    fireEvent.click(screen.getByRole('button', { name: '論壇' }));
    fireEvent.click(screen.getByRole('button', { name: '工具' }));
    fireEvent.click(screen.getByRole('button', { name: /詩詞搜尋 從題名/ }));

    expect(screen.getByPlaceholderText('搜尋詩詞...')).toHaveValue('李白');
    expect(screen.getByRole('button', { name: '只看標題' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '開啟「清明 · 杜牧」' })).toBeInTheDocument();
  });

  test('automatically reveals the next 20 results when the list end approaches', async () => {
    const originalObserver = global.IntersectionObserver;
    let intersectionCallback;
    global.IntersectionObserver = class {
      constructor(callback) {
        intersectionCallback = callback;
      }

      observe() {}
      disconnect() {}
    };
    dataManager.loadWordsData.mockResolvedValue(Array.from({ length: 45 }, (_, index) => ({
      id: `word-${index}`,
      type: 'word',
      text: `詞${index}`
    })));

    try {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: /詞 詞語搜尋/ }));
      await screen.findByText('詞0', {}, { timeout: 3000 });
      fireEvent.click(screen.getByRole('button', { name: '只看標題' }));

      expect(screen.getAllByRole('button', { name: /開啟「詞/ })).toHaveLength(20);
      act(() => intersectionCallback([{ isIntersecting: true }]));
      await waitFor(() => expect(screen.getAllByRole('button', { name: /開啟「詞/ })).toHaveLength(40));
    } finally {
      global.IntersectionObserver = originalObserver;
    }
  });

  test('builds author and dynasty lists from literature metadata', () => {
    const groups = getSearchBrowseGroups('poetry', [
      { author: '李白', dynasty: '唐' },
      { author: '李白', dynasty: '唐' },
      { author: '蘇軾', dynasty: '宋' }
    ]);

    expect(groups).toEqual([
      expect.objectContaining({ id: 'author', values: ['李白', '蘇軾'] }),
      expect.objectContaining({ id: 'dynasty', values: ['唐', '宋'] })
    ]);
  });

  test('merges source-numbered author labels without changing the source records', async () => {
    const poems = [
      { id: 1, type: 'poetry', title: '甲', author: '王炎', dynasty: '宋' },
      { id: 2, type: 'poetry', title: '乙', author: '王炎2', dynasty: '宋' }
    ];
    dataManager.loadPoetryData.mockResolvedValue(poems);
    dataManager.searchPoetryData.mockResolvedValue({ results: poems, hasMore: false });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /詩 詩詞搜尋/ }));
    fireEvent.click(await screen.findByRole('button', { name: '選擇作者「王炎」' }));
    expect(screen.queryByRole('button', { name: /選擇作者「王炎2」/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '🔍 搜尋' }));

    await waitFor(() => expect(screen.getByText('分類篩選找到 2 個結果')).toBeInTheDocument());
    expect(screen.getByText('甲')).toBeInTheDocument();
    expect(screen.getByText('乙')).toBeInTheDocument();
    expect(poems[1].author).toBe('王炎2');
  });

  test('keeps category filters separate, supports multi-select, and combines them with typed poetry search', async () => {
    const poems = [
      { id: 1, type: 'poetry', title: '甲', author: '李白', dynasty: '唐', content: '春風又綠江南岸。' },
      { id: 2, type: 'poetry', title: '乙', author: '孟浩然', dynasty: '唐', content: '春風也到江南岸。' },
      { id: 3, type: 'poetry', title: '丙', author: '杜甫', dynasty: '唐', content: '江南別有天地。' }
    ];
    dataManager.loadPoetryData.mockResolvedValue(poems);
    dataManager.searchPoetryData.mockImplementation(term => Promise.resolve({
      results: term === '春風' ? poems.slice(0, 2) : poems,
      hasMore: false
    }));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /詩 詩詞搜尋/ }));

    fireEvent.click(await screen.findByRole('tab', { name: '常見詞' }));
    fireEvent.click(screen.getByRole('button', { name: '選擇常見詞「春風」' }));
    fireEvent.click(screen.getByRole('tab', { name: '作者' }));
    fireEvent.click(screen.getByRole('button', { name: '選擇作者「李白」' }));
    fireEvent.click(screen.getByRole('button', { name: '選擇作者「孟浩然」' }));

    expect(screen.getByPlaceholderText('搜尋詩詞...')).toHaveValue('');
    expect(dataManager.searchPoetryData).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('搜尋詩詞...'), { target: { value: '江南' } });
    fireEvent.click(screen.getByRole('button', { name: '🔍 搜尋' }));

    expect(screen.getByPlaceholderText('搜尋詩詞...')).toHaveValue('江南');
    await waitFor(() => expect(dataManager.searchPoetryData).toHaveBeenCalledWith('江南', 0, 5000));
    expect(dataManager.searchPoetryData).toHaveBeenCalledWith('春風', 0, 5000);
    expect(await screen.findByText('甲')).toBeInTheDocument();
    expect(screen.getByText('乙')).toBeInTheDocument();
    expect(screen.queryByText('丙')).not.toBeInTheDocument();
  });

  test('builds a searchable author list from ci pattern variants', () => {
    const [authors] = getSearchBrowseGroups('cipou', [
      { variants: [{ author: '周邦彥' }, { author: '蘇軾' }] },
      { variants: [{ author: '周邦彥' }] }
    ]);

    expect(authors).toEqual(expect.objectContaining({ id: 'author', values: ['周邦彥', '蘇軾'] }));
  });

  test('sorts ci patterns by the main variant character count and keeps unknown counts last', () => {
    const patterns = [
      { id: 'unknown', variants: [] },
      { id: 'long', variants: [{ size: 90, isMain: true }] },
      { id: 'short', variants: [{ size: 35 }, { size: 40 }] },
      { id: 'main', variants: [{ size: 20 }, { size: 55, isMain: true }] }
    ];

    expect(getCipouWordCount(patterns[2])).toBe(35);
    expect(getCipouWordCount(patterns[3])).toBe(55);
    expect(sortCipouResults(patterns, 'characters-asc').map(item => item.id))
      .toEqual(['short', 'main', 'long', 'unknown']);
    expect(sortCipouResults(patterns, 'characters-desc').map(item => item.id))
      .toEqual(['long', 'main', 'short', 'unknown']);
  });

  test('filters ci patterns by a variant author selected from the list', async () => {
    dataManager.loadCipouData.mockResolvedValue([
      { id: 'ci-1', type: 'cipou', name: '雨霖鈴', variants: [{ author: '柳永' }] },
      { id: 'ci-2', type: 'cipou', name: '念奴嬌', variants: [{ author: '蘇軾' }] }
    ]);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /韻 詞牌搜尋/ }));

    fireEvent.click(await screen.findByRole(
      'button',
      { name: '選擇作者「柳永」' },
      { timeout: 3000 }
    ));
    fireEvent.click(screen.getByRole('button', { name: '🔍 搜尋' }));

    await waitFor(() => expect(screen.getByText('分類篩選找到 1 個結果')).toBeInTheDocument());
    expect(screen.getByText('雨霖鈴')).toBeInTheDocument();
    expect(screen.queryByText('念奴嬌')).not.toBeInTheDocument();
  });
});
