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
