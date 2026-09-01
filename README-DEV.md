# 輔助詩詞創作系統 - 開發說明

## 1) 專案結構

- `my-app/` - 前端 (Create React App)
- `my-app/api/` - 後端 Express API
- `my-app/data/` - JSON 資料 (目前包含 `eng_index.json` - 英語粵語音韻對照字典，149,131 筆資料)

## 2) 如何安裝 / 啟動

**後端 (在 `my-app/api` 資料夾)**:
```bash
cd my-app/api
npm install
PORT=5001 npm start  # API 在 http://localhost:5001
```

**前端 (在 `my-app` 資料夾)**:
```bash
cd my-app
npm install
PORT=3001 npm start  # 前端在 http://localhost:3001
```

## 3) 功能特色

- **音韻搜尋**: 支援英語音韻 (如 `!aa`, `!ab`) 和粵語拼音 (如 `laai1`) 搜尋
- **文字搜尋**: 中文漢字模糊搜尋
- **傳統詩詞**: 支援正韻、平仄、韻腳、詞形、典故、意境搜尋
- **智能排序**: 基於匹配度和原始分數的加權排序

## 4) API 端點

- `GET /api/health` — 健康檢查
- `GET /api/search` — 搜尋端點

### 搜尋參數:
- `q` - 文字關鍵字
- `phoneticKey` - 英語音韻 (如 `!aa`)
- `pinyin` - 粵語拼音 (如 `laai1`)
- `rhymeBook` - 正韻來源
- `pingze` - 平/仄
- `rhyme` - 韻腳
- `form` - 詞形
- `allusion` - 典故
- `mood` - 意境
- `page`, `limit` - 分頁

### 回傳範例:
```json
{
  "total": 2,
  "page": 1,
  "limit": 20,
  "results": [
    {
      "id": "!aa_拉",
      "text": "拉",
      "pinyin": "laai1",
      "phoneticKey": "!aa",
      "score": 82,
      "source": "eng_index",
      "_score": 132
    }
  ]
}
```

## 5) 資料來源

系統已載入 `eng_index.json` (149,131 筆英語-粵語音韻對照資料)。API 啟動時會自動載入 `my-app/data/` 下的所有 `.json` 檔案。

### 教育部辭典詞語索引

詞語搜尋使用 [g0v/moedict-data](https://github.com/g0v/moedict-data) 整理的教育部《重編國語辭典修訂本》資料，並與本專案的粵拼及詞頻資料合併。

粵拼和粵語釋義優先採用 [jyutnet/cantonese-books-data](https://github.com/jyutnet/cantonese-books-data) 的《粵音資料集叢》典籍資料；教育部辭典及原有粵拼詞庫作補充。

普拼採用教育部辭典的普通話漢語拼音；「切韻」欄使用 [TshetUinh.js](https://github.com/nk2028/tshet-uinh-js) 內建《廣韻》資料的反切注音（例：「水：式軌切」）。

- 原始下載檔：`data-sources/moedict/dict-revised.json`（Vercel 部署時排除）
- 粵音典籍原始資料：`data-sources/cantonese-books-data/`（Vercel 部署時排除）
- 瀏覽器索引：`public/data/moedict-words.json`
- 反切字音索引：`public/data/qieyun-readings.json`
- 重新建立索引：`npm run data:moedict`

### 詩詞與小說索引

詩詞搜尋使用 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)；小說閱讀使用 [luoxuhai/chinese-novel](https://github.com/luoxuhai/chinese-novel)。原始倉庫保存在 `data-sources/`，部署時排除；瀏覽器只會按搜尋詞載入需要的壓縮分片。

- 詩、詞、曲及典籍：345,782 筆
- 小說章回：20,428 筆，434 部可閱讀作品
- 部署索引：`public/data/literature/`
- 名家優先精選集：`public/data/literature/featured-poems.json`（500 首）
- 重新建立索引：`npm run data:literature`
- 只重建精選集：`npm run data:featured-poems`

首頁會從 500 首名家優先精選詩詞中加權隨機展示一首，並避免連續重複；詩詞搜尋在未輸入關鍵字時預顯示同一精選集。詩詞結果可按題目、作者、作品名和正文搜尋並開啟全文。小說頁面可按書名、作者、章回或正文搜尋，先顯示完全匹配的書籍，再顯示相關章回；書籍詳情提供目錄和逐回全文閱讀。
