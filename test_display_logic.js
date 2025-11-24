// 測試顯示更多功能的邏輯
console.log('🧪 測試顯示更多功能邏輯...');

// 模擬數據
const mockResults = Array.from({length: 150}, (_, i) => ({
  id: i + 1,
  name: `詞牌 ${i + 1}`,
  rhymePattern: i % 5 === 0 ? '平韻格' : i % 5 === 1 ? '仄韻格' : i % 5 === 2 ? '換韻格' : i % 5 === 3 ? '通韻格' : '未分類'
}));

// 模擬狀態
let displayCount = 20;
const itemsPerPage = 20;
const results = mockResults;

console.log(`總數據量: ${results.length}`);
console.log(`當前顯示: ${displayCount}`);
console.log(`每頁顯示: ${itemsPerPage}`);

// 測試「顯示更多」按鈕邏輯
const nextLoadCount = Math.min(itemsPerPage, results.length - displayCount);
console.log(`\n📄 顯示更多按鈕:`);
console.log(`  - 下次載入數量: ${nextLoadCount}`);
console.log(`  - 按鈕文字: "顯示更多 (${nextLoadCount} 項)"`);

// 測試「顯示全部」按鈕邏輯
const remainingCount = results.length - displayCount;
const shouldShowAllButton = remainingCount > itemsPerPage;

console.log(`\n📋 顯示全部按鈕:`);
console.log(`  - 剩餘項目: ${remainingCount}`);
console.log(`  - 是否顯示: ${shouldShowAllButton}`);
if (shouldShowAllButton) {
  console.log(`  - 按鈕文字: "顯示全部 (${remainingCount} 項)"`);
}

// 模擬點擊「顯示更多」
displayCount = Math.min(displayCount + itemsPerPage, results.length);
console.log(`\n🔄 點擊顯示更多後:`);
console.log(`  - 新的顯示數量: ${displayCount}`);
console.log(`  - 剩餘項目: ${results.length - displayCount}`);

// 測試不同場景
console.log(`\n📊 不同場景測試:`);

// 場景1: 50個結果，顯示20個
console.log(`場景1 - 總50個，顯示20個:`);
const scenario1 = {
  total: 50,
  current: 20,
  perPage: 20
};
console.log(`  顯示更多: ${Math.min(scenario1.perPage, scenario1.total - scenario1.current)} 項`);
console.log(`  顯示全部: ${scenario1.total - scenario1.current} 項`);
console.log(`  顯示全部按鈕: ${scenario1.total - scenario1.current > scenario1.perPage ? '顯示' : '隱藏'}`);

// 場景2: 150個結果，顯示20個
console.log(`場景2 - 總150個，顯示20個:`);
const scenario2 = {
  total: 150,
  current: 20,
  perPage: 20
};
console.log(`  顯示更多: ${Math.min(scenario2.perPage, scenario2.total - scenario2.current)} 項`);
console.log(`  顯示全部: ${scenario2.total - scenario2.current} 項`);
console.log(`  顯示全部按鈕: ${scenario2.total - scenario2.current > scenario2.perPage ? '顯示' : '隱藏'}`);

console.log('\n✅ 顯示更多功能邏輯測試完成！');