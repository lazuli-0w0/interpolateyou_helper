// 檢驗 cipai ID 映射腳本
const fs = require('fs');

// 讀取數據
const cipouData = JSON.parse(fs.readFileSync('/Users/ysyyyps/Desktop/Hackathon 20251117 Prep./my-app/public/data/cipou.json', 'utf8'));

// 檢查詞牌ID與詞牌實例對應關係
console.log('檢查詞牌ID映射：');
console.log('='.repeat(80));

// 檢查前10個詞牌ID
for (let i = 1; i <= 10; i++) {
  const records = cipouData.filter(item => item.ci_pai_id === i);
  if (records.length > 0) {
    const firstRecord = records[0];
    console.log(`ID ${i}:`);
    console.log(`  作品數量: ${records.length}`);
    console.log(`  第一個例子作者: ${firstRecord.author}`);
    console.log(`  內容開頭: ${firstRecord.example.substring(0, 50)}...`);
    console.log(`  Introduction: ${firstRecord.introduction}`);
    console.log('');
  }
}

// 檢查一些常見詞牌
const commonCipaiNames = ['浣溪沙', '如夢令', '虞美人', '水調歌頭'];
console.log('檢查常見詞牌名稱：');
console.log('='.repeat(80));

for (const cipaiName of commonCipaiNames) {
  const matchingRecords = cipouData.filter(item => 
    item.introduction && item.introduction.includes(cipaiName)
  );
  
  if (matchingRecords.length > 0) {
    const cipaiId = matchingRecords[0].ci_pai_id;
    console.log(`${cipaiName}: 找到 ID ${cipaiId}, 共 ${matchingRecords.length} 首`);
  } else {
    console.log(`${cipaiName}: 未找到`);
  }
}