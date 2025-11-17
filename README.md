# Interpolate You - 輔助詩詞創作系統

## 🎯 項目介紹

**Interpolate You** 是一個現代化的詩詞創作輔助工具，專為詩詞愛好者、學者和創作者設計。系統整合了豐富的韻律、音韻和典故資料，提供智能搜尋功能，幫助用戶快速找到符合特定韻律要求的詞彙。

## ✨ 主要功能

### 🔍 多維度搜尋
- **音韻搜尋**: 支援英語音韻（如 `!aa`, `!ab`）和粵語拼音搜尋
- **文字搜尋**: 中文漢字模糊匹配
- **韻律搜尋**: 正韻、平仄、韻腳分類查詢
- **風格搜尋**: 詞形、典故、意境標籤過濾

### 🎨 現代化界面
- **響應式設計**: 適配桌面和移動設備
- **直觀操作**: 過濾按鈕式搜尋體驗
- **網格展示**: 緊湊的結果呈現方式
- **品牌配色**: 統一的視覺設計語言

### 📊 智能排序
- **相關性排序**: 基於匹配度和原始分數的加權算法
- **多條件組合**: 支援同時使用多個搜尋條件
- **結果限制**: 智能限制結果數量，確保最相關內容優先顯示

## 🛠️ 技術架構

### 前端技術
- **React.js**: 現代化前端框架
- **CSS3**: 自定義樣式與動畫效果
- **響應式佈局**: Flexbox + CSS Grid

### 後端技術  
- **Express.js**: 輕量級後端框架
- **Node.js**: 伺服器端運行環境
- **JSON資料庫**: 高效的內存數據處理

### 部署方案
- **GitHub Pages**: 靜態網站托管
- **GitHub Actions**: 自動化部署流程

## 📚 資料來源

系統目前整合了：
- **英語-粵語音韻對照**: 149,131+ 筆資料
- **傳統詩詞資料**: 包含韻書、平仄、典故分類
- **擴展性設計**: 支援後續資料源整合

## 🚀 快速開始

### 在線體驗
訪問：[https://ysyyyps.github.io/interpolate-you](https://ysyyyps.github.io/interpolate-you)

### 本地開發

```bash
# 克隆項目
git clone https://github.com/ysyyyps/interpolate-you.git
cd interpolate-you

# 安裝依賴
npm install

# 啟動開發服務器
npm start

# 訪問 http://localhost:3000
```

### 完整開發環境（包含後端）

```bash
# 後端設置
cd api
npm install
PORT=5001 npm start

# 前端設置（新終端）
npm install  
PORT=3001 npm start
```

## 📖 使用指南

### 基礎搜尋
1. 在搜尋欄輸入關鍵字（中文、拼音或音韻符號）
2. 點擊搜尋按鈕或按 Enter 鍵
3. 瀏覽網格式結果展示

### 進階搜尋
1. 點擊過濾按鈕（正韻、平仄、韻腳、詞形）
2. 輸入具體條件進行精確匹配
3. 使用「Adv. 搜尋」展開更多選項
4. 組合多個條件獲得精確結果

### 結果解讀
- **漢字**: 主要詞彙內容
- **拼音**: 粵語發音標註  
- **分數**: 相關性評分（越高越相關）
- **標籤**: 音韻、韻律、風格分類

## 🎨 設計理念

### 視覺設計
- **簡約現代**: 清晰的信息層級與留白設計
- **品牌一致性**: 統一的色彩與字體系統
- **交互友好**: 直觀的操作反饋與狀態提示

### 用戶體驗
- **快速響應**: 本地數據處理，毫秒級搜尋
- **漸進增強**: 從基礎到高級功能的學習曲線
- **跨平台**: 統一的桌面與移動端體驗

## 🔄 版本歷程

### v1.0.0 (2025-11-17)
- ✅ 核心搜尋功能實現
- ✅ 現代化界面設計  
- ✅ 英語-粵語音韻數據整合
- ✅ GitHub Pages 部署
- ✅ 響應式佈局適配

## 🤝 貢獻指南

歡迎貢獻代碼、報告問題或提出建議！

### 開發流程
1. Fork 本項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 問題報告
請使用 [GitHub Issues](https://github.com/ysyyyps/interpolate-you/issues) 報告問題或功能請求。

## 📄 開源許可

本項目採用 MIT 許可證 - 詳見 [LICENSE](LICENSE) 文件。

## 👥 開發團隊

- **項目經理 & 產品設計**: ysyyyps
- **AI 開發助手**: GitHub Copilot

## 🙏 致謝

感謝所有為中華文化傳承和詩詞創作做出貢獻的學者、開發者和愛好者們。

---

**Interpolate You** - 讓詩詞創作更加靈感豐富 ✨

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
