import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App, { getSearchBrowseGroups } from './App.js';
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
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
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
