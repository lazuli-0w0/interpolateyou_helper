import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTranslator } from '../i18n.js';
import { ReadingHistoryPage } from './ReadingHistoryPage.js';

test('requires confirmation before clearing the whole reading history', () => {
  const confirm = jest.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  const onClear = jest.fn();
  const history = [{
    id: 'poetry:1', view: 'poetry', item: { type: 'poetry', title: '清明' },
    openedAt: '2026-09-01T05:00:00.000Z'
  }];

  try {
    render(<ReadingHistoryPage
      history={history}
      locale="zh-Hant"
      t={createTranslator('zh-Hant')}
      onOpen={jest.fn()}
      onClear={onClear}
    />);
    fireEvent.click(screen.getByRole('button', { name: '清除全部' }));
    expect(onClear).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '清除全部' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('1 項閱讀紀錄'));
  } finally {
    confirm.mockRestore();
  }
});
