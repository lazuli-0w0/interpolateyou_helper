export const FEATURED_POEMS = [
  { id: 'jing-ye-si', title: '靜夜思', author: '李白', dynasty: '唐', lines: ['牀前明月光，疑是地上霜。', '舉頭望明月，低頭思故鄉。'], weight: 8 },
  { id: 'chun-xiao', title: '春曉', author: '孟浩然', dynasty: '唐', lines: ['春眠不覺曉，處處聞啼鳥。', '夜來風雨聲，花落知多少。'], weight: 8 },
  { id: 'deng-guan-que-lou', title: '登鸛雀樓', author: '王之渙', dynasty: '唐', lines: ['白日依山盡，黃河入海流。', '欲窮千里目，更上一層樓。'], weight: 8 },
  { id: 'xiang-si', title: '相思', author: '王維', dynasty: '唐', lines: ['紅豆生南國，春來發幾枝。', '願君多採擷，此物最相思。'], weight: 8 },
  { id: 'wang-lu-shan-pu-bu', title: '望廬山瀑布', author: '李白', dynasty: '唐', lines: ['日照香爐生紫煙，遙看瀑布掛前川。', '飛流直下三千尺，疑是銀河落九天。'], weight: 7 },
  { id: 'zao-fa-bai-di-cheng', title: '早發白帝城', author: '李白', dynasty: '唐', lines: ['朝辭白帝彩雲間，千里江陵一日還。', '兩岸猿聲啼不住，輕舟已過萬重山。'], weight: 7 },
  { id: 'huang-he-lou-song-meng-hao-ran', title: '黃鶴樓送孟浩然之廣陵', author: '李白', dynasty: '唐', lines: ['故人西辭黃鶴樓，煙花三月下揚州。', '孤帆遠影碧空盡，唯見長江天際流。'], weight: 7 },
  { id: 'feng-qiao-ye-bo', title: '楓橋夜泊', author: '張繼', dynasty: '唐', lines: ['月落烏啼霜滿天，江楓漁火對愁眠。', '姑蘇城外寒山寺，夜半鐘聲到客船。'], weight: 7 },
  { id: 'you-zi-yin', title: '遊子吟', author: '孟郊', dynasty: '唐', lines: ['慈母手中線，遊子身上衣。', '臨行密密縫，意恐遲遲歸。', '誰言寸草心，報得三春暉。'], weight: 7 },
  { id: 'jiang-xue', title: '江雪', author: '柳宗元', dynasty: '唐', lines: ['千山鳥飛絕，萬徑人蹤滅。', '孤舟蓑笠翁，獨釣寒江雪。'], weight: 7 },
  { id: 'hui-xiang-ou-shu', title: '回鄉偶書', author: '賀知章', dynasty: '唐', lines: ['少小離家老大回，鄉音無改鬢毛衰。', '兒童相見不相識，笑問客從何處來。'], weight: 6 },
  { id: 'qing-ming', title: '清明', author: '杜牧', dynasty: '唐', lines: ['清明時節雨紛紛，路上行人欲斷魂。', '借問酒家何處有，牧童遙指杏花村。'], weight: 6 },
  { id: 'ti-xi-lin-bi', title: '題西林壁', author: '蘇軾', dynasty: '宋', lines: ['橫看成嶺側成峰，遠近高低各不同。', '不識廬山真面目，只緣身在此山中。'], weight: 6 },
  { id: 'shui-diao-ge-tou', title: '水調歌頭·明月幾時有', author: '蘇軾', dynasty: '宋', lines: ['明月幾時有？把酒問青天。', '不知天上宮闕，今夕是何年。', '但願人長久，千里共嬋娟。'], weight: 6 },
  { id: 'ru-meng-ling', title: '如夢令·常記溪亭日暮', author: '李清照', dynasty: '宋', lines: ['常記溪亭日暮，沉醉不知歸路。', '爭渡，爭渡，驚起一灘鷗鷺。'], weight: 5 },
  { id: 'yu-mei-ren', title: '虞美人·春花秋月何時了', author: '李煜', dynasty: '南唐', lines: ['春花秋月何時了？往事知多少。', '問君能有幾多愁？恰似一江春水向東流。'], weight: 5 }
];

export function pickFeaturedPoem(previousId, randomValue = Math.random(), collection = FEATURED_POEMS) {
  const candidates = collection.filter(poem => poem.id !== previousId);
  const totalWeight = candidates.reduce((sum, poem) => sum + (poem.weight || 1), 0);
  let cursor = Math.min(Math.max(randomValue, 0), 0.999999999) * totalWeight;

  for (const poem of candidates) {
    cursor -= poem.weight || 1;
    if (cursor < 0) return poem;
  }

  return candidates[candidates.length - 1];
}

export function getFeaturedPoemPresentation(poem, maxCharacters = 84, maxLines = 4) {
  const sourceLines = (poem?.lines || []).map(line => String(line).trim()).filter(Boolean);
  const characterCount = sourceLines.reduce((total, line) => total + Array.from(line).length, 0);
  const density = characterCount > 64 ? 'dense' : characterCount > 40 ? 'compact' : 'spacious';
  const lines = [];
  let usedCharacters = 0;
  let truncated = false;

  for (const line of sourceLines) {
    if (lines.length >= maxLines || usedCharacters >= maxCharacters) {
      truncated = true;
      break;
    }

    const characters = Array.from(line);
    const remaining = maxCharacters - usedCharacters;
    if (characters.length > remaining) {
      const excerpt = characters.slice(0, remaining).join('').replace(/[，。！？；、\s]+$/u, '');
      if (excerpt) lines.push(`${excerpt}……`);
      truncated = true;
      usedCharacters = maxCharacters;
      break;
    }

    lines.push(line);
    usedCharacters += characters.length;
  }

  if (!truncated && lines.length < sourceLines.length) truncated = true;
  if (truncated && lines.length > 0 && !lines[lines.length - 1].endsWith('……')) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[，。！？；、\s]+$/u, '')}……`;
  }

  return { characterCount, density, lines, truncated };
}
