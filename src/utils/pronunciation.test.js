import { formatQieyunForWord } from './pronunciation';

describe('pronunciation helpers', () => {
  test('formats one Qieyun fanqie per character in word order', () => {
    expect(formatQieyunForWord('國家', { 國: '古或切', 家: '古牙切' })).toBe('古或切 · 古牙切');
  });

  test('preserves alternate fanqie for polyphonic characters', () => {
    expect(formatQieyunForWord('調', { 調: '徒聊切／張流切／徒弔切' })).toBe('徒聊切／張流切／徒弔切');
  });

  test('does not present an incomplete reconstruction as a full word reading', () => {
    expect(formatQieyunForWord('國家', { 國: '古或切' })).toBe('');
  });
});
