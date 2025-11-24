// 從cipou.json數據中提取真實的詞牌名稱映射
const fs = require('fs');

// 讀取數據
const cipouData = JSON.parse(fs.readFileSync('/Users/ysyyyps/Desktop/Hackathon 20251117 Prep./my-app/public/data/cipou.json', 'utf8'));

// 根據實際數據來找出詞牌名稱的規律
// 通過分析introduction字段和example內容來推斷詞牌名稱

const cipaiMapping = {};

// 統計每個詞牌ID的信息
const cipaiInfo = {};
cipouData.forEach(item => {
  const id = item.ci_pai_id;
  if (!cipaiInfo[id]) {
    cipaiInfo[id] = {
      examples: [],
      introductions: new Set(),
      authors: new Set()
    };
  }
  cipaiInfo[id].examples.push(item.example);
  cipaiInfo[id].introductions.add(item.introduction);
  cipaiInfo[id].authors.add(item.author);
});

// 嘗試從數據中推斷詞牌名稱
const knownPatterns = {
  1: "詩", // 從example看出：诗。|绮美，瑰奇...
  // 基於introduction和實際內容模式匹配
};

// 生成新的詞牌名稱映射
console.log('// 從實際數據提取的詞牌名稱映射');
console.log('export const REAL_CIPAI_NAMES = {');

Object.keys(cipaiInfo).sort((a, b) => Number(a) - Number(b)).forEach(id => {
  const info = cipaiInfo[id];
  const firstExample = info.examples[0];
  const firstIntro = Array.from(info.introductions)[0];
  
  // 嘗試從example的開頭提取詞牌名稱
  let cipaiName = `詞牌${id}`;
  
  // 簡單的名稱提取邏輯
  if (firstExample) {
    const match = firstExample.match(/^([^。|]+)/);
    if (match && match[1]) {
      const possibleName = match[1].trim();
      // 如果是單個字或很短的詞，可能是詞牌名
      if (possibleName.length <= 6 && !possibleName.match(/[0-9]/)) {
        cipaiName = possibleName;
      }
    }
  }
  
  console.log(`  ${id}: "${cipaiName}", // ${Array.from(info.authors).slice(0, 2).join(', ')} - ${firstIntro.substring(0, 30)}...`);
});

console.log('};');

console.log('\n// getCipaiName 函數');
console.log('export function getCipaiName(cipaiId) {');
console.log('  return REAL_CIPAI_NAMES[cipaiId] || `未知詞牌${cipaiId}`;');
console.log('}');