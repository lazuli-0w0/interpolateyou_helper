// 統計單字粵韻生成的改進效果
const fs = require('fs');

async function analyzeJyutPinyinCoverage() {
  try {
    console.log('📊 分析單字粵韻覆蓋率改進效果...');
    
    // 載入數據
    const jyutData = JSON.parse(fs.readFileSync('src/data/wan_file/jyutwan.json', 'utf8'));
    const ciZuData = JSON.parse(fs.readFileSync('src/data/ciZu.json', 'utf8'));
    
    // 建立粵語拼音映射
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
    
    // 單字粵韻生成函數
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
    
    // 統計分析
    let wholePinyinCount = 0;  // 有整詞拼音的數量
    let charPinyinCount = 0;   // 可以用單字組成拼音的數量
    let noJyutCount = 0;       // 完全沒有粵韻的數量
    
    const samples = {
      wholePinyin: [],
      charPinyin: [],
      noJyut: []
    };
    
    console.log('🔍 分析 ciZu.json 中的詞語...');
    
    for (const item of ciZuData) {
      const wholePinyin = jyutPinyinMap.get(item.word);
      
      if (wholePinyin) {
        wholePinyinCount++;
        if (samples.wholePinyin.length < 5) {
          samples.wholePinyin.push({ word: item.word, pinyin: wholePinyin, count: item.count });
        }
      } else {
        const charPinyin = generateCharacterJyutPinyin(item.word);
        if (charPinyin !== item.word) { // 至少找到部分字的拼音
          charPinyinCount++;
          if (samples.charPinyin.length < 5) {
            samples.charPinyin.push({ word: item.word, pinyin: charPinyin, count: item.count });
          }
        } else {
          noJyutCount++;
          if (samples.noJyut.length < 5) {
            samples.noJyut.push({ word: item.word, count: item.count });
          }
        }
      }
    }
    
    const totalWords = ciZuData.length;
    const beforeCoverage = (wholePinyinCount / totalWords * 100).toFixed(2);
    const afterCoverage = ((wholePinyinCount + charPinyinCount) / totalWords * 100).toFixed(2);
    const improvement = (afterCoverage - beforeCoverage).toFixed(2);
    
    console.log('\n📈 統計結果:');
    console.log(`總詞語數: ${totalWords}`);
    console.log(`有整詞粵韻: ${wholePinyinCount} (${beforeCoverage}%)`);
    console.log(`可用單字組合: ${charPinyinCount} (${(charPinyinCount / totalWords * 100).toFixed(2)}%)`);
    console.log(`完全無粵韻: ${noJyutCount} (${(noJyutCount / totalWords * 100).toFixed(2)}%)`);
    console.log('');
    console.log(`🎯 覆蓋率改進:`);
    console.log(`  改進前: ${beforeCoverage}%`);
    console.log(`  改進後: ${afterCoverage}%`);
    console.log(`  提升: +${improvement}%`);
    
    console.log('\n📝 樣例展示:');
    console.log('整詞粵韻 (優先):');
    samples.wholePinyin.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.word} -> ${item.pinyin} (${item.count}次)`);
    });
    
    console.log('\n單字組合粵韻 (新增):');
    samples.charPinyin.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.word} -> ${item.pinyin} (${item.count}次)`);
    });
    
    console.log('\n無粵韻資料 (待改進):');
    samples.noJyut.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.word} (${item.count}次)`);
    });
    
    console.log('\n✅ 分析完成！');
    
  } catch (error) {
    console.error('❌ 分析失敗:', error.message);
  }
}

analyzeJyutPinyinCoverage();