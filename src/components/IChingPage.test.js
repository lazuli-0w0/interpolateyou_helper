import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IChingPage } from './IChingPage.js';
import { createTranslator } from '../i18n.js';
import * as iching from '../utils/iching.js';
import * as report from '../utils/ichingReport.js';

const t = createTranslator('zh-Hant');
const coinHintStorageKey = 'interpolateyou:iching-coin-hint:v1';

beforeEach(() => window.localStorage.setItem(coinHintStorageKey, 'acknowledged'));

test('first-time coin tip is acknowledged by closing and stays closed on return', () => {
  window.localStorage.removeItem(coinHintStorageKey);
  const page = render(<IChingPage t={t} />);
  expect(screen.getByRole('dialog', { name: '通寶可以點選' })).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '關閉提示' }));
  expect(screen.queryByRole('dialog', { name: '通寶可以點選' })).toBeNull();
  expect(window.localStorage.getItem(coinHintStorageKey)).toBe('acknowledged');
  page.unmount();
  render(<IChingPage t={t} />);
  expect(screen.queryByRole('dialog', { name: '通寶可以點選' })).toBeNull();
});

test('six unchanged lines show only the original hexagram', () => {
  render(<IChingPage t={t} />);
  for (let index = 0; index < 6; index += 1) {
    fireEvent.click(screen.getByRole('button', { name: /第 1 枚：通寶/ }));
    fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
  }
  expect(screen.getAllByRole('heading', { name: '本卦' })).toHaveLength(2);
  expect(screen.queryByRole('region', { name: '變卦' })).toBeNull();
  expect(screen.getAllByText('無動爻。')).toHaveLength(1);
});

test('manual coin flips record lines from bottom to top and reveal both figures after six lines', () => {
  render(<IChingPage t={t} />);
  const firstCoin = screen.getByRole('button', { name: /第 1 枚：通寶 · 陰/ });
  expect(firstCoin.querySelector('image').getAttribute('href')).toBe('/tongbao-reference.jpeg');
  expect(firstCoin.querySelector('canvas')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /第 1 枚：通寶 · 陰/ }));
  expect(screen.getByRole('button', { name: /第 1 枚：滿文 · 陽/ }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByText('少陰 ‘’')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
  expect(screen.getByText('準備記錄二爻')).not.toBeNull();
  expect(Array.from(document.querySelectorAll('.iching-record-position'), node => node.textContent))
    .toEqual(['上', '五', '四', '三', '二', '初']);
  for (let index = 1; index < 5; index += 1) {
    fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
  }
  expect(screen.queryByRole('heading', { name: '本卦與變卦' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
  expect(screen.getByRole('heading', { name: '本卦與變卦' })).not.toBeNull();
  expect(screen.getByRole('heading', { name: '解卦' })).not.toBeNull();
  expect(screen.getByRole('region', { name: '本卦' })).not.toBeNull();
  expect(screen.getByRole('region', { name: '變卦' })).not.toBeNull();
  expect(screen.getByRole('region', { name: '本卦' }).querySelectorAll('.iching-figure-line.yin')).toHaveLength(6);
  expect(screen.getByRole('region', { name: '本卦' }).querySelectorAll('.iching-figure-moving')).toHaveLength(5);
  expect(screen.getByRole('region', { name: '變卦' }).querySelectorAll('.iching-figure-line.yang')).toHaveLength(5);
  expect(screen.getByRole('button', { name: '確認此爻' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '撤回上一爻' }));
  expect(screen.queryByRole('heading', { name: '本卦與變卦' })).toBeNull();
  expect(screen.queryByRole('heading', { name: '解卦' })).toBeNull();
});

test('old yin and old yang use distinct X and O marks', () => {
  render(<IChingPage t={t} />);
  fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
  expect(screen.getByText('X')).not.toBeNull();
  for (let index = 1; index <= 3; index += 1) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`第 ${index} 枚：通寶`) }));
  }
  fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
  expect(screen.getByText('O')).not.toBeNull();
});

test('holding one coin keeps it spinning until release without flipping a neighbouring coin or double-flipping', () => {
  const random = jest.spyOn(iching, 'randomCoinFaces').mockReturnValue([
    iching.COIN_REVERSE, iching.COIN_REVERSE, iching.COIN_REVERSE
  ]);
  jest.useFakeTimers();
  const pointer = (element, type) => fireEvent(element, Object.assign(new Event(type, { bubbles: true }), {
    button: 0, pointerId: 1, isPrimary: true
  }));
  try {
    render(<IChingPage t={t} />);
    const first = screen.getByRole('button', { name: /第 1 枚/ });
    const second = screen.getByRole('button', { name: /第 2 枚/ });
    pointer(first, 'pointerdown');
    act(() => jest.advanceTimersByTime(219));
    expect(first.getAttribute('aria-busy')).toBe('false');
    act(() => jest.advanceTimersByTime(5000));
    expect(first.getAttribute('aria-busy')).toBe('true');
    expect(first.querySelector('.effect-charged')).not.toBeNull();
    expect(random).not.toHaveBeenCalled();
    expect(second.disabled).toBe(true);
    expect(screen.getByRole('button', { name: '確認此爻' }).disabled).toBe(true);
    pointer(first, 'pointerup');
    fireEvent.click(first);
    expect(random).toHaveBeenCalledTimes(1);
    expect(first.getAttribute('aria-busy')).toBe('true');
    act(() => jest.advanceTimersByTime(500));
    expect(first.getAttribute('aria-busy')).toBe('false');
    expect(first.getAttribute('aria-pressed')).toBe('true');
    expect(second.getAttribute('aria-pressed')).toBe('false');
    expect(second.disabled).toBe(false);
    expect(first.querySelector('.effect-landed')).not.toBeNull();
  } finally { jest.useRealTimers(); random.mockRestore(); }
});

test('cancelling a held coin stops the spin without changing its face', () => {
  jest.useFakeTimers();
  try {
    render(<IChingPage t={t} />);
    const first = screen.getByRole('button', { name: /第 1 枚/ });
    fireEvent.keyDown(first, { key: ' ' });
    act(() => jest.advanceTimersByTime(300));
    expect(first.getAttribute('aria-busy')).toBe('true');
    fireEvent.blur(window);
    expect(first.getAttribute('aria-busy')).toBe('false');
    expect(first.getAttribute('aria-pressed')).toBe('false');
  } finally { jest.useRealTimers(); }
});

test('the random button spins for 0.5 seconds and then confirms the line automatically', () => {
  const random = jest.spyOn(iching, 'randomCoinFaces').mockReturnValue([
    iching.COIN_REVERSE, iching.COIN_REVERSE, iching.COIN_REVERSE
  ]);
  jest.useFakeTimers();
  try {
    render(<IChingPage t={t} />);
    expect(screen.getByText('I Ching · TRE MONETE METODO')).not.toBeNull();
    expect(screen.queryByText(/動爻機率為 1\/4/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '隨機擲三枚' }));
    expect(random).toHaveBeenCalledTimes(1);
    expect(screen.getByText('擲幣中…')).not.toBeNull();
    expect(screen.getByRole('button', { name: '確認此爻' }).disabled).toBe(true);
    act(() => jest.advanceTimersByTime(499));
    expect(screen.getByText('擲幣中…')).not.toBeNull();
    act(() => jest.advanceTimersByTime(1));
    expect(screen.getByText('準備記錄二爻')).not.toBeNull();
    expect(screen.getByText('O')).not.toBeNull();
    expect(document.querySelectorAll('.effect-landed')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /滿文 · 陽，按下切換/ })).toHaveLength(3);
    expect(screen.getByRole('button', { name: '確認此爻' }).disabled).toBe(false);
  } finally {
    jest.useRealTimers();
    random.mockRestore();
  }
});

test('the reading switches between original and plain-language text without inline source links', () => {
  render(<IChingPage t={t} />);
  for (let index = 0; index < 6; index += 1) {
    fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
  }
  expect(screen.getByRole('tab', { name: '原文' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.queryByText('白話語譯')).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: '語譯' }));
  expect(screen.getByRole('tab', { name: '語譯' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getAllByText('白話語譯')).toHaveLength(8);
  expect(screen.queryByRole('link', { name: /語譯參考來源/ })).toBeNull();
  expect(screen.queryByText(/卦辭與爻辭取自你提供的/)).toBeNull();
  expect(screen.queryByText(/可選擇逐爻記錄/)).toBeNull();
  expect(screen.queryByText(/未動爻列本卦爻辭/)).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: '原文' }));
  expect(screen.queryByText('白話語譯')).toBeNull();
});

test('03 can switch between the full record and Zhu Xi text selection independently of paraphrases', () => {
  render(<IChingPage t={t} />);
  for (let index = 0; index < 6; index += 1) {
    fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
  }
  expect(document.querySelectorAll('.iching-reading-lines li')).toHaveLength(6);
  fireEvent.click(screen.getByRole('button', { name: '朱熹變占' }));
  expect(screen.getByText('利永貞。')).not.toBeNull();
  expect(document.querySelectorAll('.iching-reading-lines li')).toHaveLength(0);
  expect(document.querySelectorAll('.iching-zhu-entry')).toHaveLength(1);
  fireEvent.click(screen.getByRole('tab', { name: '語譯' }));
  expect(screen.getAllByText('白話語譯')).toHaveLength(1);
  expect(screen.queryByRole('link', { name: /語譯參考來源/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '逐爻記錄' }));
  expect(document.querySelectorAll('.iching-reading-lines li')).toHaveLength(6);
  expect(screen.getAllByText('白話語譯')).toHaveLength(8);
});

test('04 downloads a one-page original-text record with the correct lines after undo', async () => {
  const download = jest.spyOn(report, 'downloadIChingReport').mockResolvedValue({ pages: 1 });
  try {
    render(<IChingPage t={t} />);
    fireEvent.click(screen.getByRole('button', { name: /第 1 枚：通寶/ }));
    fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
    fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
    fireEvent.click(screen.getByRole('button', { name: '撤回上一爻' }));
    for (let index = 1; index < 6; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: '確認此爻' }));
    }
    expect(screen.getByRole('heading', { name: '下載直欄報告' })).not.toBeNull();
    expect(screen.queryByText(/仿照手寫直欄/)).toBeNull();
    expect(screen.queryByText(/單頁報告只採/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '朱熹變占' }));
    fireEvent.click(screen.getByRole('tab', { name: '語譯' }));
    fireEvent.click(screen.getByRole('button', { name: '下載 PDF' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '下載 PDF' }).disabled).toBe(false));
    expect(download).toHaveBeenCalledWith('pdf', expect.objectContaining({
      values: [8, 6, 6, 6, 6, 6]
    }));
    expect(download.mock.calls[0][1]).not.toHaveProperty('casts');
    expect(download.mock.calls[0][1]).not.toHaveProperty('showParaphrase');
  } finally {
    download.mockRestore();
  }
});
