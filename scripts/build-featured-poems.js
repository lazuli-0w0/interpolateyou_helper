const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const projectRoot = path.resolve(__dirname, '..');
const literatureRoot = path.join(projectRoot, 'public/data/literature');
const featuredOutput = path.join(literatureRoot, 'featured-poems.json');
const targetCount = 500;

const famousTitles = [
  '靜夜思', '春曉', '登鸛雀樓', '相思', '望廬山瀑布', '早發白帝城', '黃鶴樓送孟浩然之廣陵',
  '楓橋夜泊', '遊子吟', '江雪', '回鄉偶書', '清明', '題西林壁', '水調歌頭', '如夢令', '虞美人',
  '將進酒', '蜀道難', '行路難', '月下獨酌', '送友人', '黃鶴樓', '登高', '春望', '望嶽', '絕句',
  '茅屋為秋風所破歌', '聞官軍收河南河北', '琵琶行', '長恨歌', '錢塘湖春行', '賦得古原草送別',
  '憫農', '尋隱者不遇', '涼州詞', '出塞', '芙蓉樓送辛漸', '鹿柴', '送元二使安西', '九月九日憶山東兄弟',
  '山居秋暝', '竹里館', '鳥鳴澗', '泊船瓜洲', '梅花', '元日', '飲湖上初晴後雨', '惠崇春江晚景',
  '江城子', '念奴嬌', '定風波', '聲聲慢', '一剪梅', '武陵春', '漁家傲', '青玉案', '破陣子',
  '滿江紅', '卜算子', '釵頭鳳', '遊山西村', '示兒', '小池', '曉出淨慈寺送林子方', '村居',
  '己亥雜詩', '竹石', '石灰吟', '木蘭詩', '短歌行', '觀滄海', '飲酒', '歸園田居', '蒹葭', '關雎'
];

const famousAuthors = [
  '李白', '杜甫', '白居易', '王維', '蘇軾', '李清照', '辛棄疾', '杜牧', '李商隱', '孟浩然',
  '王昌齡', '王之渙', '劉禹錫', '柳宗元', '韓愈', '孟郊', '賈島', '岑參', '高適', '張繼',
  '賀知章', '韋應物', '溫庭筠', '柳永', '晏殊', '歐陽修', '范仲淹', '王安石', '陸游', '楊萬里',
  '岳飛', '文天祥', '陶淵明', '曹操', '李煜', '納蘭性德', '龔自珍', '鄭燮', '于謙', '屈原'
];

function readGzipJson(filePath) {
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(filePath)).toString('utf8'));
}

function getTraditionalConverter() {
  const mapPath = path.join(projectRoot, 'public/data/jianfan.json');
  if (!fs.existsSync(mapPath)) return value => value;
  const map = new Map(JSON.parse(fs.readFileSync(mapPath, 'utf8')).map(item => [item.i, item.o]));
  return value => Array.from(String(value || ''), character => map.get(character) || character).join('');
}

function scoreCandidate(record) {
  const titleIndex = famousTitles.findIndex(title => record.title === title);
  const relatedTitleIndex = famousTitles.findIndex(title => record.title !== title && record.title.includes(title));
  const authorIndex = famousAuthors.indexOf(record.author);
  let score = 0;

  if (titleIndex >= 0) score += 5000 - titleIndex * 15;
  else if (relatedTitleIndex >= 0) score += 850 - relatedTitleIndex * 3;
  if (authorIndex >= 0) score += 1200 - authorIndex * 12;
  if (record.dynasty === '唐') score += 140;
  if (record.dynasty === '宋') score += 110;
  if (record.kind === 'poem') score += 80;
  if (record.content.length >= 20 && record.content.length <= 180) score += 100;
  if (record.title.length >= 2 && record.title.length <= 14) score += 55;
  if (/^(無題|其\d+|卷\d+|第.+)/.test(record.title)) score -= 220;

  return score;
}

function main() {
  const manifestPath = path.join(literatureRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error('Run the literature index builder first.');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const toTraditional = getTraditionalConverter();
  const candidates = [];

  for (let chunk = 0; chunk < manifest.chunks; chunk += 1) {
    const fileName = String(chunk).padStart(3, '0') + '.json.gz';
    const catalog = readGzipJson(path.join(literatureRoot, 'catalog', fileName));
    const bodies = readGzipJson(path.join(literatureRoot, 'bodies', fileName));

    catalog.forEach((item, index) => {
      if (!['poem', 'ci', 'qu'].includes(item.k)) return;
      const content = toTraditional(bodies[index] || '');
      if (content.length < 12 || content.length > 420) return;
      const record = {
        literatureId: item.i,
        title: toTraditional(item.t),
        author: toTraditional(item.a),
        dynasty: toTraditional(item.d),
        kind: item.k,
        work: toTraditional(item.w),
        content
      };
      candidates.push({ ...record, score: scoreCandidate(record) });
    });
  }

  candidates.sort((left, right) => right.score - left.score || left.literatureId - right.literatureId);
  const selected = [];
  const authorCounts = new Map();
  const titleFamilyCounts = new Map();
  const seen = new Set();

  for (const candidate of candidates) {
    const key = `${candidate.title}|${candidate.author}|${candidate.content}`;
    const authorCount = authorCounts.get(candidate.author) || 0;
    const titleFamily = `${candidate.author}|${candidate.title.replace(/[（(]?其?[一二三四五六七八九十百\d]+[）)]?$/, '').trim()}`;
    const titleFamilyCount = titleFamilyCounts.get(titleFamily) || 0;
    if (seen.has(key) || authorCount >= 16 || titleFamilyCount >= 2) continue;
    seen.add(key);
    authorCounts.set(candidate.author, authorCount + 1);
    titleFamilyCounts.set(titleFamily, titleFamilyCount + 1);
    selected.push({
      i: candidate.literatureId,
      t: candidate.title,
      a: candidate.author,
      d: candidate.dynasty,
      k: candidate.kind,
      w: candidate.work,
      c: candidate.content
    });
    if (selected.length === targetCount) break;
  }

  if (selected.length !== targetCount) throw new Error(`Only selected ${selected.length} featured poems.`);
  const weightedSelection = selected.map((item, index) => ({
    ...item,
    r: Math.max(1, 8 - Math.floor(index / 70))
  }));
  fs.writeFileSync(featuredOutput, JSON.stringify(weightedSelection));
  console.log(`Wrote ${selected.length} featured poems to ${featuredOutput}`);
}

main();
