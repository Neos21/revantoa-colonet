# Colonet (v2)

`https://colonet.revantoa.workers.dev`


## コンセプト

- 昔の Twitter のような、短文投稿型の SNS
    - 捉え方によっては「ゲストブック」のような見た目
- 目指したい「場の空気感」
    - 繋がらない、主張しない、競争しない、意見を交わさない、批判しない。でも、独りではない空間
    - 自我を手放した言葉だけが残る、何者かになる必要のない、承認も対立もない、静けさと距離感を大切にする
    - 他人の自我に触れず、他人の存在だけを感じられる
    - 昨今の SNS に疲れている人達の、心が落ち着く場所にする
- 避けたいこと
    - フォロー関係の構築、いいね・低評価の数値化、拡散や炎上を意図した投稿
- ホームタイムライン
    - リアルタイムな時系列順にはしない。時系列を混ぜ、高評価が多いものを優先的にする
    - 個人を識別する情報は表示されず、誰が投稿した内容かは分からない
- 投稿機能
    - 投稿、他人の投稿の評価には「ユーザ ID・パスワード」登録によるユーザ認証を設ける
        - 荒らしや意図しない投稿をする人を排除するため。身元特定は目的ではないので、ユーザ認証以外に荒らしを防ぐ良い方法が見つかれば変える
    - 投稿前には Turnstile による Bot チェック : ワンクッション置かせることによる潜在的な荒らし・連投対策を狙う
    - 投稿に際しては IP アドレス、User Agent など取得できる情報は取得しておく
    - 投稿後の編集は認めず、削除のみ可能とする (物理削除ではなく論理削除)
- 評価機能
    - Reddit の Up Vote・Down Vote 相当の機能
    - ユーザ登録した人が、他人の1投稿に対して1回だけ指定できる。取り消しや逆への付け直しは許容する
    - 画面上には評価数などは表示せず、「ホームタイムライン」の表示優先度を調整するためだけに内部的に使用する
    - Up Vote は「その投稿で心が温かくなった」「読めて良かった」といった好評価を示す
    - Down Vote は「その投稿で心がザワザワした」「読みたくなかった」といった低評価を示す
- 管理者機能
    - 場の空気を悪くする投稿やユーザは削除できるようにするが、その際、「削除理由」をメモして残せる方式にする
        - 後々、何が嫌だったのか、どういった制限を設ければ未然に投稿を防げるかを分析しシステム改善に用いるため


## 技術スタック

- Cloudflare Workers : サイトのデプロイ先
    - Hono : バックエンド
    - React + React Router v7 : フロントエンド
- Cloudflare D1 : SQLite データベース
- Cloudflare Web Analytics : アクセス解析・React の HTML ファイルに `script` 要素を仕込んである。Ad Blocker とかにビーコンスクリプトがブロックされるので正確性には欠けそう


## ファイル構成

```
colonet/
├ README.md      … このファイル
├ .gitignore
├ package.json
├ tsconfig.json
├ vite.config.ts … React Router v7 と Hono を Vite (開発環境) で統合して起動するための設定
├ eslint.config.ts
│
├ wrangler.jsonc            … Cloudflare Workers プロジェクトとしての設定。サーバのエントリポイント、クライアント資材のエントリポイント、D1 データベースとのバインディングなど
├ worker-configuration.d.ts … `$ npm run generate-types` (`$ npx wrangler types`) で自動生成しておく
├ .wrangler/                … ローカル開発環境のデータ・消えても大丈夫
│
├ server/     … Hono バックエンド
│ └ index.ts … バックエンドのエントリポイント
│
├ react-router.config.ts … React Router v7 の設定ファイル・`react-router` がこのファイル名で自動的に認識する
├ client/                … React・React Router v7 フロントエンド
│ ├ root.tsx            … クライアントのエントリポイント・`react-router` がこのファイル名で自動的に認識する
│ └ routes.ts           … ルーティング定義・`react-router` がこのファイル名で自動的に認識する
├ public/                … 静的資材、ビルド時に自動的に `build/` へ合成される
├ .react-router/         … `$ npm run generate-types` (`$ npx react-router typegen`) で自動生成しておく・`$ npm run dev` コマンドでも自動生成されるが `$ npm run build` 前に必須になる点に注意
├ build/                 … ビルドされた資材
│ └ client/             … `wrangler.jsonc` でココの階層までで指定してる
│
└ shared/      … `server/` と `client/` で共用できるコード
   ├ helpers/  … 特定のドメインロジックに依存しない汎用的なユーティリティ
   └ services/ … 特定のドメインロジックに関係するモノ
```


## コマンド

```bash
# Wrangler CLI v4.58.0 でログイン状態を確保しておく
$ wrangler whoami

$ npm install

# 開発サーバを起動する
$ npm run dev

# ESLint を実行する
$ npm run lint
# Wrangler CLI と React Router CLI を使用して型定義を出力する
$ npm run generate-types
# 型定義を出力し資材をビルドする
$ npm run build

# 型定義を出力し資材をビルドして Wrangler CLI でプレビューする
$ npm run preview

# 型定義を出力しビルドして `wrangler.jsonc` で指定した名前にデプロイする (`$ wrangler deploy`)
$ npm run deploy
```

```bash
# ルーティング一覧を出力する
$ npm run print-routes

# コードの類似度をチェックする
$ npx jscpd ./server/ ./client/ ./shared/ --reporters html
```


## VSCode 拡張機能

- Headwind : Tailwind CSS のクラス名をソートする


## D1 SQLite データベース

```bash
# D1 データベースを作成する
$ wrangler d1 create colonet

# ローカルとリモートを指定して SQL を実行する
$ wrangler d1 execute colonet --local  --command='SELECT * FROM posts'
$ wrangler d1 execute colonet --remote --command='SELECT * FROM posts'
$ wrangler d1 execute colonet --local  --file='./schema.sql'
$ wrangler d1 execute colonet --remote --file='./schema.sql'

# インデックス一覧を確認する
$ wrangler d1 execute colonet --local  --command='SELECT * FROM sqlite_master WHERE type = '\''index'\'''
$ wrangler d1 execute colonet --remote --command='SELECT * FROM sqlite_master WHERE type = '\''index'\'''
```

- `CURRENT_TIMESTAMP` は ISO 8601 (`YYYY-MM-DD HH:mm:SS`) の UTC が原則 (SQLite として書式が厳密に保証されるワケではないようだが)
    - パフォーマンスが気になる場合は `TEXT` ではなく `INTEGER` で日時情報を持つのも一つの手段
- インデックスに関するメモ
    - `EXPLAIN QUERY PLAN SELECT …` で使用されるインデックスが確認できる
    - `PRIMARY KEY` に対しては自動的にインデックスが設定される
    - インデックスの張りすぎは追加・更新・削除時に速度低下を招く
    - インデックス作成時の `ON` 以降のカラム順序は、`WHERE` 句で使用される順に書き、`ORDER BY` で使用するものを後の方に書くと高速化に繋がる
- パフォーマンスに関するメモ
    - `.first();` で1件だけ取得する場合も `LIMIT 1` を明示しておくと、1件見つかった瞬間に終了してくれる
    - レコードが存在するか否かだけ確かめられれば良い場合は、`id` などを取得するのではなく `SELECT 1` とすると早い

```sql
-- ユーザ
CREATE TABLE users (
  id             INTEGER  PRIMARY KEY  AUTOINCREMENT,
  name           TEXT     NOT NULL,                                           -- ログインに使用するユーザ ID
  password_hash  TEXT     NOT NULL,                                           -- ログインに使用するパスワードのハッシュ
  created_at     TEXT     NOT NULL  DEFAULT CURRENT_TIMESTAMP,                -- 登録日時
  last_login_at  TEXT,                                                        -- 最終ログイン日時
  recovery_code  TEXT     NOT NULL,                                           -- リカバリコード
  is_deleted     INTEGER  NOT NULL  CHECK (is_deleted IN (0, 1))  DEFAULT 0,  -- 削除した場合は `1` を入れる
  admin_memo     TEXT                                                         -- 凍結操作時などに管理者がメモをするためのカラム
);
-- ユーザ ID をユニークにする : `WHERE name = ?` のパフォーマンスにも寄与する
CREATE UNIQUE INDEX index_users_name ON users(name);
-- 名前と削除フラグを条件や取得項目に用いた時のパフォーマンス対策インデックス
CREATE INDEX index_performance_users_name_is_deleted ON users(name, is_deleted);
-- タイムライン取得時にユーザ ID で結合しつつ削除フラグを条件に入れているためのインデックス
CREATE INDEX index_performance_users_id_is_deleted ON users(id, is_deleted);

-- 投稿
-- - 外部キー制約 `FOREIGN KEY (user_id) REFERENCES users(id)` を設けても良かったかもしれないが D1 では使用できない可能性があるので明記はしないでおく
-- - 削除したデータを別テーブルに控える方式だと、JOIN や集計が壊れやすく、復元したくなった時に手間なので一旦はフラグ管理とする
-- - 以下の「評価」テーブルの内容を `score` カラムとしてキャッシュ保持するのもアリかも (パフォーマンス次第)
CREATE TABLE posts (
  id               INTEGER  PRIMARY KEY  AUTOINCREMENT,
  content          TEXT     NOT NULL,                                           -- 投稿内容
  user_id          INTEGER  NOT NULL,                                           -- 投稿したユーザの `users.id`
  ip_address       TEXT     NOT NULL,                                           -- 投稿時のユーザの IP アドレス
  user_agent       TEXT     NOT NULL,                                           -- 投稿時のユーザの User Agent
  created_at       TEXT     NOT NULL  DEFAULT CURRENT_TIMESTAMP,                -- 登録日時
  vote_count_up    INTEGER  NOT NULL  CHECK (vote_count_up   >= 0)  DEFAULT 0,  -- キャンセル・削除されていない好評価の数
  vote_count_down  INTEGER  NOT NULL  CHECK (vote_count_down >= 0)  DEFAULT 0,  -- キャンセル・削除されていない低評価の数
  is_deleted       INTEGER  NOT NULL  CHECK (is_deleted IN (0, 1))  DEFAULT 0,  -- 削除した場合は `1` を入れる
  admin_memo       TEXT                                                         -- 削除時にメモをするためのカラム
);
-- タイムライン取得時に削除フラグを条件に、投稿日時をソートに使用しているためのインデックス
CREATE INDEX index_performance_posts_is_deleted_created_at_desc ON posts(is_deleted, created_at DESC);
-- 管理用タイムラインの取得時に効果を発揮する
CREATE INDEX index_performance_posts_created_at_desc ON posts(created_at DESC);

-- 1投稿に対する評価
CREATE TABLE votes (
  id            INTEGER  PRIMARY KEY  AUTOINCREMENT,
  post_id       INTEGER  NOT NULL,                                             -- 評価対象の `posts.id`
  user_id       INTEGER  NOT NULL,                                             -- 評価したユーザの `users.id`
  vote          INTEGER  NOT NULL  CHECK (vote IN (-1, 1)),                    -- 評価内容 : 低評価は `-1`・好評価は `1` として保存し、それ以外の値は認めない
  is_cancelled  INTEGER  NOT NULL  CHECK (is_cancelled IN (0, 1))  DEFAULT 0,  -- 直前の評価を取り消した場合は `1` を入れる (一度 `INSERT` したら `DELETE` は発生しないようにする)
  ip_address    TEXT     NOT NULL,                                             -- 評価したユーザの IP アドレス
  user_agent    TEXT     NOT NULL,                                             -- 評価したユーザの User Agent
  created_at    TEXT     NOT NULL  DEFAULT CURRENT_TIMESTAMP,                  -- 登録日時
  is_deleted    INTEGER  NOT NULL  CHECK (is_deleted IN (0, 1))  DEFAULT 0,    -- 削除した場合は `1` を入れる
  admin_memo    TEXT                                                           -- 削除時にメモをするためのカラム
);
-- 1ユーザ・1投稿につき1票を保証する
CREATE UNIQUE INDEX index_votes_post_user ON votes(post_id, user_id);
-- タイムライン取得時に削除フラグを条件に使用しているためのインデックス
CREATE INDEX index_performance_votes_post_id_user_id_is_deleted ON votes(post_id, user_id, is_deleted);
-- 管理用タイムラインの取得時に効果を発揮する
CREATE INDEX index_performance_votes_post_id_is_deleted_vote ON votes(post_id, is_deleted, vote);
CREATE INDEX index_performance_votes_post_id_created_at_desc ON votes(post_id, created_at DESC);
-- 管理画面での `posts.vote_count_up`・`posts_vote_count_down` の再集計時に効果を発揮する
CREATE INDEX index_performance_votes_user_id_post_id ON votes(user_id, post_id);
CREATE INDEX index_performance_votes_post_id_vote_is_cancelled_is_deleted ON votes(post_id, vote, is_cancelled, is_deleted);

-- 拒否する IP アドレス一覧
CREATE TABLE deny_ip_addresses (
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,
  ip_address  TEXT     NOT NULL,
  created_at  TEXT     NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
-- ユニークにする
CREATE UNIQUE INDEX index_deny_ip_address ON deny_ip_addresses(ip_address);

-- 監査ログ
CREATE TABLE audit_logs (
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,
  log         TEXT     NOT NULL,
  created_at  TEXT     NOT NULL  DEFAULT CURRENT_TIMESTAMP
);

-- PV カウンタ
CREATE TABLE counters (
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,
  name        TEXT,                                         -- ログインしていればユーザ名
  ip_address  TEXT,                                         -- IP アドレス
  user_agent  TEXT,                                         -- User Agent
  referrer    TEXT,                                         -- リファラ
  created_at  TEXT     NOT NULL  DEFAULT CURRENT_TIMESTAMP  -- アクセス日時
);

-- 匿名投稿
CREATE TABLE anonymous_posts (
  id               INTEGER  PRIMARY KEY  AUTOINCREMENT,
  content          TEXT     NOT NULL,                                           -- 投稿内容
  ip_address       TEXT     NOT NULL,                                           -- 投稿時のユーザの IP アドレス
  user_agent       TEXT     NOT NULL,                                           -- 投稿時のユーザの User Agent
  created_at       TEXT     NOT NULL  DEFAULT CURRENT_TIMESTAMP,                -- 登録日時
  is_deleted       INTEGER  NOT NULL  CHECK (is_deleted IN (0, 1))  DEFAULT 0,  -- 削除した場合は `1` を入れる
  admin_memo       TEXT                                                         -- 削除時にメモをするためのカラム
);
-- タイムライン取得時に削除フラグを条件に、投稿日時をソートに使用しているためのインデックス
CREATE INDEX index_performance_anonymous_posts_is_deleted_created_at_desc ON anonymous_posts(is_deleted, created_at DESC);
```


## シークレット

- ローカルでは `.dev.vars` ファイルを参照する (Git 管理対象外)
    - シークレットに似ているが秘匿されない「テキスト」は `wrangler.jsonc` の `vars` で定義する (Wrangler CLI では登録できないっぽいので Web 管理画面で行う)
- `server/types/hono-bindings.ts` で型定義に含めておく
    - シークレットもテキストも同じように型定義しておけば利用できる

```bash
$ echo 'VALUE' | wrangler secret put USER_JWT_SECRET      --name colonet
$ echo 'VALUE' | wrangler secret put ADMIN_PASSWORD       --name colonet
$ echo 'VALUE' | wrangler secret put ADMIN_JWT_SECRET     --name colonet
$ echo 'VALUE' | wrangler secret put TURNSTILE_SECRET_KEY --name colonet
```


## package.json

### npm Scripts

| Name           | Description                                                                                                                                                                               |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| dev            | `@react-router/dev` 内の React Router CLI を使用して Vite による開発サーバを起動する・`isbot` パッケージが勝手にインストールされる                                                        |
| lint           | ESLint を実行して自動修正を行う                                                                                                                                                           |
| generate-types | Wrangler CLI を使用して `.dev.vars` を参照しつつ Workers が使用する型定義ファイルを `worker-configuration.d.ts` に出力する・React Router CLI を使用して `.react-router/` 型定義を出力する |
| build          | React Router CLI が Vite を使用して本番ビルドする                                                                                                                                         |
| build-only     | `npm run build` が `npm run generate-types` と `tsc` の後に実際のビルドを行うのに対して、本コマンドは `react-router build` コマンドのみを実行する                                         |
| preview        | Vite ビルド後に Wrangler の開発サーバを起動する                                                                                                                                           |
| preview-only   | ビルド処理をスキップして Wrangler の開発サーバを起動する                                                                                                                                  |
| deploy         | Vite ビルド後に Cloudflare Workers にデプロイする                                                                                                                                         |
| deploy-only    | ビルド処理をスキップして Cloudflare Workers にデプロイする                                                                                                                                |
| tsc            | TypeScript コンパイルチェックを行う                                                                                                                                                       |
| wrangler       | Wrangler CLI                                                                                                                                                                              |
| print-routes   | Hono インスタンスと定数オブジェクトを元に API エンドポイント一覧とフロントエンドのルート一覧を出力する                                                                                    |

### 依存パッケージ

#### フロントエンド・バックエンド共通

- TypeScript 対応
    - `typescript`
    - `@types/node`
- Hono と React Router v7 を Vite 内で統合するためのプラグイン
    - `hono-react-router-adapter`
    - `@hono/vite-dev-server` … `wrangler.jsonc` の Bindings を取り込めるようにする
- Zod … バリデーションとスキーマ定義
    - `zod` … `dependencies`
- ESLint
    - `$ npm init @eslint/config@latest` で以下の基本パッケージをインストールし `eslint.config.ts` を出力した
        - `eslint`
        - `globals` … 環境に応じたグローバル変数を認識させる
        - `@eslint/js` … 標準ルール
        - `typescript-eslint` … TypeScript 用ルール
        - `eslint-plugin-react` … React 向けルール
    - 追加で以下をインストールし設定ファイルに追記した
        - `eslint-plugin-import` … `import` 文の整理・検証
        - `eslint-plugin-tailwindcss@beta` … Tailwind CSS のクラス名の検証。Tailwind CSS v4 に対応したバージョンをインストールするため `@beta` を指定している
        - `@types/eslint-plugin-tailwindcss` … 上のプラグインを `eslint.config.ts` で `import` した時に怒られるので入れた
    - Prettier (`prettier-plugin-tailwindcss`) を検討したが、垂直揃えなどのスタイルも強制変更されてしまうため入れないことにした

#### フロントエンド

- [React Router v7 によるランタイム依存関係](https://react-router-docs-ja.techtalk.jp/tutorials/quickstart#%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
    - `react-router` … `dependencies`
    - `@react-router/node` … `dependencies`
    - `isbot` … `dependencies` (SSR 用みたいなので SPA の場合は要らないのだが無理やりインストールされるので仕方なく)
    - `react` … `dependencies`
    - `react-dom` … `dependencies`
    - `@types/react`
    - `@types/react-dom`
- React Router v7 の開発用ランタイム
    - `@react-router/dev` … Vite 開発サーバで React Router v7 を動作させるためのプラグイン
    - `vite` … Vite (開発サーバ・ビルドツール)
- Tailwind CSS … CSS フレームワーク
    - `tailwindcss`
    - `@tailwindcss/vite`
- daisyUI … Tailwind CSS ベースにセマンティックなクラス名やコンポーネントを用意してくれる CSS ライブラリ
    - `daisyui`
- Lucide … アイコンセット
    - `lucide-react` … `dependencies` (ビルドして提供されるフロントエンド資材でも、本番環境で利用されるモノは `dependencies` に書くのがお作法らしい)
- Turnstile ウィジェット
    - `@marsidev/react-turnstile` … `dependencies`
- Ky … Fetch API のラッパー
    - `ky` … `dependencies`
- Zustand … ストア管理。自動的に LocalStorage と同期してくれる
    - `zustand` … `dependencies`

#### バックエンド

- Hono … バックエンド
    - `hono` … `dependencies`
- Wrangler CLI … Cloudflare Workers・D1 の開発・デプロイ用ツール
    - `wrangler`
- bcrypt.js … パスワードのハッシュ化・検証
    - `bcryptjs` … `dependencies`
    - `@types/bcryptjs`
- nanoid … リカバリコードの生成
    - `nanoid` … `dependencies`


## Links

- [Neo's World](https://neos21.net/)
