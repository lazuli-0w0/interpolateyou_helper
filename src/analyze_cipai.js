const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/cipou.json', 'utf8'));

// 收集所有不同的 ci_pai_id
const cipaiIds = new Set();
data.forEach(item => {
  cipaiIds.add(item.ci_pai_id);
});

console.log('總共有', cipaiIds.size, '個不同的詞牌ID');
console.log('最小ID:', Math.min(...cipaiIds));
console.log('最大ID:', Math.max(...cipaiIds));

// 檢查是否連續
const sortedIds = Array.from(cipaiIds).sort((a, b) => a - b);
console.log('前20個ID:', sortedIds.slice(0, 20));
console.log('後20個ID:', sortedIds.slice(-20));

// 檢查缺失的ID
console.log('\n檢查缺失的ID:');
const maxId = Math.max(...cipaiIds);
const missing = [];
for (let i = 1; i <= maxId; i++) {
  if (!cipaiIds.has(i)) {
    missing.push(i);
  }
}
console.log('缺失的ID數量:', missing.length);
if (missing.length > 0 && missing.length < 50) {
  console.log('缺失的ID:', missing);
}
