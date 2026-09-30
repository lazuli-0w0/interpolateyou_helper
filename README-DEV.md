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

網站「設定 → References」由 `src/data/references.js` 的來源目錄自動列出並統計。
新增資料來源時只需在該目錄登記一次；頁面內的引用以 `referenceUrl(id)` 讀取同一網址，
不要在各頁重複寫來源 URL。64 卦的逐卦參考連結由卦序和 `src/data/ichingSources.js`
的文章對照表自動產生。站長自行整理的《I Ching.pages》與詞牌個人經驗沒有公開網址，
因此在清單中標作站長整理，而不捏造外部連結。

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


## 典籍搜尋

入口：`/strumenti/testi-classici`。書目先讀取輕量 JSON；《宋論》和《三朝北盟會編》
的正文在 `public/data/classics/classics.sqlite`，NiuTrans 的 97 部雙語典籍則各有一個
`public/data/classics/niutrans/*.sqlite`。選擇書籍後才載入該書的資料檔，以 Web Worker
執行 SQLite 查詢。全書目模式搜尋書名、章名和原有兩部正文；97 部正文需選書搜尋，
避免一次下載約 486 MB 的資料。原文與未譯的 null 值完整保留，搜尋使用另一組繁簡及異體正規化欄位。

把逐句 JSON 放到 `data-sources/classics/`，執行 `pnpm data:classics` 重建資料庫。
也可執行 `python3 scripts/build-classics-db.py --source /absolute/path/book.json`，
同時在輸入 JSON 旁輸出 `.sqlite` 檔。`data-sources/` 依 `.gitignore` 不會提交；
新增書籍會一起匯入，語譯更新後需重建並保留來源備份。

驗證：`pnpm test:classics-db` 以真實 SQLite 引擎測試 Worker 的查詢、繁簡對照、
分頁、語譯篩選和參數化查詢；介面測試位於 `ClassicsPage.test.js`。

NiuTrans 匯入使用 `NiuTrans/Classical-Modern` 的 commit
`4e746ea9fa99c3c0d7051c45397330bef7b0962d`，來源 checkout 須包含 `双语数据`：
`python3 scripts/build-niutrans-shards.py /absolute/path/to/Classical-Modern`。
匯入器要求 97 部、972,467 組句對；完成後執行 `python3 scripts/verify-niutrans-shards.py`。
原始庫說明這批資料取自多個外部網站；結構、句對與資料庫完整性已有自動驗證，
但這不等於逐句譯文交叉校核，也不等於取得所有第三方譯文的再發布權。
對外發布前應另外釐清來源權利。網站來源連結只放在 References 頁。

SQLite 執行引擎為 sql.js 1.13.0，WASM、JavaScript 和 MIT 授權一起部署，
不依賴第三方 CDN，也不需要額外的資料庫服務。
