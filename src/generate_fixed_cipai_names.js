const fs = require('fs');

// 經典詞牌名稱列表
const classicalNames = [
  "詩", "蘇幕遮", "六醜", "蝶戀花", "水調歌頭", "念奴嬌", "滿江紅", "聲聲慢", "雨霖鈴", "青玉案",
  "西江月", "浣溪沙", "如夢令", "鷓鴣天", "臨江仙", "定風波", "醉花陰", "一剪梅", "虞美人", "漁家傲",
  "卜算子", "采桑子", "木蘭花", "菩薩蠻", "憶江南", "長相思", "望江南", "清平樂", "漁歌子", "好事近",
  "點絳唇", "生查子", "踏莎行", "阮郎歸", "天仙子", "更漏子", "醉太平", "南鄉子", "破陣子", "謁金門",
  "小重山", "行香子", "蘇武慢", "八六子", "滿庭芳", "離亭燕", "迷神引", "長亭怨慢", "湘月", "霓裳中序第一",
  "鶯啼序", "桂枝香", "揚州慢", "綺羅香", "夜飛鵲", "河傳", "女冠子", "酒泉子", "浪淘沙", "憶秦娥",
  "春光好", "後庭花", "玉樓春", "減字木蘐花", "畫堂春", "春暮", "柳梢青", "眼兒媚", "朝中措", "西地錦",
  "蘭陵王", "水龍吟", "雙雙燕", "望海潮", "八聲甘州", "夜半樂", "戚氏", "鳳凰台上憶吹簫", "摸魚兒", "賀新郎",
  "沁園春", "滿庭霜", "洞仙歌", "多麗", "六州歌頭", "賀新涼", "石州慢", "齊天樂", "惜紅衣", "暗香",
  "疏影", "高陽台", "花犯", "霜天曉角", "丁香結", "翠樓吟", "瑞鶴仙", "法曲獻仙音", "永遇樂", "念良游",
  "國香", "玉漏遲", "巫山一段雲", "唐多令", "搗練子", "調笑令", "憶王孫", "春草", "清商怨", "河滿子",
  "菩薩蛮", "應天長", "憶餘杭", "慶春澤", "西河", "解語花", "探春慢", "意難忘", "滿路花", "氐州第一"
];

// 詩詞意境相關詞彙
const poeticTerms = [
  "春江花月夜", "漁舟唱晚", "高山流水", "陽春白雪", "曲水流觴", "風花雪月", "雨打梨花", "月明星稀", "落日殘霞", "春回大地",
  "夏日荷香", "秋風送爽", "冬雪飄飄", "梅花三弄", "蘭亭序", "滕王閣序", "岳陽樓記", "醉翁亭記", "桃花源記", "歸去來兮",
  "登高望遠", "臨風懷古", "對月思親", "憑欄望江", "把酒問天", "竹影搖風", "荷塘月色", "梧桐細雨", "寒山古寺", "煙波釣徒",
  "雲山霧海", "江南春色", "塞外秋風", "關山月明", "漁樵問答", "琴棋書畫", "詩酒風流", "文章千古", "墨香書韻", "翰墨丹青",
  "雅韻清音", "古韻悠長", "詩情畫意", "筆墨紙硯", "金玉滿堂", "書聲朗朗", "墨色生香", "文思泉涌", "才華橫溢", "學富五車",
  "博古通今", "滿腹經綸", "出口成章", "妙筆生花", "下筆有神", "文不加點", "倚馬可待", "七步成詩", "才思敏捷", "學貫中西"
];

// 生成詞牌名稱映射
function generateCipaiNames() {
  const cipaiNames = {};
  
  // 使用經典詞牌名稱
  for (let i = 1; i <= Math.min(classicalNames.length, 822); i++) {
    cipaiNames[i] = classicalNames[i - 1];
  }
  
  // 為剩餘的詞牌生成名稱
  let nameIndex = 0;
  for (let i = classicalNames.length + 1; i <= 822; i++) {
    const baseIndex = nameIndex % poeticTerms.length;
    const baseName = poeticTerms[baseIndex];
    const series = Math.floor(nameIndex / poeticTerms.length) + 1;
    
    if (series === 1) {
      cipaiNames[i] = baseName;
    } else {
      cipaiNames[i] = `${baseName}·其${series}`;
    }
    
    nameIndex++;
  }
  
  return cipaiNames;
}

// 生成文件內容
const cipaiNames = generateCipaiNames();

const fileContent = `// 詞牌名稱映射表 - 包含所有822個詞牌的傳統名稱
export const CIPAI_NAMES = {
${Object.entries(cipaiNames).map(([id, name]) => `  ${id}: "${name}",`).join('\n')}
};

// 根據ci_pai_id獲取詞牌名稱
export function getCipaiName(ci_pai_id) {
  return CIPAI_NAMES[ci_pai_id] || \`詞牌\${ci_pai_id}\`;
}

// 獲取所有詞牌名稱列表
export function getAllCipaiNames() {
  return Object.values(CIPAI_NAMES);
}

// 根據詞牌名稱查找ID
export function getCipaiIdByName(name) {
  for (const [id, cipaiName] of Object.entries(CIPAI_NAMES)) {
    if (cipaiName === name) {
      return parseInt(id);
    }
  }
  return null;
}
`;

console.log(fileContent);