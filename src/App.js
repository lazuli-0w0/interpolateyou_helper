import React, { useState, useCallback, useEffect } from 'react';
import { getCipaiName } from './complete_cipai_names.js';
import { chineseConverter } from './utils/ChineseConverter.js';

// 數據加載器
class DataManager {
  constructor() {
    this.wordsData = null;
    this.poetryData = null;
    this.cipouData = null;
    this.loadedFiles = new Set();
    this.fanJianMap = new Map(); // 繁體→簡體
    this.jianFanMap = new Map(); // 簡體→繁體
    this.conversionLoaded = false;
  }

  // 載入繁簡轉換字典
  async loadConversionMaps() {
    if (this.conversionLoaded) return;
    
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
      console.warn('⚠️  載入繁簡轉換字典失敗:', error.message);
    }
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
    
    const variants = new Set([query]);
    variants.add(this.convertToSimplified(query));
    variants.add(this.convertToTraditional(query));
    
    return Array.from(variants);
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
    
    try {
      // 先載入繁簡轉換字典
      await this.loadConversionMaps();
      
      this.wordsData = [];
      let id = 1;
      
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
        
        let withPinyinCount = 0;
        let charPinyinCount = 0;
        for (const item of ciZuData) {
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
        console.log(`✅ 載入 ciZu.json: ${ciZuData.length} 個詞組 (整詞粵韻: ${withPinyinCount}, 單字組合粵韻: ${charPinyinCount})`);
      } catch (error) {
        console.warn('⚠️  載入 ciZu.json 失敗:', error.message);
      }
      
      // 2. 後載入 cijyu.json (詞語數據) - 含粵語拼音
      try {
        const cijyuResponse = await fetch('/data/cijyu.json');
        const cijyuData = await cijyuResponse.json();
        
        let withPinyinCount2 = 0;
        let charPinyinCount2 = 0;
        for (const item of cijyuData) {
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
        console.log(`✅ 載入 cijyu.json: ${cijyuData.length} 個詞語 (整詞粵韻: ${withPinyinCount2}, 單字組合粵韻: ${charPinyinCount2})`);
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

  // 懒加载诗词数据 
  // 獲取所有可用的詩詞文件列表
  getAllPoetryFiles() {
    const files = [];
    
    // 唐詩文件 (0-57000，每1000一個文件)
    for (let i = 0; i <= 57000; i += 1000) {
      files.push(`/data/poems_file/poet.tang.${i}.json`);
    }
    
    // 宋詞文件 (0-254000，每1000一個文件)
    for (let i = 0; i <= 254000; i += 1000) {
      files.push(`/data/poems_file/poet.song.${i}.json`);
    }
    
    return files;
  }

  // 動態搜索詩詞數據
  async searchPoetryData(searchQuery, loadedCount = 0, maxLoad = 1000) {
    const results = [];
    const files = this.getAllPoetryFiles();
    let processed = 0;
    let loaded = loadedCount;
    
    console.log(`🔍 開始搜索詩詞，關鍵字: "${searchQuery}", 已載入: ${loadedCount}, 最大載入: ${maxLoad}`);
    
    const searchVariants = this.generateSearchVariants(searchQuery.toLowerCase());
    
    for (const file of files) {
      if (loaded >= maxLoad) break;
      
      try {
        const response = await fetch(file);
        if (!response.ok) continue;
        
        const data = await response.json();
        processed++;
        
        for (const poem of data) {
          if (loaded >= maxLoad) break;
          
          if (poem.author && poem.paragraphs && poem.title) {
            const title = poem.title.toLowerCase();
            const author = poem.author.toLowerCase();
            const content = poem.paragraphs.join('').toLowerCase();
            
            // 檢查是否匹配搜索關鍵字
            const matches = searchVariants.some(variant => 
              title.includes(variant) || 
              author.includes(variant) || 
              content.includes(variant)
            );
            
            if (matches) {
              const dynasty = file.includes('tang') ? '唐' : '宋';
              results.push({
                id: `${dynasty}-${poem.title}-${poem.author}-${results.length}`,
                title: poem.title,
                author: poem.author,
                content: poem.paragraphs.join(''),
                dynasty: dynasty,
                type: 'poetry',
                score: title.includes(searchVariants[0]) ? 100 : 
                       author.includes(searchVariants[0]) ? 80 : 50
              });
              loaded++;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ 載入文件失敗: ${file}`, error.message);
      }
    }
    
    console.log(`✅ 搜索完成，處理了 ${processed} 個文件，找到 ${results.length} 首匹配的詩詞`);
    return { results, totalProcessed: processed, totalLoaded: loaded };
  }

  // 舊版本的 loadPoetryData，保持向後兼容
  async loadPoetryData() {
    // 返回空陣列，不顯示靜態數據
    return [];
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
const dataManager = new DataManager();

function AdvancedSearch({ type, staticData, placeholder }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [language, setLanguage] = useState('traditional'); // 'traditional' 或 'simplified'
  const [displayCount, setDisplayCount] = useState(20); // 當前顯示的項目數量
  const [selectedRhymePatterns, setSelectedRhymePatterns] = useState(new Set()); // 詞牌韻格篩選
  
  // 詩詞動態載入相關狀態
  const [poetryOverLimit, setPoetryOverLimit] = useState(false); // 是否超過1000項
  const [poetryTotalFound, setPoetryTotalFound] = useState(0); // 實際找到的總數
  const [hasMorePoetry, setHasMorePoetry] = useState(true); // 是否還有更多詩詞可載入
  
  const itemsPerPage = 20;

  // 韻格選項
  const rhymePatterns = ['平韻格', '仄韻格', '通韻格', '換韻格', '未分類'];

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setProgress(0);
      
      try {
        let data = [];
        
        // 模拟加载进度
        for (let i = 0; i <= 30; i += 10) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (type === 'words') {
          data = await dataManager.loadWordsData();
        } else if (type === 'poetry') {
          data = await dataManager.loadPoetryData();
        } else if (type === 'cipou') {
          data = await dataManager.loadCipouData();
        }
        
        // 完成加载进度
        for (let i = 40; i <= 100; i += 20) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        setAllData(data);
        
        // 直接應用篩選邏輯而不依賴 useCallback
        let filteredData = data;
        if (type === 'cipou' && selectedRhymePatterns.size > 0) {
          filteredData = filteredData.filter(item => 
            selectedRhymePatterns.has(item.rhymePattern)
          );
        }
        
        // 詩詞模式不顯示靜態數據，其他模式正常顯示
        if (type === 'poetry') {
          setResults([]);
        } else {
          setResults(filteredData);
        }
        
        setDataLoaded(true);
        
      } catch (error) {
        console.error('載入數據出錯:', error);
        setAllData(staticData);
        setResults(staticData);
      } finally {
        setLoading(false);
        setProgress(100);
      }
    };
    
    loadData();
  }, [type, staticData, selectedRhymePatterns]);

  // 應用篩選邏輯
  const applyFilters = useCallback((data) => {
    let filteredData = data;
    
    // 詞牌韻格篩選
    if (type === 'cipou' && selectedRhymePatterns.size > 0) {
      filteredData = filteredData.filter(item => 
        selectedRhymePatterns.has(item.rhymePattern)
      );
    }
    
    return filteredData;
  }, [type, selectedRhymePatterns]);

  // AI搜索函数
  const handleAdvancedSearch = useCallback(async (searchQuery = query, additionalLoad = 0) => {
    let baseData = allData;
    
    // 先應用篩選
    baseData = applyFilters(baseData);
    
    if (!searchQuery.trim()) {
      setResults(baseData); // 無搜索時顯示所有篩選後的數據
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      let searchResults = [];
      
      if (type === 'poetry') {
        // 詩詞動態搜索
        const currentResultsCount = additionalLoad > 0 ? results.length : 0;
        const maxLoad = currentResultsCount + (additionalLoad || 1000);
        
        setProgress(30);
        const poetrySearchResult = await dataManager.searchPoetryData(searchQuery, currentResultsCount, maxLoad);
        
        if (additionalLoad > 0) {
          // 追加載入模式
          searchResults = [...results, ...poetrySearchResult.results];
        } else {
          // 新搜索模式
          searchResults = poetrySearchResult.results;
        }
        
        // 設置超過1000項目的狀態
        setPoetryOverLimit(searchResults.length >= 1000);
        setPoetryTotalFound(poetrySearchResult.totalLoaded);
        setHasMorePoetry(searchResults.length >= 1000); // 重置可載入更多狀態
        
      } else {
        // 原有的搜索邏輯 (詞語、詞牌)
        for (let i = 0; i <= 100; i += 10) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        searchResults = baseData.filter(item => {
          const text = (item.text || item.title || item.name || '').toLowerCase();
          const content = (item.content || '').toLowerCase();
          const author = (item.author || '').toLowerCase();
          const pinyin = (item.pinyin || '').toLowerCase();
          const jyutPinyin = (item.jyutPinyin || '').toLowerCase(); // 粵語拼音
          
          // 生成搜索變體 (原查詢、簡體、繁體)
          const searchVariants = dataManager.generateSearchVariants(searchQuery.toLowerCase());
          
          // 對每個變體進行搜索
          return searchVariants.some(variant => {
            return text.includes(variant) || 
                   content.includes(variant) || 
                   author.includes(variant) ||
                   pinyin.includes(variant) ||
                   jyutPinyin.includes(variant);
          });
        });
      }
      
      setResults(searchResults);
      
    } catch (error) {
      console.error('搜索出错:', error);
      setResults([]);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }, [allData, applyFilters, query, results, type]);

  // 僅用於篩選條件改變的搜索函數


  // 顯示項目計算
  const currentItems = results.slice(0, displayCount); // 顯示從開頭到當前顯示數量的項目

  // 轉換文本的輔助函數
  const convertText = (text) => {
    if (!text || !chineseConverter.isLoaded) return text;
    return chineseConverter.convertText(text, language);
  };

  // 切換語言
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'traditional' ? 'simplified' : 'traditional');
  };

  // 顯示更多項目
  const loadMoreItems = () => {
    setDisplayCount(prev => Math.min(prev + itemsPerPage, results.length));
  };

  // 顯示全部項目
  const showAllItems = () => {
    setDisplayCount(results.length);
  };

  // 載入更多詩詞 (1000項或全部)
  const loadMorePoetry = async (loadAll = false) => {
    if (type !== 'poetry' || loading) return;
    
    try {
      setLoading(true);
      const currentCount = results.length;
      const additionalLoad = loadAll ? 999999 : 1000;
      
      // 使用當前已載入的數量作為起始點，載入更多詩詞
      const searchResults = await dataManager.searchPoetryData(query, currentCount, currentCount + additionalLoad);
      
      if (searchResults && searchResults.results) {
        // 合併新結果到現有結果
        const newResults = [...results, ...searchResults.results];
        setResults(newResults);
        setDisplayCount(20); // 重置顯示數量為前20項
        
        // 更新詩詞總找到數量
        if (searchResults.totalLoaded) {
          setPoetryTotalFound(searchResults.totalLoaded);
        }
        
        // 檢查是否還有更多結果可載入
        const hasMoreResults = searchResults.results.length >= 1000;
        setHasMorePoetry(hasMoreResults);
        
        // 只在明確載入全部時關閉提示
        if (loadAll) {
          setPoetryOverLimit(false);
        } else if (newResults.length >= 1000) {
          // 當總結果數 >= 1000 時，保持提示框顯示
          setPoetryOverLimit(true);
        } else {
          // 總結果數 < 1000 時關閉提示框
          setPoetryOverLimit(false);
        }
        
        console.log(`📚 載入更多詩詞完成：新增 ${searchResults.results.length} 首，總計 ${newResults.length} 首，還有更多: ${hasMoreResults}`);
      }
    } catch (error) {
      console.error('載入更多詩詞失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置搜索時重置顯示數量
  useEffect(() => {
    setDisplayCount(20);
  }, [results]);

  // 篩選條件改變時重新應用篩選到當前結果
  useEffect(() => {
    if (dataLoaded && allData.length > 0) {
      const filteredData = applyFilters(allData);
      // 只有在沒有搜索詞的情況下才重置結果
      if (!query.trim()) {
        setResults(filteredData);
      }
    }
  }, [selectedRhymePatterns, allData, dataLoaded, query, applyFilters]);

  // 韻格篩選處理函數
  const handleRhymePatternToggle = (pattern) => {
    setSelectedRhymePatterns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pattern)) {
        newSet.delete(pattern);
      } else {
        newSet.add(pattern);
      }
      return newSet;
    });
  };

  // 加载项目详情 (按需加载)
  const loadItemDetails = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 搜索区域 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            onKeyPress={(e) => e.key === 'Enter' && handleAdvancedSearch(query)}
            disabled={loading}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button 
            onClick={toggleLanguage}
            style={{
              padding: '12px 20px',
              background: language === 'traditional' ? '#ff6b6b' : '#51cf66',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
            title="切換繁簡體"
          >
            {language === 'traditional' ? '繁' : '简'}
          </button>
          <button 
            onClick={() => {
              setPoetryOverLimit(false);
              setPoetryTotalFound(0);
              setHasMorePoetry(true);
              handleAdvancedSearch(query);
            }} 
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#ccc' : '#3faaff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? '搜尋中...' : '🔍 搜尋'}
          </button>
        </div>
        
        {/* 詞牌韻格篩選 */}
        {type === 'cipou' && (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              🎵 韻格分類篩選 (可多選):
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              {rhymePatterns.map(pattern => (
                <label 
                  key={pattern}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: selectedRhymePatterns.has(pattern) ? '#e3f2fd' : '#f5f5f5',
                    border: selectedRhymePatterns.has(pattern) ? '2px solid #2196f3' : '2px solid #ddd',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: selectedRhymePatterns.has(pattern) ? 'bold' : 'normal',
                    color: selectedRhymePatterns.has(pattern) ? '#1976d2' : '#666',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedRhymePatterns.has(pattern)) {
                      e.currentTarget.style.background = '#e8f4f8';
                      e.currentTarget.style.borderColor = '#81c784';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedRhymePatterns.has(pattern)) {
                      e.currentTarget.style.background = '#f5f5f5';
                      e.currentTarget.style.borderColor = '#ddd';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRhymePatterns.has(pattern)}
                    onChange={() => handleRhymePatternToggle(pattern)}
                    style={{ 
                      margin: 0,
                      transform: 'scale(1.1)'
                    }}
                  />
                  <span>{pattern}</span>
                </label>
              ))}
              
              {/* 清除篩選按鈕 */}
              {selectedRhymePatterns.size > 0 && (
                <button
                  onClick={() => setSelectedRhymePatterns(new Set())}
                  style={{
                    padding: '4px 8px',
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                  title="清除所有篩選"
                >
                  ✕ 清除
                </button>
              )}
            </div>
            
            {/* 篩選統計 */}
            {selectedRhymePatterns.size > 0 && (
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginTop: '6px' 
              }}>
                已選擇 {selectedRhymePatterns.size} 個韻格分類
              </div>
            )}
          </div>
        )}
        
        {/* 进度条 */}
        {loading && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              width: '100%', 
              height: '4px', 
              background: '#f0f0f0', 
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #90ffbb, #90ffcc)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              搜尋進度: {Math.round(progress)}%
            </div>
          </div>
        )}
        
        {/* 结果统计 */}
        <div style={{ color: '#666', fontSize: '14px' }}>
          {query ? `"${query}" 找到 ${results.length} 個結果` : 
           dataLoaded ? `已載入 ${allData.length} 個項目，顯示 ${results.length} 個` : 
           `正在載入數據...`}
        </div>
      </div>

      {/* 詩詞超過1000項提示 - 移到頂部 */}
      {type === 'poetry' && poetryOverLimit && (
        <div style={{
          background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
          border: '2px solid #ffc107',
          borderRadius: '10px',
          padding: '20px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#856404', marginBottom: '10px' }}>
            ⚠️ {convertText('搜索結果超過 1000 項')}
          </div>
          <div style={{ color: '#856404', marginBottom: '15px' }}>
            {convertText(poetryTotalFound > 0 ? 
              `目前已載入 ${results.length} 首詩詞，預計總共約 ${poetryTotalFound} 首，還有更多結果可載入` :
              `目前已載入 ${results.length} 首詩詞，還有更多結果可載入`)}
          </div>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {hasMorePoetry && (
              <button
                onClick={() => loadMorePoetry(false)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📊 {convertText('載入更多 1000 項')}
            </button>
            )}
            {hasMorePoetry && (
              <button
                onClick={() => loadMorePoetry(true)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ⚡ {convertText('載入全部結果')}
              </button>
            )}
            {!hasMorePoetry && (
              <div style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                ✅ {convertText('已載入所有結果')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 结果列表 - 20个一页 */}
      <div style={{ marginBottom: '20px' }}>
        {currentItems.map((item, index) => (
          <div 
            key={`${item.type || type}-${item.id}-${index}`}
            onClick={() => loadItemDetails(item)}
            style={{
              background: '#fff',
              padding: '16px',
              margin: '8px 0',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            {/* 词语类型 */}
            {(item.type === 'word' || type === 'words') && (
              <div>
                <div style={{ marginBottom: '4px' }}>
                  <strong style={{ fontSize: '18px', color: '#111100' }}>{convertText(item.text)}</strong>
                </div>
                <div style={{ color: '#7f8c8d', marginTop: '4px' }}>
                  {item.jyutPinyin && <div style={{ color: '#e67e22', fontWeight: 'bold' }}>粵韻: {item.jyutPinyin}</div>}
                </div>
              </div>
            )}
            
            {/* 詩詞類型 */}
            {(item.type === 'poetry' || type === 'poetry') && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '18px', color: '#6890ff' }}>{convertText(item.title)}</strong>
                  <span style={{ 
                    background: '#3f80ff', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {item.score || 0}分
                  </span>
                </div>
                <div style={{ color: '#7f8c8d', marginTop: '4px' }}>
                  {convertText(item.dynasty)} · {convertText(item.author)}
                </div>
                <div style={{ color: '#95a5a6', marginTop: '4px', fontSize: '14px' }}>
                  {item.content ? convertText(item.content.substring(0, 30)) + '...' : convertText('點擊查看詳情')}
                </div>
              </div>
            )}
            
            {/* 詞牌類型 */}
            {(item.type === 'cipou' || type === 'cipou') && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '18px', color: '#ffcc7b' }}>{convertText(item.name)}</strong>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {/* 韻格標籤 */}
                    {item.rhymePattern && (
                      <span style={{ 
                        background: item.rhymePattern === '平韻格' ? '#e8f5e8' : 
                                  item.rhymePattern === '仄韻格' ? '#fff3e0' : 
                                  item.rhymePattern === '通韻格' ? '#e3f2fd' : 
                                  item.rhymePattern === '換韻格' ? '#f3e5f5' : '#f5f5f5',
                        color: item.rhymePattern === '平韻格' ? '#2e7d32' : 
                               item.rhymePattern === '仄韻格' ? '#f57c00' : 
                               item.rhymePattern === '通韻格' ? '#1976d2' : 
                               item.rhymePattern === '換韻格' ? '#7b1fa2' : '#666',
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '1px solid currentColor'
                      }}>
                        🎵 {item.rhymePattern}
                      </span>
                    )}
                    <span style={{ 
                      background: '#fff500', 
                      color: '#111100', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      詞牌
                    </span>
                    {item.variants && (
                      <span style={{ 
                        background: '#ffcc7b', 
                        color: '#111100', 
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {item.variants.length}個變體
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ color: '#7f8c8d', marginTop: '4px' }}>
                  {item.variants && item.variants.length > 0 ? 
                    item.variants[0].introduction : 
                    (item.desc || item.description || '點擊查看詞牌格式')
                  }
                </div>
                {item.variants && item.variants.length > 0 && (
                  <div style={{ color: '#95a5a6', marginTop: '4px', fontSize: '14px' }}>
                    主要作者: {item.variants.filter(v => v.isMain).map(v => v.author).join('、') || 
                             item.variants[0].author}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>



      {/* 顯示更多按鍵 */}
      {displayCount < results.length && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '30px 0'
        }}>
          <div style={{ 
            color: '#666', 
            marginBottom: '15px', 
            fontSize: '14px' 
          }}>
            {convertText(`顯示 ${displayCount} / ${results.length} 個結果`)}
          </div>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={loadMoreItems}
              style={{
                padding: '12px 24px',
                border: '2px solid #3faaff',
                background: '#fff',
                color: '#3faaff',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#3faaff';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#3faaff';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              📄 {convertText('顯示更多')} ({Math.min(itemsPerPage, results.length - displayCount)} {convertText('項')})
            </button>
            
            {results.length - displayCount > itemsPerPage && (
              <button
                onClick={showAllItems}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #4caf50',
                  background: '#fff',
                  color: '#4caf50',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#4caf50';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.color = '#4caf50';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                📋 {convertText('顯示全部')} ({results.length - displayCount} {convertText('項')})
              </button>
            )}
          </div>
          
          <div style={{ 
            color: '#999', 
            marginTop: '15px', 
            fontSize: '12px',
            textAlign: 'center'
          }}>
            {convertText('每次載入')} {itemsPerPage} {convertText('項')} | {convertText('剩餘')} {results.length - displayCount} {convertText('項')}
          </div>
        </div>
      )}

      {/* 全部加載完成提示 */}
      {displayCount >= results.length && results.length > 20 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px 0',
          color: '#999',
          fontSize: '14px'
        }}>
          ✅ {convertText(`已顯示全部 ${results.length} 個結果`)}
        </div>
      )}

      {/* 详情弹窗 - 懒加载详细信息 */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedItem(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>
            
            <div>
              {(selectedItem.type === 'poetry' || type === 'poetry') && (
                <div>
                  <h2 style={{ color: '#6890ff', marginBottom: '15px' }}>{convertText(selectedItem.title)}</h2>
                  <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
                    {convertText(selectedItem.dynasty)} · {convertText(selectedItem.author)}
                  </p>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '20px', 
                    borderRadius: '8px',
                    lineHeight: '1.8',
                    fontSize: '16px',
                    textAlign: 'center'
                  }}>
                    {convertText(selectedItem.content)}
                  </div>
                  {selectedItem.score && (
                    <p style={{ marginTop: '15px', color: '#666' }}>
                      <strong>{convertText('搜尋評分')}:</strong> {selectedItem.score}{convertText('分')}
                    </p>
                  )}
                </div>
              )}
              
              {(selectedItem.type === 'word' || type === 'words') && (
                <div>
                  <h2 style={{ color: '#3faaff', marginBottom: '15px' }}>{convertText(selectedItem.text)}</h2>
                  {selectedItem.jyutPinyin && (
                    <p style={{ fontSize: '18px', marginTop: '20px' }}>
                      <strong>粵韻:</strong> <span style={{ color: '#e67e22', fontWeight: 'bold', fontSize: '20px' }}>{selectedItem.jyutPinyin}</span>
                    </p>
                  )}
                  {!selectedItem.jyutPinyin && (
                    <p style={{ color: '#95a5a6', fontStyle: 'italic' }}>此詞語暫無粵韻資料</p>
                  )}
                </div>
              )}
              
              {(selectedItem.type === 'cipou' || type === 'cipou') && (
                <div>
                  <h2 style={{ color: '#ffcc7b', marginBottom: '15px' }}>{convertText(selectedItem.name)}</h2>
                  
                  {selectedItem.variants && selectedItem.variants.map((variant, index) => (
                    <div key={index} style={{ 
                      background: variant.isMain ? '#fff9e6' : '#f8f9fa', 
                      padding: '15px', 
                      borderRadius: '8px',
                      margin: '10px 0',
                      border: variant.isMain ? '2px solid #fff500' : '1px solid #e0e0e0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ color: '#111100', margin: 0 }}>
                          {convertText(variant.author)} {variant.isMain && <span style={{ color: '#ff6600' }}>★ {convertText('主譜')}</span>}
                        </h4>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          {variant.size}字
                        </span>
                      </div>
                      
                      <p style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
                        {convertText(variant.introduction)}
                      </p>
                      
                      {/* 平仄譜 */}
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#111100' }}>{convertText('平仄譜')}：</strong>
                        
                        {/* 圖例說明 */}
                        <div style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
                          <span style={{ color: '#2196F3' }}>■ {convertText('平聲')}</span>{' '}
                          <span style={{ color: '#FF5722' }}>■ {convertText('仄聲')}</span>{' '}
                          <span style={{ color: '#9C27B0' }}>■ {convertText('中(原聲為平)')}</span>{' '}
                          <span style={{ color: '#E91E63' }}>■ {convertText('中(原聲為仄)')}</span>{' '}
                          <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>■ {convertText('押韻')}</span>
                        </div>
                        
                        <div style={{ 
                          background: '#f0f0f0', 
                          padding: '10px', 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          marginTop: '5px',
                          lineHeight: '1.6'
                        }}>
                          {variant.content.split('|').map((line, i) => (
                            <div key={i} style={{ margin: '5px 0' }}>
                              {line.split('').map((char, j) => {
                                if (char === '0') return <span key={j} style={{ color: '#2196F3' }}>{convertText('平')}</span>;
                                if (char === '1') return <span key={j} style={{ color: '#FF5722' }}>{convertText('仄')}</span>;
                                if (char === '2') return <span key={j} style={{ color: '#9C27B0' }}>{convertText('中')}</span>;
                                if (char === '3') return <span key={j} style={{ color: '#E91E63' }}>{convertText('中')}</span>;
                                if (char === 'a' || char === 'A') return <span key={j} style={{ color: '#4CAF50', fontWeight: 'bold' }}>{convertText('押')}</span>;
                                return <span key={j}>{char}</span>;
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* 原譜例詞 */}
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#111100' }}>{convertText('原譜例詞')}：</strong>
                        <div style={{ 
                          background: '#f8f9fa', 
                          padding: '15px', 
                          borderRadius: '4px',
                          fontSize: '16px',
                          lineHeight: '1.8',
                          marginTop: '5px',
                          textAlign: 'center',
                          color: '#333'
                        }}>
                          {variant.example.split('|').map((line, i) => (
                            <div key={i} style={{ margin: '5px 0' }}>{convertText(line)}</div>
                          ))}
                        </div>
                      </div>
                      
                      {/* 說明 */}
                      {variant.description && (
                        <div>
                          <strong style={{ color: '#111100' }}>{convertText('說明')}：</strong>
                          <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                            {convertText(variant.description)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {selectedItem.score && (
                    <p style={{ marginTop: '15px', color: '#666' }}>
                      <strong>搜索評分:</strong> {selectedItem.score}分
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 詩詞模式專用提示 */}
      {!loading && results.length === 0 && !query && type === 'poetry' && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📜</div>
          <h3>{convertText('請輸入關鍵字搜尋詩詞')}</h3>
          <p style={{ marginTop: '10px' }}>{convertText('支援搜尋詩名、作者、詩句內容')}</p>
        </div>
      )}

      {/* 无结果提示 */}
      {!loading && results.length === 0 && query && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
          <h3>{convertText('找不到')} "{query}" {convertText('的相關結果')}</h3>
          <p style={{ marginTop: '10px' }}>{convertText('請嘗試其他關鍵字')}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  const [view, setView] = useState('words');

  return (
    <div style={{ minHeight: '100vh', background: '#fefee6' }}>
      {/* 导航栏 */}
      <div style={{ 
        background: 'linear-gradient(90deg, #111100 0%, #d9d9d9 100%)', 
        padding: '15px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '15px',
          padding: '0 20px',
          flexWrap: 'wrap'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <img 
              src="/logo-header.png" 
              alt="Interpolate You Logo" 
              style={{
                height: '40px',
                width: 'auto'
              }}
            />
            <h1 style={{
              color: 'white',
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              🔍 詩詞搜尋
            </h1>
          </div>
          
          {/* 導航按鍵 */}
          <div style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
          {['words', 'poetry', 'cipou'].map(type => (
            <button 
              key={type}
              onClick={() => setView(type)}
              style={{
                padding: '10px 20px',
                background: view === type ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                color: view === type ? '#333' : 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: view === type ? 'bold' : 'normal'
              }}
              onMouseEnter={(e) => {
                if (view !== type) {
                  e.target.style.background = 'rgba(255,255,255,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== type) {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                }
              }}
            >
              {type === 'words' ? '📝 詞語搜尋' : type === 'poetry' ? '📜 詩詞搜尋' : '🎵 詞牌搜尋'}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* 搜索组件 */}
      <AdvancedSearch 
        type={view} 
        staticData={dataManager[`getStatic${view === 'words' ? 'Words' : view === 'poetry' ? 'Poetry' : 'Cipou'}`]()} 
        placeholder={`搜尋${view === 'words' ? '詞語' : view === 'poetry' ? '詩詞' : '詞牌'}...`}
      />
    </div>
  );
}

export default App;
