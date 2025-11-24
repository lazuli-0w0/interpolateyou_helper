// 測試詞牌韻格篩選問題
console.log('🔍 測試詞牌韻格篩選...');

// 模擬測試數據
const testCipouData = [
  {
    id: 1,
    name: '水調歌頭',
    rhymePattern: '平韻格',
    variants: [{ description: '平韻格式' }]
  },
  {
    id: 2,
    name: '念奴嬌',
    rhymePattern: '仄韻格',
    variants: [{ description: '仄韻格式' }]
  },
  {
    id: 3,
    name: '滿江紅',
    rhymePattern: '換韻格',
    variants: [{ description: '換韻格式' }]
  }
];

// 模擬篩選函數
function applyFilters(data, selectedRhymePatterns) {
  console.log('📋 原始數據:', data.map(item => ({ name: item.name, rhymePattern: item.rhymePattern })));
  console.log('🎯 選中韻格:', Array.from(selectedRhymePatterns));
  
  let filteredData = data;
  
  if (selectedRhymePatterns.size > 0) {
    filteredData = filteredData.filter(item => {
      console.log(`🔍 檢查 ${item.name}: rhymePattern="${item.rhymePattern}", 是否選中: ${selectedRhymePatterns.has(item.rhymePattern)}`);
      return selectedRhymePatterns.has(item.rhymePattern);
    });
  }
  
  console.log('✅ 篩選結果:', filteredData.map(item => ({ name: item.name, rhymePattern: item.rhymePattern })));
  return filteredData;
}

// 測試案例 1: 選擇平韻格
console.log('\n🧪 測試案例 1: 選擇平韻格');
const selectedPatterns1 = new Set(['平韻格']);
const result1 = applyFilters(testCipouData, selectedPatterns1);
console.log(`結果數量: ${result1.length}, 預期: 1`);

// 測試案例 2: 選擇多個韻格
console.log('\n🧪 測試案例 2: 選擇平韻格和仄韻格');
const selectedPatterns2 = new Set(['平韻格', '仄韻格']);
const result2 = applyFilters(testCipouData, selectedPatterns2);
console.log(`結果數量: ${result2.length}, 預期: 2`);

// 測試案例 3: 不選擇任何韻格
console.log('\n🧪 測試案例 3: 不選擇任何韻格');
const selectedPatterns3 = new Set();
const result3 = applyFilters(testCipouData, selectedPatterns3);
console.log(`結果數量: ${result3.length}, 預期: 3`);

console.log('\n💡 可能的問題:');
console.log('1. 數據載入時 rhymePattern 屬性未正確設置');
console.log('2. selectedRhymePatterns 中的值與實際 rhymePattern 不匹配');
console.log('3. 篩選邏輯在數據載入完成前就執行了');
console.log('4. Set 的 has() 方法字符串比較問題');

console.log('\n✅ 韻格篩選邏輯測試完成！');