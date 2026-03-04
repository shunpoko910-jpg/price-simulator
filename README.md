# 楽天 vs Amazon 実質価格シミュレーター

ポイント還元込みの実質価格を比較するツール。  
SPU・買いまわり・プライム会員条件を考慮した正確な比較ができます。

## 機能

- **楽天SPU設定**: 12項目のSPU条件をトグルで設定（自動保存）
- **買いまわり**: 1〜10店舗のスライダー
- **イベント対応**: 5と0のつく日、スーパーSALE
- **楽天API連携**: 商品URLを貼るだけで価格を自動取得
- **Amazon条件**: プライム会員・Mastercard
- **実質価格比較**: ポイント還元後の価格をバーグラフで可視化

## セットアップ

### 1. リポジトリをクローン or ファイルをアップロード

```bash
git init
git add .
git commit -m "initial commit"
```

### 2. Vercelにデプロイ

```bash
npx vercel
```

または [vercel.com](https://vercel.com) でGitリポジトリを接続。

### 3. 楽天アプリIDを取得

1. [楽天Developers](https://webservice.rakuten.co.jp/) にアクセス
2. 楽天アカウントでログイン
3. 「アプリID発行」からアプリを作成
4. 表示されたアプリIDをツール内の「楽天設定」タブに入力

## 技術構成

- **Next.js 14** (App Router)
- **APIルート** `/api/rakuten` で楽天APIをプロキシ（CORS回避）
- **localStorage** で設定を永続化
- **Vercel** 東京リージョン (hnd1) にデプロイ

## ファイル構成

```
price-sim/
├── app/
│   ├── api/
│   │   └── rakuten/
│   │       └── route.js    # 楽天API プロキシ
│   ├── globals.css          # グローバルスタイル
│   ├── layout.js            # ルートレイアウト
│   └── page.js              # メインUI
├── public/
├── next.config.js
├── package.json
├── vercel.json
└── README.md
```

## 今後の拡張案

- Amazon PA-API連携（アフィリエイト実績が必要）
- 商品名での横断検索
- 価格履歴トラッキング
- PWA対応（スマホホーム画面追加）
