import "./globals.css";

export const metadata = {
  title: "楽天 vs Amazon 実質価格シミュレーター",
  description: "ポイント還元込みの実質価格を比較。SPU・買いまわり・プライム会員を考慮した正確な比較ツール。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
