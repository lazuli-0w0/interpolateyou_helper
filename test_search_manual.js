// 測試繁簡互搜功能的測試案例
const testCases = [
  {
    description: '用簡體搜索，應該能找到繁體內容',
    searches: [
      { query: '学习', expectToFind: ['學習', '学习'] },
      { query: '电脑', expectToFind: ['電腦', '电脑'] },
      { query: '中国', expectToFind: ['中國', '中国'] }
    ]
  },
  {
    description: '用繁體搜索，應該能找到簡體內容', 
    searches: [
      { query: '學習', expectToFind: ['学习', '學習'] },
      { query: '電腦', expectToFind: ['电脑', '電腦'] },
      { query: '中國', expectToFind: ['中国', '中國'] }
    ]
  },
  {
    description: '搜索詩詞內容',
    searches: [
      { query: '春风', expectToFind: ['春風'] },
      { query: '江南', expectToFind: ['江南'] }, // 這應該在 ciZu.json 中
      { query: '桃花', expectToFind: ['桃花'] }  // 這應該在 ciZu.json 中且有粵語拼音
    ]
  }
];

console.log('🧪 繁簡互搜測試案例:');
console.log(JSON.stringify(testCases, null, 2));

// 手動測試步驟
console.log('\n📋 手動測試步驟:');
console.log('1. 打開 http://localhost:3000');
console.log('2. 切換到「詞語」搜索');
console.log('3. 測試以下搜索詞:');
console.log('   - 搜索 "学习" (簡體) - 應該能找到包含 "學習" 的結果');
console.log('   - 搜索 "學習" (繁體) - 應該能找到包含 "学习" 的結果');
console.log('   - 搜索 "江南" - 應該能找到詞語，並顯示粵語拼音 "gong1 naam4"');
console.log('   - 搜索 "桃花" - 應該能找到詞語，並顯示粵語拼音 "tou4 faa1"');
console.log('4. 觀察搜索結果是否包含繁簡兩種形式');
console.log('5. 檢查是否顯示粵語拼音 (橙色字體)');
console.log('6. 確認數據來源顯示為 "ciZu" 或 "cijyu"');