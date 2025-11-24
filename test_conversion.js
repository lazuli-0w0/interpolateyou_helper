// 測試繁簡轉換功能
const fs = require('fs');

async function testConversion() {
  try {
    console.log('🧪 測試繁簡轉換功能...');
    
    // 模擬 DataManager 的轉換邏輯
    const fanJianMap = new Map(); // 繁體→簡體
    const jianFanMap = new Map(); // 簡體→繁體
    
    // 載入繁體→簡體
    const fanjianData = JSON.parse(fs.readFileSync('src/data/fanjian.json', 'utf8'));
    fanjianData.forEach(item => {
      fanJianMap.set(item.i, item.o);
    });
    
    // 載入簡體→繁體
    const jianfanData = JSON.parse(fs.readFileSync('src/data/jianfan.json', 'utf8'));
    jianfanData.forEach(item => {
      jianFanMap.set(item.i, item.o);
    });
    
    console.log(`✅ 載入轉換字典: 繁→簡 ${fanJianMap.size}, 簡→繁 ${jianFanMap.size}`);
    
    // 轉換函數
    function convertToSimplified(text) {
      return text.split('').map(char => fanJianMap.get(char) || char).join('');
    }
    
    function convertToTraditional(text) {
      return text.split('').map(char => jianFanMap.get(char) || char).join('');
    }
    
    function generateSearchVariants(query) {
      const variants = new Set([query]);
      variants.add(convertToSimplified(query));
      variants.add(convertToTraditional(query));
      return Array.from(variants);
    }
    
    // 測試案例
    const testCases = [
      '中国', // 簡體
      '中國', // 繁體
      '学习', // 簡體
      '學習', // 繁體
      '电脑', // 簡體
      '電腦', // 繁體
      '香港', // 繁簡相同
      'abc123' // 非中文
    ];
    
    console.log('\n🔍 測試轉換結果:');
    testCases.forEach(testCase => {
      const variants = generateSearchVariants(testCase);
      console.log(`輸入: "${testCase}" -> 搜索變體: [${variants.map(v => `"${v}"`).join(', ')}]`);
    });
    
    console.log('\n✅ 繁簡轉換功能測試完成');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

testConversion();