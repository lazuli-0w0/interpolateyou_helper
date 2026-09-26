import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTranslator } from '../i18n.js';
import { AppNavigation } from './AppNavigation.js';
import { ProductPage } from './ProductPage.js';

const t = createTranslator('zh-Hant');

test('navigation keeps outside destinations exclusively on References', () => {
  const onViewChange = jest.fn();
  render(<AppNavigation view="home" onViewChange={onViewChange} t={t} />);

  fireEvent.click(screen.getByRole('button', { name: t('nav.products') }));
  expect(screen.queryByText(t('product.patreon.label'))).toBeNull();
  expect(screen.queryByText(t('product.videoDiary.label'))).toBeNull();
  expect(screen.queryByRole('link')).toBeNull();
});

test('product pages contain no outbound links or link-like buttons', () => {
  const { rerender } = render(<ProductPage product="cards" t={t} />);
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();

  rerender(<ProductPage product="reading-notes" t={t} />);
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});
