import React from 'react';
import { render, screen } from '@testing-library/react';
import { createTranslator } from '../i18n.js';
import { ReferencesPage } from './ReferencesPage.js';

test('References shows a compact central inventory without 64 individual links', () => {
  render(<ReferencesPage t={createTranslator('zh-Hant')} />);
  expect(screen.getByRole('heading', { name: 'References' })).not.toBeNull();
  expect(screen.getByText('《欽定詞譜》')).not.toBeNull();
  expect(screen.getByText('站長整理的《I Ching.pages》')).not.toBeNull();
  expect(screen.getByText('站長個人經驗與整理')).not.toBeNull();
  expect(screen.getAllByText('FONTI E RIFERIMENTI')).toHaveLength(2);
  expect(screen.queryByText(/逐卦參考連結/)).toBeNull();
  expect(screen.getAllByRole('listitem')).toHaveLength(11);
});
