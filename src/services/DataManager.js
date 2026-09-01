import { getCipaiName } from '../complete_cipai_names.js';
import { formatQieyunForWord } from '../utils/pronunciation.js';
import {
  generateChineseSearchVariants,
  getLiteratureSearchRank,
  getLiteratureSearchTokens,
  getLiteratureShard,
  mergeUniqueResults,
  takeNewItemsByKey
} from '../utils/search.js';

// 數據加載器
export class DataManager {
  constructor() {
    this.wordsData = null;
    this.wordsDataPromise = null;
    this.poetryData = null;
    this.novelsData = null;
    this.literatureManifest = null;
    this.literatureIndexShards = new Map();
    this.literatureCatalogChunks = new Map();
    this.literatureBodyChunks = new Map();
    this.cipouData = null;
    this.loadedFiles = new Set();
    this.fanJianMap = new Map(); // 繁體→簡體
    this.jianFanMap = new Map(); // 簡體→繁體
    this.conversionLoaded = false;
    this.conversionPromise = null;
  }

  // 載入繁簡轉換字典
  async loadConversionMaps() {
    if (this.conversionLoaded) return;
    if (!this.conversionPromise) {
      this.conversionPromise = (async () => {
        try {
          console.log('📚 載入繁簡轉換字典...');

          // 載入繁體→簡體
          const fanjianResponse = await fetch('/data/fanjian.json');
          const fanjianData = await fanjianResponse.json();
          fanjianData.forEach(item => {
            this.fanJianMap.set(item.i, item.o); // 繁體→簡體
          });

          // 載入簡體→繁體
          const jianfanResponse = await fetch('/data/jianfan.json');
          const jianfanData = await jianfanResponse.json();
          jianfanData.forEach(item => {
            this.jianFanMap.set(item.i, item.o); // 簡體→繁體
          });

          this.conversionLoaded = true;
          console.log(`✅ 繁簡轉換字典載入完成: 繁→簡 ${this.fanJianMap.size}, 簡→繁 ${this.jianFanMap.size}`);
        } catch (error) {
          this.conversionPromise = null;
          console.warn('⚠️  載入繁簡轉換字典失敗:', error.message);
        }
      })();
    }

    return this.conversionPromise;
  }

  // 文字轉換函數
  convertToSimplified(text) {
    if (!this.conversionLoaded || !text) return text;
    return text.split('').map(char => this.fanJianMap.get(char) || char).join('');
  }

  convertToTraditional(text) {
    if (!this.conversionLoaded || !text) return text;
    return text.split('').map(char => this.jianFanMap.get(char) || char).join('');
  }

  // 生成搜索變體 (原文、簡體、繁體)
  generateSearchVariants(query) {
    if (!this.conversionLoaded) return [query];

    return generateChineseSearchVariants(query, this.fanJianMap, this.jianFanMap);
  }

  // 為詞語生成單字粵韻 (當整詞沒有粵韻時)
  generateCharacterJyutPinyin(word, jyutPinyinMap) {
    if (!word) return '';

    const chars = word.split('');
    const charPinyins = [];

    for (const char of chars) {
      // 查找單字的粵語拼音
      const charPinyin = jyutPinyinMap.get(char);
      if (charPinyin) {
        charPinyins.push(charPinyin);
      } else {
        // 如果找不到單字拼音，嘗試繁簡轉換
        const simplifiedChar = this.convertToSimplified(char);
        const traditionalChar = this.convertToTraditional(char);

        const simplifiedPinyin = jyutPinyinMap.get(simplifiedChar);
        const traditionalPinyin = jyutPinyinMap.get(traditionalChar);

        if (simplifiedPinyin) {
          charPinyins.push(simplifiedPinyin);
        } else if (traditionalPinyin) {
          charPinyins.push(traditionalPinyin);
        } else {
          charPinyins.push(char); // 如果找不到，保留原字
        }
      }
    }

    return charPinyins.join(' ');
  }

  // 懒加载词语数据 - 優先顯示 ciZu.json，後顯示 cijyu.json
  async loadWordsData() {
    if (this.wordsData) return this.wordsData;
    if (!this.wordsDataPromise) {
      this.wordsDataPromise = this.loadWordsDataOnce();
    }
    return this.wordsDataPromise;
  }

  // Share one in-flight load so React Strict Mode cannot append the corpus twice.
  async loadWordsDataOnce() {
    try {
      // 先載入繁簡轉換字典
      await this.loadConversionMaps();

      // 優先載入由教育部《重編國語辭典修訂本》與本地粵拼資料合併的精簡索引。
      try {
        const [response, qieyunResponse] = await Promise.all([
          fetch('/data/moedict-words.json'),
          fetch('/data/qieyun-readings.json')
        ]);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const [compactWords, qieyunReadings] = await Promise.all([
          response.json(),
          qieyunResponse.ok ? qieyunResponse.json() : Promise.resolve({})
        ]);
        this.wordsData = compactWords.map((item, index) => ({
          id: index + 1,
          text: item.t,
          simplified: item.s || item.t,
          jyutPinyin: item.j || '',
          mandarinPinyin: item.p || '',
          qieyunPinyin: formatQieyunForWord(item.t, qieyunReadings),
          cantoneseMeanings: item.cm || [],
          hasCantoneseBooksData: Boolean(item.b),
          cantoneseSources: item.b || 0,
          meanings: item.m || [],
          count: item.c || 0,
          next_zi: item.n || '',
          score: (item.c || 0) * 10 + (item.b ? 5 : 0) + (item.m ? 1 : 0),
          type: 'word',
          source: item.b ? 'cantonese-books' : item.m ? 'moedict' : 'corpus'
        }));
        console.log(`✅ 載入整合詞典索引: ${this.wordsData.length} 個詞語`);
        return this.wordsData;
      } catch (error) {
        console.warn('⚠️ 載入整合詞典索引失敗，改用原有詞庫:', error.message);
      }

      this.wordsData = [];
      let id = 1;
      const seenWords = new Set();

      console.log('📚 正在載入詞語數據...');

      // 先載入 jyutwan.json 建立粵語拼音查找字典
      let jyutPinyinMap = new Map();
      try {
        const jyutResponse = await fetch('/data/wan_file/jyutwan.json');
        const jyutData = await jyutResponse.json();

        // 建立詞語到粵語拼音的映射
        Object.values(jyutData).forEach(entries => {
          entries.forEach(entry => {
            if (entry[0] && entry[0].includes(':')) {
              const [word, pinyin] = entry[0].split(':');
              if (word && pinyin) {
                jyutPinyinMap.set(word.trim(), pinyin.trim());
              }
            }
          });
        });
        console.log(`✅ 載入粵語拼音字典: ${jyutPinyinMap.size} 個映射`);
      } catch (error) {
        console.warn('⚠️  載入 jyutwan.json 失敗:', error.message);
      }

      // 1. 優先載入 ciZu.json (詞組數據) - 含粵語拼音
      try {
        const ciZuResponse = await fetch('/data/ciZu.json');
        const ciZuData = await ciZuResponse.json();
        const uniqueCiZuData = takeNewItemsByKey(ciZuData, seenWords, item => item.word);

        let withPinyinCount = 0;
        let charPinyinCount = 0;
        for (const item of uniqueCiZuData) {
          // 查找對應的粵語拼音
          let jyutPinyin = jyutPinyinMap.get(item.word) || '';

          // 如果沒有整詞拼音，嘗試生成單字拼音
          if (!jyutPinyin) {
            jyutPinyin = this.generateCharacterJyutPinyin(item.word, jyutPinyinMap);
            if (jyutPinyin && jyutPinyin !== item.word) {
              charPinyinCount++;
            }
          } else {
            withPinyinCount++;
          }

          this.wordsData.push({
            id: id++,
            text: item.word,
            count: item.count,
            next_zi: item.next_zi,
            jyutPinyin: jyutPinyin, // 添加粵語拼音 (整詞或單字組合)
            score: item.count * 10, // 根據出現次數計算分數
            type: 'word',
            source: 'ciZu'
          });
        }
        console.log(`✅ 載入 ciZu.json: ${uniqueCiZuData.length} 個唯一詞組 (整詞粵韻: ${withPinyinCount}, 單字組合粵韻: ${charPinyinCount})`);
      } catch (error) {
        console.warn('⚠️  載入 ciZu.json 失敗:', error.message);
      }

      // 2. 後載入 cijyu.json (詞語數據) - 含粵語拼音
      try {
        const cijyuResponse = await fetch('/data/cijyu.json');
        const cijyuData = await cijyuResponse.json();
        const uniqueCijyuData = takeNewItemsByKey(cijyuData, seenWords, item => item.word);

        let withPinyinCount2 = 0;
        let charPinyinCount2 = 0;
        for (const item of uniqueCijyuData) {
          // 查找對應的粵語拼音
          let jyutPinyin = jyutPinyinMap.get(item.word) || '';

          // 如果沒有整詞拼音，嘗試生成單字拼音
          if (!jyutPinyin) {
            jyutPinyin = this.generateCharacterJyutPinyin(item.word, jyutPinyinMap);
            if (jyutPinyin && jyutPinyin !== item.word) {
              charPinyinCount2++;
            }
          } else {
            withPinyinCount2++;
          }

          this.wordsData.push({
            id: id++,
            text: item.word,
            count: item.count,
            next_zi: item.next_zi,
            jyutPinyin: jyutPinyin, // 添加粵語拼音 (整詞或單字組合)
            score: item.count * 5, // 根據出現次數計算分數，但分數較低以確保 ciZu 優先
            type: 'word',
            source: 'cijyu'
          });
        }
        console.log(`✅ 載入 cijyu.json: ${uniqueCijyuData.length} 個新詞語，略過 ${cijyuData.length - uniqueCijyuData.length} 個重複項目 (整詞粵韻: ${withPinyinCount2}, 單字組合粵韻: ${charPinyinCount2})`);
      } catch (error) {
        console.warn('⚠️  載入 cijyu.json 失敗:', error.message);
      }

      // 如果沒有成功載入任何數據，嘗試備用數據源
      if (this.wordsData.length === 0) {
        console.log('🔄 嘗試備用數據源 jyutwan.json...');
        const response = await fetch('/data/wan_file/jyutwan.json');
        const rawData = await response.json();

        for (const [, entries] of Object.entries(rawData)) {
          for (const [wordInfo, score] of entries) {
            const [text, pinyin] = wordInfo.split(':');
            this.wordsData.push({
              id: id++,
              text: text,
              pinyin: pinyin,
              score: score,
              type: 'word',
              source: 'jyutwan'
            });
          }
        }
        console.log(`✅ 載入備用數據: ${this.wordsData.length} 個詞語`);
      }

      console.log(`📊 總計載入了 ${this.wordsData.length} 個詞語 (優先順序: ciZu.json → cijyu.json)`);
      return this.wordsData;
    } catch (error) {
      console.error('❌ 載入詞語數據失敗:', error);
      return this.getStaticWords();
    }
  }

  async loadLiteratureManifest() {
    if (this.literatureManifest) return this.literatureManifest;
    const response = await fetch('/data/literature/manifest.json');
    if (!response.ok) throw new Error(`文學索引載入失敗: HTTP ${response.status}`);
    this.literatureManifest = await response.json();
    return this.literatureManifest;
  }

  async fetchCompressedJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();

    if (typeof DecompressionStream !== 'undefined') {
      try {
        const compressed = new Blob([bytes]).stream();
        const decompressed = compressed.pipeThrough(new DecompressionStream('gzip'));
        return await new Response(decompressed).json();
      } catch (error) {
        // 部分 CDN 會自動解壓 .gz 檔；以下直接解析已解壓的內容。
      }
    }

    try {
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (error) {
      throw new Error('此瀏覽器無法解壓文學索引');
    }
  }

  async loadLiteratureIndexShard(shard) {
    if (this.literatureIndexShards.has(shard)) return this.literatureIndexShards.get(shard);
    const data = await this.fetchCompressedJson(`/data/literature/index/${String(shard).padStart(3, '0')}.json.gz`);
    this.literatureIndexShards.set(shard, data);
    return data;
  }

  async loadLiteratureCatalogChunk(chunk) {
    if (this.literatureCatalogChunks.has(chunk)) return this.literatureCatalogChunks.get(chunk);
    const data = await this.fetchCompressedJson(`/data/literature/catalog/${String(chunk).padStart(3, '0')}.json.gz`);
    this.literatureCatalogChunks.set(chunk, data);
    return data;
  }

  async loadLiteratureBody(item) {
    if (!item || item.literatureId == null || item.content) return item;
    const manifest = await this.loadLiteratureManifest();
    const chunk = Math.floor(item.literatureId / manifest.chunkSize);
    if (!this.literatureBodyChunks.has(chunk)) {
      this.literatureBodyChunks.set(
        chunk,
        await this.fetchCompressedJson(`/data/literature/bodies/${String(chunk).padStart(3, '0')}.json.gz`)
      );
    }
    const content = this.literatureBodyChunks.get(chunk)[item.literatureId % manifest.chunkSize] || '';
    return { ...item, content };
  }

  mapLiteratureRecord(item) {
    const kindLabels = { poem: '詩', ci: '詞', qu: '曲', classic: '典籍', novel: '小說章回' };
    return {
      id: `literature-${item.i}`,
      literatureId: item.i,
      title: item.t,
      author: item.a,
      dynasty: item.d,
      literatureKind: item.k,
      kindLabel: kindLabels[item.k] || '文學',
      source: item.s,
      work: item.w,
      category: item.g,
      preview: item.p,
      type: item.k === 'novel' ? 'novel-chapter' : 'poetry'
    };
  }

  async loadLiteratureRecords(ids) {
    const manifest = await this.loadLiteratureManifest();
    const chunks = Array.from(new Set(ids.map(id => Math.floor(id / manifest.chunkSize))));
    await Promise.all(chunks.map(chunk => this.loadLiteratureCatalogChunk(chunk)));
    return ids.map(id => {
      const chunk = Math.floor(id / manifest.chunkSize);
      const compact = this.literatureCatalogChunks.get(chunk)[id % manifest.chunkSize];
      return compact ? this.mapLiteratureRecord(compact) : null;
    }).filter(Boolean);
  }

  async searchLiteratureData(searchQuery, kind, loadedCount = 0, maxLoad = 1000) {
    await this.loadConversionMaps();
    const manifest = await this.loadLiteratureManifest();
    const offset = Math.max(0, loadedCount);
    const pageSize = Math.max(0, maxLoad - offset) || 1000;
    const searchVariants = this.generateSearchVariants(searchQuery);
    const candidateIds = new Set();

    for (const variant of searchVariants) {
      const tokens = getLiteratureSearchTokens(variant);
      if (tokens.length === 0) continue;
      const shardNumbers = Array.from(new Set(tokens.map(token => getLiteratureShard(token, manifest.shardCount))));
      await Promise.all(shardNumbers.map(shard => this.loadLiteratureIndexShard(shard)));
      const tokenLists = tokens.map(token => (
        this.literatureIndexShards.get(getLiteratureShard(token, manifest.shardCount))[token] || []
      )).sort((left, right) => left.length - right.length);
      if (tokenLists.length === 0 || tokenLists[0].length === 0) continue;
      let intersection = new Set(tokenLists[0]);
      tokenLists.slice(1).forEach(list => {
        const values = new Set(list);
        intersection = new Set(Array.from(intersection).filter(id => values.has(id)));
      });
      intersection.forEach(id => candidateIds.add(id));
    }

    const catalog = await this.loadLiteratureRecords(Array.from(candidateIds));
    const filtered = catalog
      .filter(item => kind === 'novel' ? item.literatureKind === 'novel' : item.literatureKind !== 'novel')
      .map(item => ({ ...item, score: getLiteratureSearchRank(item, searchVariants) }))
      .sort((left, right) => right.score - left.score || left.literatureId - right.literatureId);
    const results = filtered.slice(offset, offset + pageSize);
    return {
      results,
      totalLoaded: offset + results.length,
      totalMatches: filtered.length,
      hasMore: offset + results.length < filtered.length
    };
  }

  async searchPoetryData(searchQuery, loadedCount = 0, maxLoad = 1000) {
    return this.searchLiteratureData(searchQuery, 'poetry', loadedCount, maxLoad);
  }

  async searchNovelData(searchQuery, loadedCount = 0, maxLoad = 1000) {
    const [chapterResult, books] = await Promise.all([
      this.searchLiteratureData(searchQuery, 'novel', 0, 1000),
      this.loadNovelsData()
    ]);
    const variants = this.generateSearchVariants(searchQuery).map(value => value.toLowerCase());
    const bookMatches = books.filter(book => {
      const searchable = [book.title, book.author, book.dynasty, book.category, book.intro]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return variants.some(value => searchable.includes(value));
    }).map(book => ({
      ...book,
      score: variants.some(value => book.title.toLowerCase() === value) ? 1200 : 1050
    }));
    const combined = mergeUniqueResults(bookMatches, chapterResult.results)
      .sort((left, right) => (right.score || 0) - (left.score || 0));
    const offset = Math.max(0, loadedCount);
    const pageSize = Math.max(0, maxLoad - offset) || 1000;
    const results = combined.slice(offset, offset + pageSize);
    return {
      results,
      totalLoaded: offset + results.length,
      totalMatches: combined.length,
      hasMore: offset + results.length < combined.length
    };
  }

  async loadPoetryData() {
    await this.loadLiteratureManifest();
    if (this.poetryData) return this.poetryData;
    const response = await fetch('/data/literature/featured-poems.json');
    if (!response.ok) throw new Error(`精選詩詞載入失敗: HTTP ${response.status}`);
    const featured = await response.json();
    const kindLabels = { poem: '詩', ci: '詞', qu: '曲' };
    this.poetryData = featured.map(item => ({
      id: `literature-${item.i}`,
      literatureId: item.i,
      title: item.t,
      author: item.a,
      dynasty: item.d,
      literatureKind: item.k,
      kindLabel: kindLabels[item.k] || '詩詞',
      work: item.w,
      content: item.c,
      preview: item.c.slice(0, 120),
      type: 'poetry',
      source: 'chinese-poetry'
    }));
    return this.poetryData;
  }

  async loadNovelsData() {
    if (this.novelsData) return this.novelsData;
    const response = await fetch('/data/literature/books.json');
    if (!response.ok) throw new Error(`小說目錄載入失敗: HTTP ${response.status}`);
    const books = await response.json();
    this.novelsData = books.map(book => ({
      ...book,
      type: 'novel-book',
      preview: book.intro?.slice(0, 140) || '',
      kindLabel: '電子書'
    }));
    return this.novelsData;
  }

  // 韻格分類函數
  classifyRhymePattern(variants) {
    let hasFlat = false;    // 平韻
    let hasOblique = false; // 仄韻
    let hasChange = false;  // 換韻
    let hasThrough = false; // 通韻

    for (const variant of variants) {
      const desc = (variant.description || '').toLowerCase();
      const intro = (variant.introduction || '').toLowerCase();
      const text = desc + ' ' + intro;

      // 檢測平韻 (支援簡繁體)
      if (text.includes('平韻') || text.includes('平韵') || text.includes('平声韻') || text.includes('平声韵')) {
        hasFlat = true;
      }

      // 檢測仄韻 (支援簡繁體)
      if (text.includes('仄韻') || text.includes('仄韵') || text.includes('仄声韻') || text.includes('仄声韵')) {
        hasOblique = true;
      }

      // 檢測換韻 (支援簡繁體)
      if (text.includes('換韻') || text.includes('换韵') || text.includes('转韻') || text.includes('转韵') || text.includes('韻轉') || text.includes('韵转')) {
        hasChange = true;
      }

      // 檢測通韻 (支援簡繁體)
      if (text.includes('通韻') || text.includes('通韵') || text.includes('平仄通韻') || text.includes('平仄通韵') || text.includes('通押')) {
        hasThrough = true;
      }
    }

    // 優先級判斷
    if (hasChange) return '換韻格';
    if (hasThrough) return '通韻格';
    if (hasFlat && hasOblique) return '換韻格'; // 同時有平仄韻通常是換韻
    if (hasFlat) return '平韻格';
    if (hasOblique) return '仄韻格';

    return '未分類';
  }

  // 懒加载词牌数据
  async loadCipouData() {
    if (this.cipouData) return this.cipouData;

    try {
      await this.loadConversionMaps();

      const response = await fetch('/data/cipou.json');
      const rawData = await response.json();

      // 按詞牌ID分組，每個詞牌名稱只顯示一次，但包含所有變體信息
      const cipouMap = new Map();

      for (const item of rawData) {
        const cipaiId = item.ci_pai_id;

        if (!cipouMap.has(cipaiId)) {
          // 使用詞牌名稱映射獲取正確的詞牌名稱
          const cipaiName = getCipaiName(cipaiId);

          cipouMap.set(cipaiId, {
            id: cipaiId,
            name: cipaiName,
            variants: [],
            type: 'cipou'
          });
        }

        // 添加變體信息
        cipouMap.get(cipaiId).variants.push({
          author: item.author,
          size: item.size,
          content: item.content, // 平仄譜
          example: item.example, // 原譜例詞
          description: item.description,
          introduction: item.introduction,
          isMain: item.main_flag === 1
        });
      }

      // 為每個詞牌分類韻格
      const cipouArray = Array.from(cipouMap.values());
      cipouArray.forEach(cipou => {
        cipou.rhymePattern = this.classifyRhymePattern(cipou.variants);
      });

      this.cipouData = cipouArray;

      // 統計韻格分類
      const stats = {};
      cipouArray.forEach(cipou => {
        stats[cipou.rhymePattern] = (stats[cipou.rhymePattern] || 0) + 1;
      });
      console.log(`載入了 ${this.cipouData.length} 個詞牌，韻格分類:`, stats);

      return this.cipouData;
    } catch (error) {
      console.error('載入詞牌數據失敗:', error);
      return this.getStaticCipou();
    }
  }

  // 從introduction中提取詞牌名稱
  extractCipaiName(introduction) {
    if (!introduction) return '未知詞牌';

    // 匹配模式如: "单调五十五字，十三句，七平韵——白居易"
    const match = introduction.match(/——(.+)$/);
    if (match) {
      // 這裡實際上是作者名，我們需要從其他地方獲取詞牌名
      // 暫時返回格式描述作為標題
      return introduction.split('——')[0];
    }

    return introduction;
  }

  // 静态备用数据
  getStaticWords() {
    return [
      { id: 1, text: '拉', pinyin: 'laai1', score: 82, type: 'word' },
      { id: 2, text: '春', pinyin: 'ceon1', score: 95, type: 'word' },
      { id: 3, text: '花', pinyin: 'faa1', score: 88, type: 'word' },
      { id: 4, text: '雨', pinyin: 'jyu5', score: 90, type: 'word' },
      { id: 5, text: '風', pinyin: 'fung1', score: 85, type: 'word' },
      { id: 6, text: '雪', pinyin: 'syut3', score: 87, type: 'word' }
    ];
  }

  getStaticPoetry() {
    return [
      { id: 1, title: '靜夜思', author: '李白', content: '床前明月光，疑是地上霜。舉頭望明月，低頭思故鄉。', dynasty: '唐', type: 'poetry' },
      { id: 2, title: '春曉', author: '孟浩然', content: '春眠不覺曉，處處聞啼鳥。夜來風雨聲，花落知多少。', dynasty: '唐', type: 'poetry' },
      { id: 3, title: '登鸛雀樓', author: '王之渙', content: '白日依山盡，黃河入海流。欲窮千里目，更上一層樓。', dynasty: '唐', type: 'poetry' },
      { id: 4, title: '相思', author: '王維', content: '红豆生南国，春来发几枝。愿君多采撷，此物最相思。', dynasty: '唐', type: 'poetry' }
    ];
  }

  getStaticCipou() {
    return [
      { id: 17, name: '蝶戀花', desc: '雙調六十字，前後段各五句、四仄韻', type: 'cipou' },
      { id: 23, name: '水調歌頭', desc: '雙調九十五字，前段九句四平韻', type: 'cipou' },
      { id: 24, name: '念奴嬌', desc: '雙調一百字，前後段各九句、四仄韻', type: 'cipou' },
      { id: 22, name: '滿江紅', desc: '雙調九十三字，前段八句四仄韻', type: 'cipou' }
    ];
  }
}

// 创建全局数据管理器
export const dataManager = new DataManager();
