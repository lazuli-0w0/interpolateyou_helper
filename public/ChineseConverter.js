// 繁簡轉換工具類
export class ChineseConverter {
  constructor() {
    this.simplifiedToTraditional = null;
    this.traditionalToSimplified = null;
    this.isLoaded = false;
  }

  // 異步加載轉換字典
  async loadDictionaries() {
    if (this.isLoaded) return;

    try {
      // 加載簡體到繁體的字典
      const jianfanResponse = await fetch('/data/jianfan.json');
      const jianfanData = await jianfanResponse.json();
      
      // 加載繁體到簡體的字典
      const fanjiankResponse = await fetch('/data/fanjian.json');
      const fanjiankData = await fanjiankResponse.json();

      // 構建查找表
      this.simplifiedToTraditional = new Map();
      this.traditionalToSimplified = new Map();

      // 處理簡體到繁體
      jianfanData.forEach(item => {
        this.simplifiedToTraditional.set(item.i, item.o);
      });

      // 處理繁體到簡體
      fanjiankData.forEach(item => {
        this.traditionalToSimplified.set(item.i, item.o);
      });

      this.isLoaded = true;
      console.log('繁簡字典加載完成');
    } catch (error) {
      console.error('字典加載失敗:', error);
    }
  }

  // 簡體轉繁體
  toTraditional(text) {
    if (!this.isLoaded || !text) return text;
    
    let result = '';
    for (let char of text) {
      result += this.simplifiedToTraditional.get(char) || char;
    }
    return result;
  }

  // 繁體轉簡體
  toSimplified(text) {
    if (!this.isLoaded || !text) return text;
    
    let result = '';
    for (let char of text) {
      result += this.traditionalToSimplified.get(char) || char;
    }
    return result;
  }

  // 轉換文本（根據目標語言）
  convertText(text, targetLanguage) {
    if (!text) return text;
    
    switch (targetLanguage) {
      case 'traditional':
        return this.toTraditional(text);
      case 'simplified':
        return this.toSimplified(text);
      default:
        return text;
    }
  }

  // 轉換對象中的文本字段
  convertObject(obj, targetLanguage, textFields = []) {
    if (!obj || typeof obj !== 'object') return obj;

    const converted = { ...obj };
    
    textFields.forEach(field => {
      if (converted[field]) {
        converted[field] = this.convertText(converted[field], targetLanguage);
      }
    });

    return converted;
  }

  // 轉換數組中的對象
  convertArray(array, targetLanguage, textFields = []) {
    if (!Array.isArray(array)) return array;
    
    return array.map(item => 
      this.convertObject(item, targetLanguage, textFields)
    );
  }
}

// 創建全局實例
export const chineseConverter = new ChineseConverter();

// 自動初始化
chineseConverter.loadDictionaries();