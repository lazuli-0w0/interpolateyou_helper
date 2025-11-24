// 測試粵語拼音映射功能
const fs = require('fs');

async function testJyutPinyinMapping() {
  try {
    console.log('🧪 測試粵語拼音映射功能...');
    
    // 載入 jyutwan.json
    const jyutData = JSON.parse(fs.readFileSync('src/data/wan_file/jyutwan.json', 'utf8'));
    
    // 建立詞語到粵語拼音的映射
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
    
    // 載入 ciZu.json 測試前幾個詞語
    const ciZuData = JSON.parse(fs.readFileSync('src/data/ciZu.json', 'utf8'));
    
    console.log('\n📋 測試前 10 個 ciZu 詞語的粵語拼音匹配:');
    let matchCount = 0;
    
    for (let i = 0; i < Math.min(10, ciZuData.length); i++) {
      const item = ciZuData[i];
      const jyutPinyin = jyutPinyinMap.get(item.word);
      
      console.log(`${i + 1}. ${item.word} -> ${jyutPinyin || '(無匹配)'}`);
      if (jyutPinyin) matchCount++;
    }
    
    console.log(`\n📊 匹配統計: ${matchCount}/10 個詞語有粵語拼音`);
    
    // 測試一些常見詞語
    const testWords = ['香港', '澳門', '廣東', '中國', '學校', '老師', '學生', '電腦', '手機', '飲茶'];
    console.log('\n🔍 測試常見詞語的粵語拼音:');
    
    testWords.forEach(word => {
      const pinyin = jyutPinyinMap.get(word);
      console.log(`${word} -> ${pinyin || '(無匹配)'}`);
    });
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

testJyutPinyinMapping();