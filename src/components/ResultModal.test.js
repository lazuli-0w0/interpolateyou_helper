import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTranslator } from '../i18n.js';
import { ResultModal } from './ResultModal.js';

const chapter = {
  id: 'chapter-1',
  type: 'novel-chapter',
  work: '紅樓夢',
  title: '第一回',
  content: '此開卷第一回也。'
};

describe('ResultModal novel navigation', () => {
  test('returns from a novel chapter to the previous page', () => {
    const onBack = jest.fn();

    render(
      <ResultModal
        selectedItem={chapter}
        type="novels"
        locale="zh-Hant"
        t={createTranslator('zh-Hant')}
        convertText={text => text}
        onClose={jest.fn()}
        onBack={onBack}
        onLoadNovelChapter={jest.fn()}
        onSaveReadingNote={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /返回上一頁/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('does not show the back button on a novel book page', () => {
    render(
      <ResultModal
        selectedItem={{ id: 'book-1', type: 'novel-book', title: '紅樓夢', chapters: [] }}
        type="novels"
        locale="zh-Hant"
        t={createTranslator('zh-Hant')}
        convertText={text => text}
        onClose={jest.fn()}
        onBack={jest.fn()}
        onLoadNovelChapter={jest.fn()}
        onSaveReadingNote={jest.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /返回上一頁/ })).not.toBeInTheDocument();
  });

  test('keeps the paid vernacular translation option disabled', () => {
    render(
      <ResultModal
        selectedItem={chapter}
        type="novels"
        locale="zh-Hant"
        t={createTranslator('zh-Hant')}
        convertText={text => text}
        onClose={jest.fn()}
        onBack={jest.fn()}
        onLoadNovelChapter={jest.fn()}
        onSaveReadingNote={jest.fn()}
      />
    );

    expect(screen.queryByRole('tab', { name: '翻譯' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '原文' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '易讀' })).toBeInTheDocument();
  });
});
