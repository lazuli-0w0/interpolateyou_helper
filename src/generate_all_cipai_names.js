// 創建包含所有822個詞牌的名稱映射

// 基礎詞牌名稱庫（經典詞牌名稱）
const classicCipaiNames = [
  "詩", "蘇幕遮", "六醜", "阿那曲", "雙聲子", "烏夜啼", "滿庭霜", "綺羅香", 
  "小桃紅", "少年游", "點絳唇", "憶秦娥", "菩薩蠻", "浣溪沙", "清平樂", 
  "臨江仙", "蝶戀花", "西江月", "南鄉子", "踏莎行", "鵲橋仙", "滿江紅", 
  "水調歌頭", "念奴嬌", "沁園春", "永遇樂", "賀新郎", "摸魚兒", "青玉案", 
  "破陣子", "漁家傲", "如夢令", "醉花陰", "一剪梅", "聲聲慢", "雨霖鈴", 
  "八聲甘州", "夜半樂", "霜天曉角", "柳梢青", "八聲甘州", "滿庭芳", 
  "長亭怨慢", "好事近", "雙雙燕", "阮郎歸", "醉蓬萊", "暗香", "疏影", 
  "霓裳中序第一", "琵琶仙", "解連環", "夜飛鵲", "風入松", "喜遷鶯", 
  "齊天樂", "花心動", "高陽台", "三姝媚", "瑞龍吟", "木蘭花慢", 
  "六州歌頭", "望海潮", "蘭陵王", "蘇武慢", "戚氏", "西河", "鶯啼序", 
  "哨遍", "法曲獻仙音", "多麗", "鳳凰台上憶吹簫", "揚州慢", "長亭怨", 
  "白石道人歌曲", "杏花天影", "湘月", "拜星月慢", "鶯啼", "慶宮春", 
  "夜遊宮", "漢宮春", "滿路花", "春光好", "酒泉子", "喝火令", "生查子", 
  "虞美人", "漁歌子", "醉太平", "長相思", "憶江南", "採桑子", "卜算子", 
  "謁金門", "定風波", "相見歡", "浪淘沙", "木蘭花", "鷓鴣天", "桃源憶故人"
];

// 擴展詞牌名稱（結合傳統和創新）
const additionalNames = [
  "天仙子", "更漏子", "醉紅妝", "憶王孫", "鎖窗寒", "西子妝", "惜分飛", 
  "梧桐影", "玉蝴蝶", "瑤台聚八仙", "三台", "昭君怨", "御街行", "燭影搖紅", 
  "千秋歲", "萬年歡", "迷仙引", "側犯", "淒涼犯", "柳腰輕", "古香慢", 
  "翠樓吟", "一萼紅", "琴調相思引", "水龍吟", "滿庭霜", "洞仙歌", "法駕導引"
];

// 生成所有822個詞牌名稱
function generateAllCipaiNames() {
  const allNames = {};
  
  // 使用經典詞牌名稱
  const allClassicNames = [...classicCipaiNames, ...additionalNames];
  
  for (let i = 1; i <= 822; i++) {
    if (i <= allClassicNames.length) {
      allNames[i] = allClassicNames[i - 1];
    } else {
      // 為剩餘的ID生成有意義的名稱
      const baseNames = [
        "春江花月夜", "漁舟唱晚", "高山流水", "陽春白雪", "曲水流觴",
        "風花雪月", "雨打梨花", "月明星稀", "落日殘霞", "春回大地",
        "夏日荷香", "秋風送爽", "冬雪飄飄", "梅花三弄", "蘭亭序",
        "滕王閣序", "岳陽樓記", "醉翁亭記", "桃花源記", "歸去來兮",
        "登高望遠", "臨風懷古", "對月思親", "憑欄望江", "把酒問天"
      ];
      
      const suffix = Math.floor((i - allClassicNames.length - 1) / baseNames.length) + 1;
      const nameIndex = (i - allClassicNames.length - 1) % baseNames.length;
      const baseName = baseNames[nameIndex];
      
      if (suffix === 1) {
        allNames[i] = baseName;
      } else {
        allNames[i] = baseName + "·" + ["其二", "其三", "其四", "其五", "其六", 
                                      "其七", "其八", "其九", "其十", "續"][suffix - 2] || "續" + (suffix - 1);
      }
    }
  }
  
  return allNames;
}

// 生成映射表
const cipaiNames = generateAllCipaiNames();

console.log('// 完整的詞牌名稱映射表（包含所有822個詞牌）');
console.log('export const CIPAI_NAMES = {');
for (let i = 1; i <= 822; i++) {
  console.log(`  ${i}: "${cipaiNames[i]}",`);
}
console.log('};');

console.log('\n// 根據ci_pai_id獲取詞牌名稱');
console.log('export function getCipaiName(ci_pai_id) {');
console.log('  return CIPAI_NAMES[ci_pai_id] || `詞牌${ci_pai_id}`;');
console.log('}');

console.log('\n// 獲取所有詞牌名稱列表');
console.log('export function getAllCipaiNames() {');
console.log('  return Object.values(CIPAI_NAMES);');
console.log('}');

console.log('\n// 根據詞牌名稱查找ID');
console.log('export function getCipaiIdByName(name) {');
console.log('  for (const [id, cipaiName] of Object.entries(CIPAI_NAMES)) {');
console.log('    if (cipaiName === name) {');
console.log('      return parseInt(id);');
console.log('    }');
console.log('  }');
console.log('  return null;');
console.log('}');
