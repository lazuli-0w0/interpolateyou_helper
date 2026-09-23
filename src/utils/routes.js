// Public, language-independent paths. Keep these stable when UI labels change.
export const VIEW_PATHS = Object.freeze({
  home: '/',
  words: '/strumenti/linguistica-del-lessico',
  poetry: '/strumenti/poesia-del-lessico',
  novels: '/strumenti/finzione-del-lessico',
  cipou: '/strumenti/prosa-del-lessico',
  iching: '/strumenti/i-ching',
  forum: '/forum',
  'reading-notes': '/letture/leggere-le-note',
  'reading-history': '/letture/leggere-la-storia',
  'settings-language': '/impostazioni/lingua',
  'settings-appearance': '/impostazioni/aspetto',
  'settings-references': '/impostazioni/riferimenti',
  'founders-why': '/fondatore',
  'product-bookmark': '/prodotti/segnalibro-meiyuan',
  'product-cards': '/prodotti/carte-shijing',
  'product-reading-notes': '/prodotti/note-di-testi-leggeri'
});

const ENTRY_ROUTES = Object.freeze({
  words: { prefix: '/strumento/linguistica-del-lessico', kind: 'parola' },
  poetry: { prefix: '/strumento/poesia-del-lessico', kind: 'poesia' },
  novels: { prefix: '/strumento/finzione-del-lessico', kind: 'narrativa' },
  cipou: { prefix: '/strumento/prosa-del-lessico', kind: 'schema' }
});

const LEGACY_PREFIXES = {
  '/tools/': '/strumenti/',
  '/tool/': '/strumento/',
  '/records/': '/letture/',
  '/settings/': '/impostazioni/',
  '/products/': '/prodotti/'
};

const LEGACY_ENTRY_KINDS = { word: 'parola', poem: 'poesia', book: 'libro', chapter: 'capitolo', pattern: 'schema' };
const UNNUMBERED_HOMOPHONES = { words: { 'saan-luk': 42957 } };
const indexCache = new Map();
let pronunciationPromise;

function firstReading(value) {
  return String(value || '').split(/[／/,;]/)[0].replace(/[1-6]/g, '').trim().toLowerCase();
}

function shardFor(slug) {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return String(hash % 64).padStart(2, '0');
}

async function slugIndex(view, slug) {
  const shard = shardFor(slug);
  const key = `${view}/${shard}`;
  if (!indexCache.has(key)) {
    indexCache.set(key, fetch(`/data/route-slugs/${key}.json`).then(response => {
      if (!response.ok) throw new Error(`URL index unavailable: ${key}`);
      return response.json();
    }).catch(error => { indexCache.delete(key); throw error; }));
  }
  return (await indexCache.get(key))[slug] || [];
}

async function slugForItem(view, item) {
  const reading = firstReading(view === 'words' ? item?.jyutPinyin : '');
  if (reading && /^[a-z]+(?:\s+[a-z]+)*$/.test(reading)) return reading.split(/\s+/).join('-');
  if (!pronunciationPromise) {
    pronunciationPromise = fetch('/data/character-pronunciations.json').then(response => {
      if (!response.ok) throw new Error('Jyutping dictionary unavailable');
      return response.json();
    }).catch(error => { pronunciationPromise = null; throw error; });
  }
  const pronunciations = await pronunciationPromise;
  const title = view === 'words' ? item?.text : view === 'cipou' ? item?.name : item?.title;
  const syllables = [];
  for (const char of String(title || '')) {
    if (/\p{Script=Han}/u.test(char)) {
      const pronunciation = firstReading(pronunciations[char]?.j).match(/[a-z]+/)?.[0];
      syllables.push(pronunciation || `u${char.codePointAt(0).toString(36)}`);
    } else if (/[a-z0-9]/i.test(char)) {
      if (!syllables.length || !/[a-z0-9]$/i.test(syllables[syllables.length - 1])) syllables.push(char.toLowerCase());
      else syllables[syllables.length - 1] += char.toLowerCase();
    }
  }
  return syllables.join('-') || 'opera';
}

export function pathForView(view) {
  return VIEW_PATHS[view] || VIEW_PATHS.home;
}

export async function pathForEntry(view, item) {
  const route = ENTRY_ROUTES[view];
  const id = item?.literatureId ?? (view === 'poetry' && item?.id != null ? `local-${item.id}` : item?.id);
  if (!route || id == null || id === '') return null;
  const kind = view === 'novels' && item.type === 'novel-chapter' ? 'capitolo'
    : view === 'novels' ? 'libro' : route.kind;
  const slug = await slugForItem(view, item);
  const ids = await slugIndex(view, slug);
  const index = ids.findIndex(candidate => String(candidate) === String(id));
  if (index < 0) return null;
  const reservedId = UNNUMBERED_HOMOPHONES[view]?.[slug];
  const peers = reservedId == null ? ids : ids.filter(candidate => String(candidate) !== String(reservedId));
  const peerIndex = peers.findIndex(candidate => String(candidate) === String(id));
  const suffix = ids.length > 1 && String(id) !== String(reservedId)
    ? `-#${String(peerIndex + 1).padStart(2, '0')}` : '';
  return `${route.prefix}/${kind}/${encodeURIComponent(`${slug}${suffix}`)}`;
}

export async function idForEntry(view, entry) {
  if (entry?.legacy) return entry.id;
  const match = entry?.slug?.match(/^(.*)-#(\d+)$/);
  const base = match ? match[1] : entry?.slug;
  if (!base) return null;
  const ids = await slugIndex(view, base);
  const index = match ? Number(match[2]) - 1 : 0;
  const reservedId = UNNUMBERED_HOMOPHONES[view]?.[base];
  if (!match && reservedId != null) return reservedId;
  if ((!match && ids.length !== 1) || !Number.isSafeInteger(index) || index < 0) return null;
  const peers = reservedId == null ? ids : ids.filter(candidate => String(candidate) !== String(reservedId));
  return peers[index] ?? null;
}

export function routeFromPath(pathname) {
  let path = pathname.replace(/\/+$/, '') || '/';
  for (const [oldPrefix, newPrefix] of Object.entries(LEGACY_PREFIXES)) {
    if (path.startsWith(oldPrefix)) {
      path = `${newPrefix}${path.slice(oldPrefix.length)}`;
      break;
    }
  }
  path = path.replace(/^\/impostazioni\/references$/, '/impostazioni/riferimenti')
    .replace(/\/(word|poem|book|chapter|pattern)\//, (_, kind) => `/${LEGACY_ENTRY_KINDS[kind]}/`);
  const exactView = Object.keys(VIEW_PATHS).find(view => VIEW_PATHS[view] === path);
  if (exactView) return { view: exactView, entry: null, canonicalPath: VIEW_PATHS[exactView] };

  for (const [view, route] of Object.entries(ENTRY_ROUTES)) {
    if (!path.startsWith(`${route.prefix}/`)) continue;
    const remainder = path.slice(route.prefix.length + 1).split('/');
    if (remainder.length !== 2) break;
    const [kind, rawSlug] = remainder;
    if (!rawSlug || (view === 'novels' ? !['libro', 'capitolo'].includes(kind) : kind !== route.kind)) break;
    try {
      const slug = decodeURIComponent(rawSlug);
      if (/^(?:\d+|book-\d+|local-\d+)$/.test(slug)) {
        return { view, entry: { kind, id: slug, legacy: true }, canonicalPath: path };
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*(?:-#\d{2,})?$/.test(slug)) break;
      return { view, entry: { kind, slug }, canonicalPath: path };
    } catch (error) {
      break;
    }
  }

  return { view: 'home', entry: null, unknown: true, canonicalPath: '/' };
}
