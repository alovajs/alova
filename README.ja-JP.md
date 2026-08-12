<img width="100%" src="https://alova.js.org/img/cover.jpg" />

<p align="center">
  <strong>Stop building request logic. Start shipping features.</strong><br/>
  <em>JavaScript のリクエスト戦略レイヤー —— リクエストコードを最大 70% 削減。</em>
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
    <img src="https://alova.js.org/img/sponsors/watchthis-dev-500.png" alt="watchthis.dev" height="40" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://worma.js.org" target="_blank" rel="noopener noreferrer">
    <img src="https://worma.js.org/img/logo.svg" alt="worma" height="40" />
  </a>
</p>

## alova とは？

alova（発音 /əˈləʊva/）は JavaScript の**リクエスト戦略レイヤー**です。ページネーション、フォーム、アップロード、リトライは何度も手書きしてきたはず。今は 20 以上の使い捨てリクエスト戦略をそのまま使うだけで、リクエストコードを最大 **70%** 削減できます。

使い慣れた axios や fetch を捨てる必要はありません。alova は既存のリクエストライブラリの上にそのまま乗り、繰り返し書いていたロジックを引き継ぎます。1 つの API セットが React、Vue、Svelte、Solid、ミニプログラム、サーバーを横断 — 一度覚えればどこでも使え、クライアント側もサーバー側もビジネスロジックに集中できます。

以下はページネーション付きリストのコードです。次ページの事前読み込み、自動キャッシュ、作成・更新・削除時の自動同期が組み込みで、わずか 5 行程度：

```javascript
const todoList = (page, size) => alova.Get('/api/todos', { params: { page, size } });

const { loading, data, page, pageSize, pageCount, total } = usePagination(todoList);
// 自動ページネーション · 次ページ事前読み込み · 作成/更新/削除でキャッシュ自動同期
```

## 特徴

alova が「何か」を並べるのではなく、何を解決してくれるかを見てみましょう：

| うんざりしているボイラープレート                           | alova が提供するもの                                          | 得られる効果                                         |
| :--------------------------------------------------------- | :------------------------------------------------------------ | :--------------------------------------------------- |
| ページネーション、フォーム、アップロード、SSE 状態の手書き | `usePagination` / `useForm` / `useUploader` / `useSSE`        | 最大 70% のボイラープレート削減                      |
| サーバー側のレート制限とリトライ（分散含む）               | `alova/server`                                                | React Query / SWR がカバーしていない機能             |
| フレームワークごとに同じロジックを再実装                   | 1 つの API セット                                             | React / Vue / Svelte / Solid / ミニプログラムを横断  |
| キャッシュ無効化を手動で管理                               | 多段キャッシュ（L1/L2）+ `hitSource` による宣言的な自動無効化 | キャッシュ無効化が苦痛でなくなる                     |
| ドキュメントとエディタ間で API 情報をコピペ                | `worma`                                                       | API のヒントとドキュメントがエディタに直接表示される |

もちろん以下も：

- 使いやすく、[動画チュートリアル](https://alova.js.org/video-tutorial)を見れば5分で始められます。
- お気に入りの HTTP クライアントや UI フレームワークと完全に互換性があります。
- 20 以上の高性能リクエスト戦略（ビジネスモジュール）で、より高速なアプリを構築できます。
- リクエストの共有とレスポンスキャッシュにより、アプリのパフォーマンスを向上させます。
- エンドツーエンドの型安全。
- 高度な OpenAPI ソリューション `worma`：1 つの OpenAPI 仕様から、型安全な呼び出しコード、TypeScript 型、完全な API ドキュメント、そして AI コーディングアシスタントが読める API 知識を一度に生成。

## いつ alova を使うべきか？

alova はどこで輝き、どこでよりシンプルなツールで十分なのかを正直に伝えます：

| あなたの状況                                                     | 推奨                                            |
| :--------------------------------------------------------------- | :---------------------------------------------- |
| 単純な CRUD + キャッシュ                                         | React Query / SWR で十分                        |
| 複雑な管理画面 / フォーム / ページネーション / アップロード      | ✅ alova が明らかに一歩先んじる                 |
| クロスプラットフォーム（Web + ミニプログラム / uni-app / Taro）  | ✅ 1 つの API セットで全部カバー                |
| サーバー側のリクエストガバナンス（レート制限 / リトライ / 分散） | ✅ alova がほぼ唯一の選択肢                     |
| OpenAPI → 型安全なコード + AI フレンドリーな API 知識            | ✅ `worma` と組み合わせ（alova にそのまま対応） |

alova が本当に自分に合うか迷ったら、コミットする前に[いつ alova を使うべきではないか](https://alova.js.org/about/comparison)の正直な逆リストをお読みください。

## 何が違うのか？

`@tanstack/react-query`、`swrjs`、`ahooks`の`useRequest`などのライブラリとは異なり、alovaはAPI統合を非常に簡単かつ効率的にすることを目指しており、より効率的なデータ通信を維持しながら、ユーザーによりスムーズな体験を提供します。

同じページネーション付きリストで、React Query は約 25 行必要なのに対し、alova の `usePagination` は約 5 行です —— [脚色なしの比較](https://alova.js.org/about/comparison)をご覧ください。

> alovaの違いについて詳しくは、[他のリクエストライブラリとの比較](https://alova.js.org/about/comparison)もご覧ください。

## コミュニティに参加する

- [Xでフォロー](https://x.com/alovajs)
- [Discordに参加](https://discord.gg/S47QGJgkVb)
- [WeChatグループに参加](https://alova.js.org/img/wechat_qrcode.jpg)

## サポートのお願い

alovaを気に入っていただけましたら、右上のスターをいただけると大変嬉しいです。それは私たちの活動に対する評価と励みになります。

## コントリビューション歓迎

世界中の開発者からIssueやDiscussionに積極的にご参加いただけることを光栄に思います。

alovaを、参加したいと思うすべての人の共通プロジェクトにしたいと考えています。オープンで包括的な姿勢で、誰もがalovaコミュニティのコントリビューターになることを奨励しています。初心者の開発者であっても、あなたのアイデアがalovaの開発ガイドラインに合致していれば、ぜひ積極的にご参加ください。

効果的なコントリビューションは、Alovaコミュニティで一定の評価を得ることができます。コントリビューションの前に、[コントリビューションガイド](./CONTRIBUTING.md)を必ず詳しくお読みいただき、あなたのコントリビューションが効果的であることをご確認ください。

## 変更履歴

[リンク](https://github.com/alovajs/alova/releases)

## コントリビューター

<a href="https://github.com/alovajs/alova/graphs/contributors">
<img src="https://contrib.rocks/image?repo=alovajs/alova&max=30&columns=10" />
</a>

## ライセンス

[MIT](https://en.wikipedia.org/wiki/MIT_License)
