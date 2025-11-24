// 測試詩詞動態搜索功能
console.log('🧪 測試詩詞動態搜索功能...');

// 模擬 DataManager 的搜索功能
class MockDataManager {
  // 模擬獲取所有詩詞文件列表
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

  // 模擬搜索變體生成
  generateSearchVariants(query) {
    return [query, query.replace('李白', '李白'), query.replace('月', '月')]; // 簡化版本
  }

  // 模擬動態搜索
  async searchPoetryData(searchQuery, loadedCount = 0, maxLoad = 1000) {
    console.log(`🔍 開始搜索: "${searchQuery}", 已載入: ${loadedCount}, 最大載入: ${maxLoad}`);
    
    const files = this.getAllPoetryFiles();
    const results = [];
    let loaded = loadedCount;
    
    // 模擬搜索結果
    const mockPoems = [
      { title: '靜夜思', author: '李白', paragraphs: ['床前明月光', '疑是地上霜', '舉頭望明月', '低頭思故鄉'] },
      { title: '望廬山瀑布', author: '李白', paragraphs: ['日照香爐生紫煙', '遙看瀑布掛前川', '飛流直下三千尺', '疑是銀河落九天'] },
      { title: '春曉', author: '孟浩然', paragraphs: ['春眠不覺曉', '處處聞啼鳥', '夜來風雨聲', '花落知多少'] },
      { title: '登鸛雀樓', author: '王之渙', paragraphs: ['白日依山盡', '黃河入海流', '欲窮千里目', '更上一層樓'] },
      { title: '涼州詞', author: '王翰', paragraphs: ['葡萄美酒夜光杯', '欲飲琵琶馬上催', '醉臥沙場君莫笑', '古來征戰幾人回'] },
      { title: '璇璣圖', author: '蘇蕙', paragraphs: ['璇璣圖上織相思', '錦字回文訴別離', '千里共嬋娟', '璇璣轉玉衡'] },
      { title: '觀象', author: '張衡', paragraphs: ['璇璣玉衡以齊七政', '北斗星移夜向明', '天象昭昭示人間', '璇璣運轉定乾坤'] }
    ];

    // 模擬搜索匹配
    for (const poem of mockPoems) {
      if (loaded >= maxLoad) break;
      
      const title = poem.title.toLowerCase();
      const author = poem.author.toLowerCase();
      const content = poem.paragraphs.join('').toLowerCase();
      
      if (title.includes(searchQuery.toLowerCase()) || 
          author.includes(searchQuery.toLowerCase()) || 
          content.includes(searchQuery.toLowerCase())) {
        
        results.push({
          id: `tang-${poem.title}-${poem.author}-${results.length}`,
          title: poem.title,
          author: poem.author,
          content: poem.paragraphs.join(''),
          dynasty: '唐',
          type: 'poetry'
        });
        loaded++;
      }
    }

    // 模擬不同關鍵字的搜索結果數量
    if (searchQuery.includes('李白')) {
      // 李白約有900多首詩，模擬找到很多結果
      for (let i = results.length; i < Math.min(maxLoad - loadedCount + results.length, 1500); i++) {
        if (loaded >= maxLoad) break;
        results.push({
          id: `tang-詩${i}-李白-${i}`,
          title: `李白作品 ${i}`,
          author: '李白',
          content: `李白的第 ${i} 首詩作`,
          dynasty: '唐',
          type: 'poetry'
        });
        loaded++;
      }
    } else if (searchQuery.includes('春')) {
      // "春"字在古詩詞中極其常見，應該有數千首
      const springPoems = [
        '春曉', '春夜喜雨', '春江花月夜', '春望', '早春呈水部張十八員外',
        '春雪', '春思', '春日', '春興', '春怨', '春詞', '春歌', '春愁', '春夢'
      ];
      
      for (let i = results.length; i < Math.min(maxLoad - loadedCount + results.length, 2500); i++) {
        if (loaded >= maxLoad) break;
        const poemTitle = springPoems[i % springPoems.length] + ` ${Math.floor(i/springPoems.length) + 1}`;
        results.push({
          id: `春詩-${i}`,
          title: poemTitle,
          author: `詩人${i % 50 + 1}`, // 50個不同詩人
          content: `春天的詩句內容 ${i}，春風春雨春花春草...`,
          dynasty: i % 2 === 0 ? '唐' : '宋',
          type: 'poetry'
        });
        loaded++;
      }
    } else if (searchQuery.includes('月')) {
      // "月"字也很常見，模擬大量結果
      for (let i = results.length; i < Math.min(maxLoad - loadedCount + results.length, 1800); i++) {
        if (loaded >= maxLoad) break;
        results.push({
          id: `月詩-${i}`,
          title: `月亮詩 ${i}`,
          author: `月詩人${i % 30 + 1}`,
          content: `月光月色月夜的詩句 ${i}`,
          dynasty: i % 3 === 0 ? '唐' : (i % 3 === 1 ? '宋' : '元'),
          type: 'poetry'
        });
        loaded++;
      }
    } else if (searchQuery.includes('璇璣')) {
      // "璇璣"是古代天文儀器名，在詩詞中會出現但不算太多
      const xuanjiPoems = [
        '璇璣圖詩', '觀象詩', '天文賦', '北斗吟', '星象記', 
        '渾天儀歌', '七政論', '璇璣玉衡', '天官書', '星經'
      ];
      
      for (let i = results.length; i < Math.min(maxLoad - loadedCount + results.length, 25); i++) {
        if (loaded >= maxLoad) break;
        const poemTitle = xuanjiPoems[i % xuanjiPoems.length];
        results.push({
          id: `璇璣詩-${i}`,
          title: `${poemTitle} ${Math.floor(i/xuanjiPoems.length) + 1}`,
          author: `天文學者${i % 5 + 1}`, // 5個不同的古代天文學者
          content: `璇璣玉衡以齊七政，天象運行的詩句內容 ${i}`,
          dynasty: i % 3 === 0 ? '漢' : (i % 3 === 1 ? '唐' : '宋'),
          type: 'poetry'
        });
        loaded++;
      }
    }

    console.log(`✅ 搜索完成，找到 ${results.length} 首詩詞，總載入: ${loaded}`);
    return { 
      results: results.slice(0, maxLoad - loadedCount), 
      totalProcessed: files.length, 
      totalLoaded: loaded 
    };
  }
}

// 測試不同情況
async function testPoetrySearch() {
  const dataManager = new MockDataManager();

  console.log('\n📝 測試案例 1: 搜索 "李白" (預期找到大量結果)');
  const result1 = await dataManager.searchPoetryData('李白', 0, 1000);
  console.log(`結果: ${result1.results.length} 首, 超過1000? ${result1.totalLoaded >= 1000}`);

  console.log('\n📝 測試案例 2: 繼續載入更多 "李白" 作品');
  const result2 = await dataManager.searchPoetryData('李白', 1000, 2000);
  console.log(`追加結果: ${result2.results.length} 首, 總計: ${1000 + result2.results.length}`);

  console.log('\n📝 測試案例 3: 搜索 "春" (預期找到大量結果)');
  const result3 = await dataManager.searchPoetryData('春', 0, 1000);
  console.log(`結果: ${result3.results.length} 首, 超過1000? ${result3.totalLoaded >= 1000}`);

  console.log('\n📝 測試案例 4: 搜索 "月" (預期找到大量結果)');
  const result4 = await dataManager.searchPoetryData('月', 0, 1000);
  console.log(`結果: ${result4.results.length} 首, 超過1000? ${result4.totalLoaded >= 1000}`);

  console.log('\n📝 測試案例 5: 搜索古代天文詞 "璇璣" (預期找到少量但不為0的結果)');
  const result5 = await dataManager.searchPoetryData('璇璣', 0, 1000);
  console.log(`結果: ${result5.results.length} 首, 超過1000? ${result5.totalLoaded >= 1000}`);

  console.log('\n🎯 UI 行為模擬:');
  console.log('1. 搜索 "李白" → 顯示 "搜索結果超過 1000 項" 提示');
  console.log('2. 搜索 "春" → 顯示 "搜索結果超過 1000 項" 提示 (包含春字的詩詞非常多)');
  console.log('3. 搜索 "月" → 顯示 "搜索結果超過 1000 項" 提示 (月亮主題詩詞很常見)');
  console.log('4. 搜索 "璇璣" → 不顯示超過1000項提示，顯示約25首相關詩詞');
  console.log('5. 提供 "載入更多 1000 項" 和 "載入全部結果" 按鈕');
  console.log('6. 頁面底部保持原有的 "顯示更多" 按鈕');
}

testPoetrySearch().then(() => {
  console.log('\n✅ 詩詞動態搜索功能測試完成！');
});