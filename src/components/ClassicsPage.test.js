import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdvancedSearch } from '../App.js';
import { createTranslator } from '../i18n.js';
import { loadClassicsCatalog, searchClassicChapters, loadClassicChapter } from '../services/classicsDatabase.js';

jest.mock('../services/classicsDatabase.js');
jest.mock('../utils/ChineseConverter.js', () => ({ chineseConverter: { convertText: text => text, isLoaded: true } }));
const t = createTranslator('zh-Hant');
const noop = () => {};
function showPage(initialSession) {
  return render(<AdvancedSearch type="classics" staticData={[]} t={t} locale="zh-Hant" initialSession={initialSession}
    onSessionSave={noop} onEntryOpened={noop} onEntryClosed={noop} onEntryUnavailable={noop} onInitialItemHandled={noop} />);
}
beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState({}, '', '/strumenti/testi-classici');
  loadClassicsCatalog.mockResolvedValue({
    books: [{ id: 'book', title: '三朝北盟會編', author: '徐夢莘', volume_count: 250 }, { id: 'song', title: '宋論', author: '王夫之', volume_count: 15 }, { id: 'analects', title: '論語', author: '孔門弟子', volume_count: 20 }],
    chapters: [{ book_id: 'book', volume: 0, title: '序' }, { book_id: 'book', volume: 1, title: '卷一' }, { book_id: 'song', volume: 1, title: '卷一 太祖' }, { book_id: 'song', volume: 2, title: '卷二 太宗' }, { book_id: 'analects', volume: 1, title: '學而篇' }]
  });
  searchClassicChapters.mockResolvedValue([{ book_id: 'song', volume: 1, original: '政和七年。', translation: '皇帝報告。' }]);
  loadClassicChapter.mockResolvedValue([
    { id: 'a', paragraph: 1, original: '政和七年。', translation: '皇帝報告。' },
    { id: 'b', paragraph: 2, original: '先是政和元年。', translation: null }
  ]);
});
test('uses the novel book directory and reader, supports parallel paraphrases and restores the directory', async () => {
  showPage();
  fireEvent.click(await screen.findByRole('button', { name: /宋論/ }));
  const directory = await screen.findByRole('dialog');
  expect(within(directory).getByText('章回目錄')).toBeInTheDocument();
  expect(within(directory).queryByRole('button', { name: /序/ })).not.toBeInTheDocument();
  fireEvent.click(within(directory).getByRole('button', { name: '1. 卷一 太祖' }));
  await screen.findByRole('heading', { name: '卷一 太祖' });
  await waitFor(() => expect(loadClassicChapter).toHaveBeenCalledWith('song', 1));
  const reader = screen.getByRole('dialog');
  expect(reader.querySelector('.novel-reading-paper')).toBeInTheDocument();
  expect(within(reader).getByRole('tab', { name: '易讀' })).toBeInTheDocument();
  fireEvent.click(within(reader).getByRole('button', { name: '原文與語譯' }));
  expect(within(reader).getByText('皇帝報告。')).toBeInTheDocument();
  expect(within(reader).getByText('尚未翻譯')).toBeInTheDocument();
  fireEvent.click(within(reader).getByRole('button', { name: /返回/ }));
  expect(within(screen.getByRole('dialog')).getByText('章回目錄')).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '關閉閱讀視窗' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
test('searches originals and paraphrases by chapter and supports the same title-only results as novels', async () => {
  showPage();
  await screen.findByRole('button', { name: /宋論/ });
  const input = screen.getByPlaceholderText('搜尋書名、章名；選書後可搜尋正文');
  fireEvent.change(input, { target: { value: '皇帝' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(searchClassicChapters).toHaveBeenCalledWith({ bookId: '*', query: '皇帝', scope: 'all' }));
  fireEvent.click(await screen.findByRole('button', { name: /卷一 太祖/ }));
  await screen.findByRole('dialog');
  expect(loadClassicChapter).toHaveBeenCalledWith('song', 1);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(input).toHaveValue('皇帝');
  fireEvent.click(screen.getByRole('button', { name: '只看標題' }));
  expect(screen.getByRole('button', { name: /卷一 太祖/ }).closest('ol')).toHaveClass('result-title-list');
});
test('keeps the requested book and its author filter on the local Song Lun link', async () => {
  window.history.replaceState({}, '', '/strumenti/testi-classici?book=宋論');
  showPage();
  await screen.findByRole('button', { name: /宋論/ });
  expect(screen.queryByRole('button', { name: /開啟.*三朝北盟會編/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '🔍 搜尋' }));
  await waitFor(() => expect(searchClassicChapters).toHaveBeenCalledWith(expect.objectContaining({ query: '王夫之' })));
});
test('selects one corpus book before searching its original and translation', async () => {
  showPage();
  await screen.findByRole('button', { name: /論語/ });
  fireEvent.change(screen.getByLabelText('選擇典籍'), { target: { value: 'analects' } });
  const input = screen.getByPlaceholderText('書名、作者、原文或語譯');
  fireEvent.change(input, { target: { value: '學而時習之' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(searchClassicChapters).toHaveBeenCalledWith({ bookId: 'analects', query: '學而時習之', scope: 'all' }));
});
