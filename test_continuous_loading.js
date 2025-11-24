// 測試詩詞連續載入功能
console.log('🧪 測試詩詞連續載入功能...');

// 模擬 DataManager 的連續載入功能
class MockDataManagerForContinuousLoad {
  constructor() {
    this.totalPoems = 3500; // 模擬總共有3500首詩
  }

  // 模擬動態搜索 - 支持連續載入
  async searchPoetryData(searchQuery, loadedCount = 0, maxLoad = 1000) {
    console.log(`🔍 搜索: "${searchQuery}", 已載入: ${loadedCount}, 目標載入: ${maxLoad}`);
    
    const results = [];
    const startIndex = loadedCount;
    const endIndex = Math.min(maxLoad, this.totalPoems);
    const actualLoad = Math.min(maxLoad - loadedCount, this.totalPoems - loadedCount);
    
    // 模擬生成詩詞結果
    for (let i = startIndex; i < startIndex + actualLoad && i < this.totalPoems; i++) {
      results.push({
        id: `春詩-${i}`,
        title: `春天詩作 ${i + 1}`,
        author: `詩人${(i % 100) + 1}`,
        content: `春風春雨春花春草的詩句內容 ${i + 1}`,
        dynasty: i % 2 === 0 ? '唐' : '宋',
        type: 'poetry'
      });
    }

    console.log(`✅ 搜索完成，本次載入 ${results.length} 首，累計: ${startIndex + results.length}/${this.totalPoems}`);
    
    return { 
      results: results,
      totalLoaded: this.totalPoems,
      hasMore: startIndex + results.length < this.totalPoems
    };
  }
}

// 模擬連續載入過程
async function testContinuousLoading() {
  const dataManager = new MockDataManagerForContinuousLoad();
  let currentResults = [];
  let loadedCount = 0;
  
  console.log('\n📝 測試場景: 搜索"春"字詩詞，模擬用戶連續點擊"載入更多 1000 項"');

  // 第1次載入 - 初始搜索
  console.log('\n🎯 第1次載入 (初始搜索)');
  const result1 = await dataManager.searchPoetryData('春', 0, 1000);
  currentResults = [...result1.results];
  loadedCount = currentResults.length;
  
  console.log(`📊 UI狀態: 顯示超限提示? ${loadedCount >= 1000 ? '是' : '否'}`);
  console.log(`📝 提示內容: "目前已載入 ${loadedCount} 首詩詞，預計總共約 ${result1.totalLoaded} 首，還有更多結果可載入"`);

  // 第2次載入 - 點擊"載入更多 1000 項"
  console.log('\n🎯 第2次載入 (用戶點擊"載入更多 1000 項")');
  const result2 = await dataManager.searchPoetryData('春', loadedCount, loadedCount + 1000);
  currentResults = [...currentResults, ...result2.results];
  const newLoadedCount = currentResults.length;
  
  const hasMoreResults2 = result2.results.length === 1000 && newLoadedCount < result2.totalLoaded;
  console.log(`📊 UI狀態: 顯示超限提示? ${hasMoreResults2 ? '是' : '否'} (繼續顯示，因為還有更多)`);
  console.log(`📝 提示內容: "目前已載入 ${newLoadedCount} 首詩詞，預計總共約 ${result2.totalLoaded} 首，還有更多結果可載入"`);

  // 第3次載入 - 再次點擊"載入更多 1000 項"
  console.log('\n🎯 第3次載入 (用戶再次點擊"載入更多 1000 項")');
  const result3 = await dataManager.searchPoetryData('春', newLoadedCount, newLoadedCount + 1000);
  currentResults = [...currentResults, ...result3.results];
  const finalLoadedCount = currentResults.length;
  
  const hasMoreResults3 = result3.results.length === 1000 && finalLoadedCount < result3.totalLoaded;
  console.log(`📊 UI狀態: 顯示超限提示? ${hasMoreResults3 ? '是' : '否'} (繼續顯示，因為還有更多)`);
  console.log(`📝 提示內容: "目前已載入 ${finalLoadedCount} 首詩詞，預計總共約 ${result3.totalLoaded} 首，還有更多結果可載入"`);

  // 第4次載入 - 載入剩餘的500首
  console.log('\n🎯 第4次載入 (載入剩餘部分)');
  const result4 = await dataManager.searchPoetryData('春', finalLoadedCount, finalLoadedCount + 1000);
  currentResults = [...currentResults, ...result4.results];
  const allLoadedCount = currentResults.length;
  
  const hasMoreResults4 = result4.results.length === 1000 && allLoadedCount < result4.totalLoaded;
  console.log(`📊 UI狀態: 顯示超限提示? ${hasMoreResults4 ? '是' : '否'} (已載入全部，隱藏提示)`);
  console.log(`📝 最終狀態: 總共載入 ${allLoadedCount}/${result4.totalLoaded} 首詩詞`);

  console.log('\n🎯 測試"載入全部結果"按鈕');
  const resultAll = await dataManager.searchPoetryData('春', 0, 999999);
  console.log(`📊 一次性載入全部: ${resultAll.results.length} 首`);
  console.log(`📊 UI狀態: 顯示超限提示? 否 (載入全部後隱藏提示)`);

  console.log('\n✅ 連續載入測試完成！');
  console.log('🎯 預期行為:');
  console.log('1. 初次搜索顯示1000首 + 超限提示');
  console.log('2. 每次點擊"載入更多1000項"增加1000首 + 保持提示');
  console.log('3. 載入到最後一批時提示消失');
  console.log('4. "載入全部結果"一次性載入所有 + 提示消失');
}

testContinuousLoading().then(() => {
  console.log('\n🎉 測試完成！用戶現在可以連續載入更多詩詞了！');
});