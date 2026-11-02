<img width="100%" src="https://alova.js.org/img/cover.jpg" />

<p align="center">
  <strong>リクエストの単位は、一度の呼び出しではなく、シナリオです。</strong><br/>
  <em>alova はフルスタック・リクエスト戦略ライブラリで、リクエストロジックをすぐ使えるリクエスト戦略として整理します。</em>
</p>

<p align="center"><a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a> | 日本語</p>

<p align="center">
  <a href="https://alova.js.org">ドキュメント</a> | 
  <a href="https://alova.js.org/examples">デモ</a>
</p>

[![npm](https://img.shields.io/npm/v/alova)](https://www.npmjs.com/package/alova)
[![build](https://github.com/alovajs/alova/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/alovajs/alova/actions/workflows/release.yml)
[![coverage status](https://coveralls.io/repos/github/alovajs/alova/badge.svg?branch=main)](https://coveralls.io/github/alovajs/alova?branch=main)
[![stars](https://img.shields.io/github/stars/alovajs/alova?style=social)](https://github.com/alovajs/alova)
[![discord](https://img.shields.io/badge/chat-Discord-515ff1)](https://discord.gg/S47QGJgkVb)
[![wechat](https://img.shields.io/badge/chat_with_CH-Wechat-07c160)](https://alova.js.org/img/wechat_qrcode.jpg)
[![tree shaking](https://badgen.net/bundlephobia/tree-shaking/alova)](https://bundlephobia.com/package/alova)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)
![strategies](https://img.shields.io/badge/strategies-20%2B-blue)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

## スポンサー

alova の開発を支援してくださっている以下のスポンサーに感謝します。

<p align="center">
  <a href="https://watchthis.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://alova.js.org/img/sponsors/watchthis-dev-500.png" alt="watchthis.dev" height="80" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://worma.js.org" target="_blank" rel="noopener noreferrer">
    <img src="https://worma.js.org/img/logo.svg" alt="worma" height="80" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://sealedrose.com/verify-video" title="Sealed Rose — AI Deepfake Detector" target="_blank" rel="noopener noreferrer">
    <img src="https://alova.js.org/img/sponsors/mark-pure-white-wax.png" alt="Sealed Rose — AI Deepfake Detector" height="80" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://jamfeed.com/tools/instagram-account-analyzer-for-musicians/" title="JamFeed — Instagram Account Analyzer for Musicians" target="_blank" rel="noopener noreferrer">
    <img src="https://alova.js.org/img/sponsors/jamfeed.png" alt="JamFeed — Instagram Account Analyzer for Musicians" height="80" />
  </a>
</p>

## alova とは

alova（発音 /əˈləʊva/）は**フルスタック・リクエスト戦略ライブラリ**です。リクエストを一度きりの呼び出しではなく、ライフサイクルを持つ「シナリオ」として捉え、分页、フォーム、アップロード、認証といったクライアント側のロジックや、リトライ・検証サービス・BFF などのサーバー側ロジックを、すぐ使える**リクエスト戦略**として整理します。

使い慣れた axios や fetch を捨てる必要はありません。alova は既存のリクエストライブラリの上にそのまま乗り、繰り返し書いていたロジックを引き継ぎます。1 つの API セットが React、Vue、Svelte、Solid、ミニプログラム、サーバーを横断 — 一度覚えればどこでも使えます。

背景は [なぜ alova が作られたか](https://alova.js.org/about/faqs) で、違いは [他のリクエストライブラリとの比較](https://alova.js.org/about/comparison) で読めます。

## なぜ alova を使うのか

### 1. 届くのは「動くリクエスト」ではなく、完結したシナリオ

AI Coding の時代、アプリを差別化するのはユーザー体験です。AI の能力が足りないのではなく、プロンプトに以下のリクエスト機能を書くことはまずありません — リクエストをどう管理すべきかのチェックリストを誰も教えてくれないからです。例えば：

- **入力デバウンス**：書かないと、素早い入力で連続してリクエストが飛ぶ
- **同一条件のキャッシュヒット**：書かないと、同じエンドポイントを何度も呼ぶ
- **古いレスポンスの破棄**：書かないと、古いレスポンスが新しいものを上書きする
- **失敗時の自動リトライ**：書かないと、1 回の失敗で画面が真っ白になる
- **次ページの先読み**：書かないと、ページ送りのたびにローディングを見つめる
- ...

このチェックリストこそ [RSM（リクエストシナリオモデル）](https://alova.js.org/tutorial/getting-started/rsm) であり、alova はそれをシナリオフックの設定項目に落とし込みます。

### 2. AI の書いたコードをレビューする必要がない

リクエスト層のコードはページの大きな割合を占め、AI が書いたコードはいつも再レビューが必要です。alova を使えば、リクエスト層は「審査すべき実装」から「確認だけすればよい設定」になります — 時間を節約しつつ安定性も高まります。

## 特徴

- 使いやすく、[動画チュートリアル](https://alova.js.org/video-tutorial) を見れば 5 分で始められます。
- クライアントリクエスト戦略：`usePagination` / `useForm` / `useUploader` / `useSSE` / `useWatcher` / `useFetcher` / `useCaptcha` / `useSQRequest` など — [リクエスト戦略一覧](https://alova.js.org/tutorial/client/strategy)。
- サーバーリクエスト戦略：`atomize` / `retry` / `createRateLimiter` など — [server hooks](https://alova.js.org/tutorial/server/strategy)。
- 1 つの API セットが React、Vue、Svelte、Solid、ミニプログラム、Node.js / Deno / Bun を横断し、お気に入りの HTTP クライアントや UI フレームワークと完全互換。
- リクエスト共有と多段キャッシュ、エンドツーエンドの型安全で、アプリのパフォーマンスを向上。
- 高度な OpenAPI ソリューション `worma`：1 つの OpenAPI 仕様から、型安全な呼び出しコード、TypeScript 型、API ドキュメント、AI コーディングアシスタント向けの API 知識を生成。
- AI コーディングアシスタントで開発？ alova の [Agent Skills](https://alova.js.org/tutorial/getting-started/agent-skills) を導入すれば、Agent が公式のベストプラクティスに沿ってコードを書きます。

## 何が違うのか？

`@tanstack/react-query` や `swr` はリクエストを**データ同期**（単位：query）として抽象化しますが、alova はリクエストを**シナリオ**（単位：scenario）として抽象化します。これは機能の多さではなく、定義上の違いです。

リクエストコードの中で「実行」はたいてい 1 行だけで、axios / fetch がそれに十分です。本当に時間がかかるのは、いつ発火させるか、今回本当に送るべきか、レスポンスが戻ってきたらどう使うか — この 3 段を alova が引き受けます。分页なら `usePagination` を 1 回宣言するだけで、ページ送り・先読み・作成更新削除の同期が含まれます。

詳しくは [他のリクエストライブラリとの比較](https://alova.js.org/about/comparison) をご覧ください。

## コミュニティに参加する

- [Xでフォロー](https://x.com/alovajs)
- [Discordに参加](https://discord.gg/S47QGJgkVb)
- [WeChatグループに参加](https://alova.js.org/img/wechat_qrcode.jpg)

## サポートのお願い

alova を気に入っていただけましたら、右上のスターをいただけると大変嬉しいです。それは私たちの活動に対する評価と励みになります。

## コントリビューション歓迎

世界中の開発者から Issue や Discussion に積極的にご参加いただけることを光栄に思います。

alova を、参加したいと思うすべての人の共通プロジェクトにしたいと考えています。オープンで包括的な姿勢で、誰もが alova コミュニティのコントリビューターになることを奨励しています。初心者の開発者であっても、あなたのアイデアが alova の開発ガイドラインに合致していれば、ぜひ積極的にご参加ください。

効果的なコントリビューションは、Alova コミュニティで一定の評価を得ることができます。コントリビューションの前に、[コントリビューションガイド](./CONTRIBUTING.md) を必ず詳しくお読みいただき、あなたのコントリビューションが効果的であることをご確認ください。

## 変更履歴

[リンク](https://github.com/alovajs/alova/releases)

## コントリビューター

<a href="https://github.com/alovajs/alova/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=alovajs/alova&max=30&columns=10" />
</a>

## ライセンス

[MIT](https://en.wikipedia.org/wiki/MIT_License)
