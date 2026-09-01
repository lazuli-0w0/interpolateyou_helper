# 覺知 你 · Interpolate You

版本 `2.3.0` 是一套以古典中文為核心的瀏覽器資料庫，整合詞語、詩詞、古典小說與詞牌格律搜尋。

正式網站：[interpolateyou-helper.vercel.app](https://interpolateyou-helper.vercel.app)

## 主要功能

- 詞語搜尋：支援繁簡體漢字、粵拼及普通話拼音；顯示粵拼、普拼、反切與詞義。
- 詩詞搜尋：可依題名、作者、作品名或正文搜尋，並提供 500 首精選作品預覽。
- 小說閱讀：收錄 434 部古典小說，可搜尋書名、作者、章回與正文並逐章閱讀。
- 詞牌搜尋：提供詞牌變體、韻格分類、平仄格式及例詞。
- 首頁詩選：每次由 500 首精選名篇中加權隨機展示。
- 工具選單：將詞語、詩詞、小說與詞牌集中於可擴充的功能選單。
- 語言設定：全站繁簡體介面與內容偏好集中管理並保留選擇。
- 創辦人的話：以專屬長篇版面呈現品牌初心與文化理念。

## 本機啟動

需要 Node.js 及 pnpm。

```bash
pnpm install
pnpm start
```

預設開啟 `http://localhost:3000`。

## 測試與建置

```bash
pnpm test -- --watchAll=false
pnpm build
```

## 資料索引

原始資料存放於本機 `data-sources/`，不會提交或部署；瀏覽器使用的壓縮索引位於 `public/data/`。

```bash
pnpm data:moedict
pnpm data:literature
pnpm data:featured-poems
```

## 資料來源

- 詞義：[g0v/moedict-data](https://github.com/g0v/moedict-data)
- 粵音及粵語典籍：[jyutnet/cantonese-books-data](https://github.com/jyutnet/cantonese-books-data)
- 反切：[TshetUinh.js](https://github.com/nk2028/tshet-uinh-js)
- 詩詞：[chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)
- 古典小說：[luoxuhai/chinese-novel](https://github.com/luoxuhai/chinese-novel)

詳細開發與資料結構說明請參閱 [README-DEV.md](README-DEV.md)。

## 版本

目前版本：`v2.5.1`。完整內容請參閱 [CHANGELOG.md](CHANGELOG.md)。
