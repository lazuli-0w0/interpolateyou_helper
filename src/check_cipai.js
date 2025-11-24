const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/cipou.json', 'utf8'));

// 查看前10個不同 ci_pai_id 的項目
const seen = new Set();
let count = 0;
for (const item of data) {
  if (!seen.has(item.ci_pai_id) && count < 10) {
    seen.add(item.ci_pai_id);
    count++;
    console.log('---');
    console.log('ci_pai_id:', item.ci_pai_id);
    console.log('author:', item.author);
    console.log('introduction:', item.introduction);
    console.log('main_flag:', item.main_flag);
  }
}
