// 測試詞牌系統功能
const fs = require('fs');

async function testCipouSystem() {
  try {
    console.log('🧪 測試詞牌系統功能...');
    
    // 測試 getCipaiName 函數導入
    const { getCipaiName } = require('./src/complete_cipai_names.js');
    
    console.log('✅ getCipaiName 函數導入成功');
    
    // 測試一些詞牌名稱映射
    const testIds = ['1', '10', '50', '100', '200'];
    console.log('\n🔍 測試詞牌名稱映射:');
    
    testIds.forEach(id => {
      const name = getCipaiName(id);
      console.log(`詞牌 ID ${id} -> ${name}`);
    });
    
    // 檢查 cipou.json 數據
    const cipouData = JSON.parse(fs.readFileSync('public/data/cipou.json', 'utf8'));
    console.log(`\n📊 cipou.json 統計: ${cipouData.length} 個記錄`);
    
    // 測試前5個記錄的詞牌名稱映射
    console.log('\n📝 前5個詞牌記錄:');
    cipouData.slice(0, 5).forEach((item, index) => {
      const cipaiName = getCipaiName(item.ci_pai_id);
      console.log(`${index + 1}. ID: ${item.ci_pai_id}, 名稱: ${cipaiName}, 作者: ${item.author}, 字數: ${item.size}`);
    });
    
    console.log('\n✅ 詞牌系統測試完成！');
    
  } catch (error) {
    console.error('❌ 詞牌系統測試失敗:', error.message);
    console.error('詳細錯誤:', error.stack);
  }
}

testCipouSystem();