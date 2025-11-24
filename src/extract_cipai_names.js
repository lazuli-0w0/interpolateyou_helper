const fs = require('fs');

// 讀取詞牌數據
const cipouData = JSON.parse(fs.readFileSync('./data/cipou.json', 'utf8'));

// 提取每個 ci_pai_id 對應的詞牌名稱
const cipaiNames = {};
const cipaiExamples = {};

cipouData.forEach(item => {
  const id = item.ci_pai_id;
  
  if (!cipaiNames[id]) {
    // 從 introduction 中提取詞牌名稱
    let name = `詞牌${id}`;
    
    if (item.introduction) {
      // 查找格式如 "單調五十五字，十三句，七平韻——白居易"
      const match = item.introduction.match(/——(.+)$/);
      if (match) {
        // 這是作者名，需要從前面提取
        const beforeAuthor = item.introduction.split('——')[0];
        // 嘗試從前面提取詞牌名稱的模式
        if (beforeAuthor.includes('調')) {
          name = beforeAuthor;
        }
      }
    }
    
    // 如果有 example，可以嘗試從中推斷
    if (item.example && !cipaiNames[id]) {
      // 保存第一個例子作為參考
      cipaiExamples[id] = item.example.substring(0, 50) + '...';
    }
    
    cipaiNames[id] = name;
  }
});

// 手動設置一些已知的詞牌名稱
const knownNames = {
  1: "詩",
  2: "蘇幕遮",
  3: "六醜",
  // 添加更多已知的詞牌名稱...
};

// 合併已知名稱
Object.assign(cipaiNames, knownNames);

console.log('// 從詞牌數據中提取的詞牌名稱映射');
console.log('export const CIPAI_NAMES = {');
Object.keys(cipaiNames).sort((a, b) => parseInt(a) - parseInt(b)).forEach(id => {
  console.log(`  ${id}: "${cipaiNames[id]}",`);
});
console.log('};');

console.log('\n// 根據ci_pai_id獲取詞牌名稱');
console.log('export function getCipaiName(ci_pai_id) {');
console.log('  return CIPAI_NAMES[ci_pai_id] || `詞牌${ci_pai_id}`;');
console.log('}');
