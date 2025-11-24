// 測試修正後的韻格分類邏輯
console.log('🧪 測試修正後的韻格分類邏輯...');

// 根據實際數據測試韻格分類
const testCases = [
  {
    name: '詞牌ID 1 的變體 (應該是換韻格)',
    variants: [
      { introduction: '单调五十五字，十三句，七平韵——白居易' },
      { introduction: '单调五十五字，十三句，七仄韵——韦式' },
      { introduction: '单调五十六字，十四句七平韵、一叠韵——张南史' },
      { introduction: '单调五十六字，十四句七仄韵、一叠韵——张南史' }
    ]
  },
  {
    name: '詞牌ID 2 的變體 (應該是平韻格)',
    variants: [
      { introduction: '双调七十八字，前后段各七句、四平韵——苏轼' }
    ]
  },
  {
    name: '詞牌ID 5 的變體 (應該是仄韻格)',
    variants: [
      { introduction: '双调一百八字，前段十句四仄韵，后段十一句四仄韵——柳永' },
      { introduction: '双调一百八字，前段十句四仄韵，后段十一句四仄韵——周邦彦' }
    ]
  }
];

function classifyRhymePattern(variants) {
  let hasFlat = false;    // 平韻
  let hasOblique = false; // 仄韻
  let hasChange = false;  // 換韻
  let hasThrough = false; // 通韻
  
  for (const variant of variants) {
    const desc = (variant.description || '').toLowerCase();
    const intro = (variant.introduction || '').toLowerCase();
    const text = desc + ' ' + intro;
    
    console.log(`  檢查文本: "${text}"`);
    
    // 檢測平韻 - 注意簡繁體
    if (text.includes('平韻') || text.includes('平韵') || text.includes('平声韻')) {
      console.log('    → 發現平韻');
      hasFlat = true;
    }
    
    // 檢測仄韻 - 注意簡繁體
    if (text.includes('仄韻') || text.includes('仄韵') || text.includes('仄声韻')) {
      console.log('    → 發現仄韻');
      hasOblique = true;
    }
    
    // 檢測換韻
    if (text.includes('換韻') || text.includes('转韻') || text.includes('韻轉') || text.includes('韻转')) {
      console.log('    → 發現換韻');
      hasChange = true;
    }
    
    // 檢測通韻
    if (text.includes('通韻') || text.includes('平仄通韻') || text.includes('通押')) {
      console.log('    → 發現通韻');
      hasThrough = true;
    }
  }
  
  console.log(`  狀態: 平韻=${hasFlat}, 仄韻=${hasOblique}, 換韻=${hasChange}, 通韻=${hasThrough}`);
  
  // 優先級判斷
  if (hasChange) return '換韻格';
  if (hasThrough) return '通韻格';
  if (hasFlat && hasOblique) return '換韻格'; // 同時有平仄韻通常是換韻
  if (hasFlat) return '平韻格';
  if (hasOblique) return '仄韻格';
  
  return '未分類';
}

testCases.forEach((testCase, index) => {
  console.log(`\n🎵 測試 ${index + 1}: ${testCase.name}`);
  const result = classifyRhymePattern(testCase.variants);
  console.log(`結果: ${result}`);
});

console.log('\n✅ 韻格分類邏輯測試完成！');