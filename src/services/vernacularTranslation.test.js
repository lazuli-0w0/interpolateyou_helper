import { splitVernacularSource, translateVernacularLive } from './vernacularTranslation.js';

describe('vernacular translation service', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('splits long source text without dropping content', () => {
    const source = `${'甲'.repeat(1795)}。${'乙'.repeat(300)}。`;
    const chunks = splitVernacularSource(source);

    expect(chunks.length).toBe(2);
    expect(chunks.join('')).toBe(source);
    expect(chunks.every(chunk => chunk.length <= 1800)).toBe(true);
  });

  test('requests live chunks without storing a translation', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ translations: ['第一段白話。'] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ translations: ['第二段白話。'] }) });

    const source = `${'甲'.repeat(1795)}。${'乙'.repeat(300)}。`;
    const result = await translateVernacularLive(source, { script: 'traditional' });

    expect(result).toEqual([
      { source: `${'甲'.repeat(1795)}。`, translation: '第一段白話。' },
      { source: `${'乙'.repeat(300)}。`, translation: '第二段白話。' }
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/translate/vernacular', expect.objectContaining({
      method: 'POST',
      cache: 'no-store'
    }));
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual(expect.objectContaining({
      segments: [`${'甲'.repeat(1795)}。`]
    }));
  });
});
