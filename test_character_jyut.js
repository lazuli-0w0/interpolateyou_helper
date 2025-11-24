// 測試單字粵韻生成功能
const fs = require('fs');

async function testCharacterJyutPinyin() {
  try {
    console.log('🧪 測試單字粵韻生成功能...');
    
    // 載入 jyutwan.json
    const jyutData = JSON.parse(fs.readFileSync('src/data/wan_file/jyutwan.json', 'utf8'));
    const ciZuData = JSON.parse(fs.readFileSync('src/data/ciZu.json', 'utf8'));
    
    // 建立詞語和單字到粵語拼音的映射
    let jyutPinyinMap = new Map();
    Object.values(jyutData).forEach(entries => {
      entries.forEach(entry => {
        if (entry[0] && entry[0].includes(':')) {
          const [word, pinyin] = entry[0].split(':');
          if (word && pinyin) {
            jyutPinyinMap.set(word.trim(), pinyin.trim());
          }
        }
      });
    });
    
    console.log(`✅ 建立了 ${jyutPinyinMap.size} 個粵語拼音映射`);
    
    // 單字粵韻生成函數 (模擬 DataManager 的邏輯)
    function generateCharacterJyutPinyin(word) {
      if (!word) return '';
      
      const chars = word.split('');
      const charPinyins = [];
      
      for (const char of chars) {
        const charPinyin = jyutPinyinMap.get(char);
        if (charPinyin) {
          charPinyins.push(charPinyin);
        } else {
          charPinyins.push(char); // 如果找不到，保留原字
        }
      }
      
      return charPinyins.join(' ');
    }
    
    // 測試一些沒有整詞粵韻的詞語
    const testWords = [];
    let testedCount = 0;
    
    console.log('\n🔍 測試沒有整詞粵韻的詞語:');
    
    for (const item of ciZuData) {
      if (testedCount >= 20) break; // 只測試前20個
      
      const wholePinyin = jyutPinyinMap.get(item.word);
      if (!wholePinyin) {
        const charPinyin = generateCharacterJyutPinyin(item.word);
        if (charPinyin !== item.word) { // 如果不是全部都找不到
          testWords.push({
            word: item.word,
            charPinyin: charPinyin,
            count: item.count
          });
          testedCount++;
        }
      }
    }
    
    testWords.forEach((item, index) => {
      console.log(`${index + 1}. "${item.word}" -> ${item.charPinyin} (出現次數: ${item.count})`);
    });
    
    // 測試一些常見單字的拼音
    console.log('\n📚 測試常見單字拼音:');
    const commonChars = ['春', '花', '秋', '月', '風', '雨', '山', '水', '天', '地'];
    commonChars.forEach(char => {
      const pinyin = jyutPinyinMap.get(char);
      console.log(`${char} -> ${pinyin || '(無)'}`);
    });
    
    // 測試組合詞語
    console.log('\n🔗 測試組合詞語粵韻:');
    const testCompoundWords = ['春花', '秋月', '風雨', '山水', '天地'];
    testCompoundWords.forEach(word => {
      const wholePinyin = jyutPinyinMap.get(word);
      const charPinyin = generateCharacterJyutPinyin(word);
      console.log(`"${word}" -> 整詞: ${wholePinyin || '(無)'}, 單字組合: ${charPinyin}`);
    });
    
    console.log('\n✅ 單字粵韻生成功能測試完成');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

testCharacterJyutPinyin();