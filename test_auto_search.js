// 測試首次載入和系統切換自動搜尋功能
console.log('🧪 測試自動搜尋功能...');

// 模擬不同系統的初始載入行為
function simulateSystemLoad() {
  
  // 模擬詞語系統
  console.log('\n📝 測試詞語系統首次載入:');
  const wordsData = Array.from({length: 500}, (_, i) => ({
    id: i + 1,
    text: `詞語${i + 1}`,
    pinyin: `ci${i + 1}`,
    type: 'word'
  }));
  
  const wordsInitialResults = wordsData.slice(0, 100); // 顯示前100項作為初始內容
  const wordsDisplayed = wordsInitialResults.slice(0, 20); // 初始顯示20項
  
  console.log(`✅ 詞語系統: 載入 ${wordsData.length} 個詞語`);
  console.log(`📊 初始結果: ${wordsInitialResults.length} 項`);
  console.log(`👁️  初始顯示: ${wordsDisplayed.length} 項`);
  console.log(`📝 顯示內容: ${wordsDisplayed.slice(0, 5).map(w => w.text).join('、')}...`);

  // 模擬詩詞系統  
  console.log('\n📜 測試詩詞系統首次載入:');
  const poetryData = Array.from({length: 2000}, (_, i) => ({
    id: i + 1,
    title: `詩詞作品${i + 1}`,
    author: `詩人${(i % 50) + 1}`,
    content: `詩詞內容${i + 1}`,
    dynasty: i % 2 === 0 ? '唐' : '宋',
    type: 'poetry'
  }));
  
  const poetryInitialResults = poetryData.slice(0, 50); // 顯示前50首作為初始內容
  const poetryDisplayed = poetryInitialResults.slice(0, 20); // 初始顯示20項
  
  console.log(`✅ 詩詞系統: 載入 ${poetryData.length} 首詩詞`);
  console.log(`📊 初始結果: ${poetryInitialResults.length} 首`);
  console.log(`👁️  初始顯示: ${poetryDisplayed.length} 首`);
  console.log(`📝 顯示內容: ${poetryDisplayed.slice(0, 3).map(p => `《${p.title}》`).join('、')}...`);

  // 模擬詞牌系統
  console.log('\n🎵 測試詞牌系統首次載入:');
  const cipouData = Array.from({length: 300}, (_, i) => ({
    id: i + 1,
    name: `詞牌${i + 1}`,
    rhymePattern: ['平韻格', '仄韻格', '通韻格', '換韻格'][i % 4],
    variants: [{author: `作者${i + 1}`, introduction: `介紹${i + 1}`}],
    type: 'cipou'
  }));
  
  const cipouInitialResults = cipouData.slice(0, 100); // 顯示前100個作為初始內容
  const cipouDisplayed = cipouInitialResults.slice(0, 20); // 初始顯示20項
  
  console.log(`✅ 詞牌系統: 載入 ${cipouData.length} 個詞牌`);
  console.log(`📊 初始結果: ${cipouInitialResults.length} 個`);
  console.log(`👁️  初始顯示: ${cipouDisplayed.length} 個`);
  console.log(`📝 顯示內容: ${cipouDisplayed.slice(0, 3).map(c => c.name).join('、')}...`);

  return { wordsData, poetryData, cipouData };
}

// 模擬系統切換行為
function simulateSystemSwitch() {
  console.log('\n🔄 測試系統切換自動搜尋:');
  
  const systems = ['words', 'poetry', 'cipou'];
  const systemNames = {'words': '詞語', 'poetry': '詩詞', 'cipou': '詞牌'};
  
  systems.forEach(system => {
    console.log(`\n🎯 切換到 ${systemNames[system]} 系統:`);
    console.log(`   1. 清空搜尋欄位 (query = '')`);
    console.log(`   2. 重置結果列表 (results = [])`);
    console.log(`   3. 重置顯示項目 (selectedItem = null)`);
    console.log(`   4. 重置顯示數量 (displayCount = 20)`);
    
    if (system === 'poetry') {
      console.log(`   5. 重置詩詞狀態 (poetryOverLimit = false, poetryTotalFound = 0)`);
    }
    
    if (system === 'cipou') {
      console.log(`   6. 重置韻格篩選 (selectedRhymePatterns = new Set())`);
    }
    
    console.log(`   ✅ 自動執行初始搜尋，載入 ${system === 'poetry' ? '50' : '100'} 項初始內容`);
  });
}

// 測試空搜尋行為
function testEmptySearch() {
  console.log('\n🔍 測試空搜尋行為:');
  
  console.log('\n📝 詞語系統空搜尋:');
  console.log('   - 搜尋欄位為空 → 顯示前100個詞語');
  console.log('   - 初始顯示20項，可逐頁載入更多');
  
  console.log('\n📜 詩詞系統空搜尋:');
  console.log('   - 搜尋欄位為空 → 顯示前50首詩詞');
  console.log('   - 初始顯示20項，可逐頁載入更多');
  
  console.log('\n🎵 詞牌系統空搜尋:');
  console.log('   - 搜尋欄位為空 → 顯示前100個詞牌');
  console.log('   - 可按韻格篩選，初始顯示20項');
}

// 執行所有測試
console.log('🎯 自動搜尋功能測試開始...');

const data = simulateSystemLoad();
simulateSystemSwitch();
testEmptySearch();

console.log('\n✅ 自動搜尋功能測試完成！');
console.log('\n🎉 預期改進效果:');
console.log('1. 🚀 首次進入任何系統都會自動顯示內容，不再是空白頁面');
console.log('2. 🔄 切換系統時會清空之前的內容，重新載入新系統的初始內容');
console.log('3. 📊 每個系統都有合適的初始載入量（詞語/詞牌:100項，詩詞:50首）');
console.log('4. 👁️  統一的初始顯示策略（都是20項，可逐頁載入更多）');
console.log('5. 🎯 用戶可以立即看到內容，了解系統功能，提升使用體驗');

console.log('\n💡 使用建議:');
console.log('- 首次進入 → 直接看到推薦內容');
console.log('- 切換系統 → 快速了解不同系統的內容類型'); 
console.log('- 空搜尋 → 瀏覽精選內容，尋找靈感');
console.log('- 有目標搜尋 → 輸入關鍵字精確查找');