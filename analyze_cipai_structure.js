// 從introduction中提取詞牌名稱
const fs = require('fs');

// 讀取數據
const cipouData = JSON.parse(fs.readFileSync('/Users/ysyyyps/Desktop/Hackathon 20251117 Prep./my-app/public/data/cipou.json', 'utf8'));

// 統計每個詞牌ID
const cipaiStats = {};
cipouData.forEach(item => {
  const id = item.ci_pai_id;
  if (!cipaiStats[id]) {
    cipaiStats[id] = {
      count: 0,
      examples: [],
      authors: new Set(),
      introductions: new Set()
    };
  }
  cipaiStats[id].count++;
  cipaiStats[id].authors.add(item.author);
  cipaiStats[id].introductions.add(item.introduction);
  if (cipaiStats[id].examples.length < 3) {
    cipaiStats[id].examples.push({
      author: item.author,
      example: item.example.substring(0, 30) + '...'
    });
  }
});

// 輸出統計結果
console.log('詞牌統計：');
console.log('='.repeat(100));

// 只顯示前20個詞牌
const sortedIds = Object.keys(cipaiStats).map(Number).sort((a, b) => a - b).slice(0, 20);

sortedIds.forEach(id => {
  const stats = cipaiStats[id];
  console.log(`ID ${id}: ${stats.count}首作品, ${stats.authors.size}位作者`);
  
  // 顯示所有不同的introduction
  stats.introductions.forEach(intro => {
    console.log(`  Introduction: ${intro}`);
  });
  
  // 顯示例子
  stats.examples.forEach((example, idx) => {
    console.log(`  例 ${idx + 1}: ${example.author} - ${example.example}`);
  });
  console.log('');
});

// 檢查總詞牌數量
console.log(`總詞牌數量: ${Object.keys(cipaiStats).length}`);
console.log(`最大ID: ${Math.max(...Object.keys(cipaiStats).map(Number))}`);
console.log(`最小ID: ${Math.min(...Object.keys(cipaiStats).map(Number))}`);