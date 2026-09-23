import { idForEntry, pathForEntry, pathForView, routeFromPath, VIEW_PATHS } from './routes.js';

beforeEach(() => {
  global.fetch = jest.fn(async url => ({
    ok: true,
    json: async () => String(url).includes('character-pronunciations')
      ? { 一: { j: 'jat1' }, 七: { j: 'cat1' }, 令: { j: 'ling6' } }
      : { luk: [68839, 77835], 'saan-luk': [16127, 42957, 47113], 'jat-cat-ling': [17] }
  }));
});

test('every page has one stable, distinct URL that can be reopened', () => {
  const paths = Object.values(VIEW_PATHS);
  expect(new Set(paths).size).toBe(paths.length);
  Object.entries(VIEW_PATHS).forEach(([view, path]) => {
    expect(pathForView(view)).toBe(path);
    expect(routeFromPath(`${path}/`)).toEqual({ view, entry: null, canonicalPath: path });
  });
  expect(pathForView('words')).toMatch(/^\/strumenti\//);
  expect(pathForView('product-reading-notes')).toMatch(/^\/prodotti\//);
});

test('reader URLs use Jyutping and distinguish homophones', async () => {
  const poetryPath = await pathForEntry('poetry', { literatureId: 17, title: '一七令' });
  expect(poetryPath).toBe('/strumento/poesia-del-lessico/poesia/jat-cat-ling');
  expect(await pathForEntry('words', { id: 42957, text: '山麓', jyutPinyin: 'saan1 luk1' }))
    .toBe('/strumento/linguistica-del-lessico/parola/saan-luk');
  expect(await idForEntry('words', routeFromPath('/strumento/linguistica-del-lessico/parola/saan-luk').entry))
    .toBe(42957);
  expect(await pathForEntry('words', { id: 68839, text: '六', jyutPinyin: 'luk6' }))
    .toBe('/strumento/linguistica-del-lessico/parola/luk-%2301');
  expect(await pathForEntry('words', { id: 77835, text: '麓', jyutPinyin: 'luk1' }))
    .toBe('/strumento/linguistica-del-lessico/parola/luk-%2302');
  const entry = routeFromPath('/strumento/linguistica-del-lessico/parola/luk-%2302').entry;
  expect(await idForEntry('words', entry)).toBe(77835);
  expect(await pathForEntry('poetry', { title: '沒有 ID' })).toBeNull();
  expect(routeFromPath('/strumento/poesia-del-lessico/poesia/%ZZ').unknown).toBe(true);
});
