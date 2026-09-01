import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.js';
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
    loadPoetryData: jest.fn(() => Promise.resolve([])),
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
    dataManager.loadPoetryData.mockResolvedValue([]);
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

    fireEvent.click(screen.getByRole('button', { name: '工具' }));
    fireEvent.click(screen.getByRole('button', { name: /閱讀筆記 保存選文/ }));
    fireEvent.click(screen.getByRole('button', { name: '返回「一七令 · 白居易」原文' }));

    await waitFor(() => expect(dataManager.loadLiteratureRecords).toHaveBeenCalledWith([17]));
    expect(await screen.findByRole('heading', { name: '一七令' })).toBeInTheDocument();
    expect(screen.getByText('詩。綺美。')).toBeInTheDocument();
  });
});
