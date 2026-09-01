import { splitReadingParagraphs } from './readingFormat.js';

describe('splitReadingParagraphs', () => {
  test('splits poetry only at Chinese full stops', () => {
    expect(splitReadingParagraphs('紅豆生南國，秋來發故枝。願君多採擷，此物最相思。', 'poetry'))
      .toEqual([['紅豆生南國，秋來發故枝。', '願君多採擷，此物最相思。']]);
  });

  test('joins existing poetry line breaks unless a full stop ends the line', () => {
    expect(splitReadingParagraphs('再申秋光留不住，\n滿階紅葉暮。\n又是過重陽，\n臺榭登臨處。', 'poetry'))
      .toEqual([['再申秋光留不住，滿階紅葉暮。', '又是過重陽，臺榭登臨處。']]);
  });

  test('keeps prose clauses together until a full sentence ending', () => {
    expect(splitReadingParagraphs('卻說玄德訪孔明，行至莊前。童子出門相迎；二人下馬。', 'prose'))
      .toEqual([['卻說玄德訪孔明，行至莊前。', '童子出門相迎；', '二人下馬。']]);
  });

  test('preserves source paragraph boundaries and closing quotes', () => {
    expect(splitReadingParagraphs('「且慢！」\n眾人回首。', 'prose'))
      .toEqual([['「且慢！」'], ['眾人回首。']]);
  });
});
