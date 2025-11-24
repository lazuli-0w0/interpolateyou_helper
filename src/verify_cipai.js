const { CIPAI_NAMES, getCipaiName } = require('./complete_cipai_names.js');

console.log('=== 詞牌名稱系統驗證 ===');
console.log('總詞牌數:', Object.keys(CIPAI_NAMES).length);

// 檢查ID覆蓋範圍
const ids = Object.keys(CIPAI_NAMES).map(id => parseInt(id)).sort((a, b) => a - b);
console.log('ID範圍:', ids[0], '到', ids[ids.length - 1]);
console.log('是否覆蓋所有1-822:', ids.length === 822 && ids[0] === 1 && ids[ids.length - 1] === 822);

// 檢查經典詞牌名稱
console.log('\n=== 經典詞牌名稱樣本 ===');
console.log('1:', getCipaiName(1));
console.log('2:', getCipaiName(2));
console.log('3:', getCipaiName(3));
console.log('4:', getCipaiName(4));
console.log('5:', getCipaiName(5));

// 檢查擴展名稱
console.log('\n=== 擴展詞牌名稱樣本 ===');
console.log('121:', getCipaiName(121));
console.log('150:', getCipaiName(150));
console.log('822:', getCipaiName(822));

// 檢查是否還有問題
const hasUndefined = Object.values(CIPAI_NAMES).some(name => name.includes('undefined'));
console.log('\n是否還有undefined名稱:', hasUndefined);
console.log('所有詞牌都有正確名稱:', !hasUndefined);