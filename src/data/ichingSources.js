// Article IDs from the site's 64-hexagram index; they are not hexagram numbers.
// https://www.yilusoso.com/lssg/842/
const ARTICLE_IDS = [
  1, 21, 25, 28, 31, 34, 37, 40,
  43, 46, 49, 52, 55, 58, 61, 64,
  67, 70, 73, 77, 82, 87, 90, 93,
  96, 99, 102, 105, 108, 111, 114, 117,
  120, 123, 128, 131, 136, 139, 142, 145,
  148, 151, 154, 157, 160, 163, 166, 169,
  172, 175, 178, 181, 184, 187, 190, 193,
  196, 199, 202, 205, 208, 211, 214, 217
];

export function ichingSourceUrl(hexagramNumber) {
  const articleId = ARTICLE_IDS[hexagramNumber - 1];
  return articleId ? `https://www.yilusoso.com/lssg/${articleId}/` : null;
}
