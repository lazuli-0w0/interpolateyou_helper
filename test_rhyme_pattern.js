// 測試詞牌韻格分類功能
console.log('🧪 測試詞牌韻格分類功能...');

// 模擬韻格分類函數
function classifyRhymePattern(variants) {
  for (const variant of variants) {
    const desc = (variant.description || '').toLowerCase();
    const intro = (variant.introduction || '').toLowerCase();
    const text = desc + ' ' + intro;
    
    if (text.includes('平韻') || text.includes('平声韻') || text.includes('平声韻')) {
      return '平韻格';
    }
    if (text.includes('仄韻') || text.includes('仄声韻') || text.includes('仄声韻')) {
      return '仄韻格';
    }
    if (text.includes('通韻') || text.includes('平仄通韻') || text.includes('通押')) {
      return '通韻格';
    }
    if (text.includes('換韻') || text.includes('转韻') || text.includes('韻轉') || text.includes('韻转')) {
      return '換韻格';
    }
  }
  return '未分類';
}

// 測試案例
const testCases = [
  {
    name: '水調歌頭',
    variants: [
      { 
        description: '雙調九十五字，前段九句四平韻，後段十句四平韻',
        introduction: '此調以蘇軾詞為正體，九十五字，前段九句四平韻，後段十句四平韻。'
      }
    ]
  },
  {
    name: '念奴嬌',
    variants: [
      { 
        description: '雙調一百字，前後段各九句、四仄韻',
        introduction: '此調有平韻、仄韻兩體。以蘇軾《念奴嬌·赤壁懷古》為仄韻正體。'
      }
    ]
  },
  {
    name: '滿江紅',
    variants: [
      { 
        description: '雙調九十三字，前段八句四仄韻，後段十句四仄韻',
        introduction: '此調換韻，前段四仄韻，後段四仄韻，韻轉平聲。'
      }
    ]
  },
  {
    name: '蝶戀花',
    variants: [
      { 
        description: '雙調六十字，前後段各五句、四仄韻',
        introduction: '原為唐教坊曲，後用作詞調。通韻平仄，變化多端。'
      }
    ]
  }
];

console.log('\n📋 韻格分類測試結果:');
testCases.forEach((testCase, index) => {
  const rhymePattern = classifyRhymePattern(testCase.variants);
  const emoji = rhymePattern === '平韻格' ? '🎵' : 
                rhymePattern === '仄韻格' ? '🎶' : 
                rhymePattern === '通韻格' ? '🎼' : 
                rhymePattern === '換韻格' ? '🎺' : '❓';
  
  console.log(`${index + 1}. ${testCase.name} -> ${emoji} ${rhymePattern}`);
  console.log(`   描述: ${testCase.variants[0].description}`);
  console.log('');
});

console.log('🎯 新功能說明:');
console.log('1. 詞牌搜尋頁面新增韻格篩選選項');
console.log('2. 支援 5 種韻格分類: 平韻格、仄韻格、通韻格、換韻格、未分類');
console.log('3. 可多選篩選，即時更新搜尋結果');
console.log('4. 詞牌卡片顯示韻格標籤，不同顏色區分');
console.log('5. 篩選狀態統計顯示');

console.log('\n✅ 詞牌韻格分類功能測試完成！');