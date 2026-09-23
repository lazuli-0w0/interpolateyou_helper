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

  test('offers an easy-read layout for ci pattern introductions, examples, and notes', () => {
    render(
      <ResultModal
        selectedItem={{
          id: 'cipou-1',
          type: 'cipou',
          name: '一七令',
          variants: [{
            author: '白居易',
            size: 12,
            isMain: true,
            introduction: '單調十二字。兩句一韻。',
            content: '0a。|1a。',
            example: '詩，綺美。|月明，花落。',
            description: '首句平聲。次句押韻。'
          }]
        }}
        type="cipou"
        locale="zh-Hant"
        t={createTranslator('zh-Hant')}
        convertText={text => text}
        onClose={jest.fn()}
        onBack={jest.fn()}
        onLoadNovelChapter={jest.fn()}
        onSaveReadingNote={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: '易讀' }));

    expect(screen.getByText('詩，綺美。')).toHaveClass('formatted-poetry-line');
    expect(screen.getByText('月明，花落。')).toHaveClass('formatted-poetry-line');
    expect(screen.getByText('首句平聲。')).toHaveClass('formatted-prose-sentence');
    expect(screen.getByText('次句押韻。')).toHaveClass('formatted-prose-sentence');
  });

  test('focuses the reader, closes with Escape, and restores the opener focus', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const onClose = jest.fn();
    const props = {
      type: 'novels', locale: 'zh-Hant', t: createTranslator('zh-Hant'),
      convertText: text => text, onClose, onBack: jest.fn(),
      onLoadNovelChapter: jest.fn(), onSaveReadingNote: jest.fn()
    };

    try {
      const { rerender } = render(<ResultModal {...props} selectedItem={chapter} />);
      expect(screen.getByRole('dialog', { name: '第一回' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '關閉閱讀視窗' })).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
      rerender(<ResultModal {...props} selectedItem={null} />);
      expect(opener).toHaveFocus();
    } finally {
      opener.remove();
    }
  });
});
