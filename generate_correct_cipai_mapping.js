// 根據 ciPai.json 生成正確的詞牌名稱對應關係
const fs = require('fs');
const path = require('path');

// 讀取 ciPai.json
const ciPaiData = require('./src/data/ciPai.json');

// 生成 CIPAI_NAMES 對象
const cipaiNames = {};
ciPaiData.forEach(item => {
    cipaiNames[item.id] = item.name;
});

// 生成完整的 complete_cipai_names.js 內容
const fileContent = `// 詞牌名稱對照表 - 根據 ciPai.json 自動生成
// 總共 ${ciPaiData.length} 個詞牌

const CIPAI_NAMES = ${JSON.stringify(cipaiNames, null, 4)};

// 根據詞牌 ID 獲取詞牌名稱
function getCipaiName(ci_pai_id) {
    const id = parseInt(ci_pai_id);
    return CIPAI_NAMES[id] || \`詞牌 \${id}\`;
}

// 如果是在瀏覽器環境中，將函數添加到全局範圍
if (typeof window !== 'undefined') {
    window.getCipaiName = getCipaiName;
}

// 如果是在 Node.js 環境中，導出函數
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getCipaiName, CIPAI_NAMES };
}
`;

// 寫入到 src 目錄
fs.writeFileSync('./src/complete_cipai_names.js', fileContent);
console.log('✅ 已生成 src/complete_cipai_names.js');

console.log(`\n📊 統計信息:`);
console.log(`- 總共包含 ${ciPaiData.length} 個詞牌名稱`);
console.log(`- ID 範圍: ${Math.min(...ciPaiData.map(x=>x.id))} - ${Math.max(...ciPaiData.map(x=>x.id))}`);

// 顯示前10個作為驗證
console.log(`\n🔍 前10個詞牌驗證:`);
ciPaiData.slice(0, 10).forEach(item => {
    console.log(`ID ${item.id}: ${item.name}`);
});
