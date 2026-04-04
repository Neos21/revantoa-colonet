// React Router v7 ではこのファイル名指定

import { Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { isRouteErrorResponse, Link, Links, Outlet, Scripts, ScrollRestoration } from 'react-router';

import { isEmpty } from '../shared/helpers/is-empty';
import { pagePaths } from './shared/constants/page-paths';
import { userApi } from './shared/helpers/user-api';
import { apiPaths } from '../shared/constants/api-paths';

// `$ npx react-router typegen` で `./.react-router/` 配下に型定義が出力される (開発時は自動的に出力される)・コレを参照するのが `./+types/` という書き方 https://eiji.page/blog/react-router-dynamic-meta/
import type { Route } from './+types/root';

// `import styles from './styles.css?url';` と書いて `links()` で読み込んでいたが CSS ファイルのホットリロードに対応しておらず止めた・この書き方でビルド後は `.css` ファイルも別資材になって `link` 要素で読み込まれるので OK
import './styles.css';

export function Layout({ children }: { children: ReactNode }): ReactElement {
  // - 元のコード
  //     (() => {
  //       const lastTheme = localStorage.getItem('theme');
  //       const nextTheme = (lastTheme == null ? matchMedia('(prefers-color-scheme: dark)').matches : lastTheme === 'dark') ? 'dark' : 'light';
  //       document.documentElement.classList.add(nextTheme);
  //       document.documentElement.dataset.theme = nextTheme;
  //       localStorage.setItem('theme', nextTheme);
  //     })();
  // - 人力で圧縮
  //     ((l, h, d, t, n) => {
  //       n = l[t];
  //       n = (n ? n === d : matchMedia('(prefers-color-scheme: dark)').matches) ? d : 'light';
  //       h.classList.add(n);
  //       h.dataset[t] = l[t] = n
  //     })(localStorage, document.documentElement, 'dark', 'theme')
  // - `replace((/\s/g), '')` で改行や空白を全て削除したコードを仕込んである
  //     ((l,h,d,t,n)=>{n=l[t];n=(n?n===d:matchMedia('(prefers-color-scheme:dark)').matches)?d:'light';h.classList.add(n);h.dataset[t]=l[t]=n})(localStorage,document.documentElement,'dark','theme')
  return (
    <html lang="ja" suppressHydrationWarning>
      {/* 後述の `script` 要素によりワーニングが出るため `html` と `body` に `suppressHydrationWarning` を付ける */}
      <head>
        <meta charSet="UTF-8" />
        <title>ころねっと : 静かな SNS。</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#00ccff" />
        <meta name="description" content="静かな SNS「ころねっと」。" />
        <meta name="keywords" content="ころねっと, Colonet, SNS" />
        <meta name="robots" content="index, follow" />
        {/* Open Graph・Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ころねっと : 静かな SNS。" />
        <meta property="og:title" content="ころねっと : 静かな SNS。" />
        <meta property="og:description" content="静かな SNS「ころねっと」。" />
        <meta property="og:url" content="https://colonet.revantoa.workers.dev" />
        <meta property="og:image" content="https://colonet.revantoa.workers.dev/icon-512.png" />
        <meta property="og:locale" content="ja_JP" />
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="ころねっと : 静かな SNS。" />
        <meta property="twitter:description" content="静かな SNS「ころねっと」。" />
        <meta property="twitter:url" content="https://colonet.revantoa.workers.dev" />
        <meta property="twitter:image" content="https://colonet.revantoa.workers.dev/icon-512.png" />
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        
        {/* M Plus 1 Code ウェブフォントを読み込んでおく・M Plus 1 Code は Medium (500) ウェイトのみ読み込む・コレで通常文字と太字に対応できてる (読み込むウェイト指定は `100..700` や `400;700` といった書き方もできる) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=M+PLUS+1+Code:wght@500&amp;display=swap" fetchPriority="high" />
        <link rel="stylesheet"         href="https://fonts.googleapis.com/css2?family=M+PLUS+1+Code:wght@500&amp;display=swap" fetchPriority="high" />
        {/* Turnstile ウィジェットの読み込みを早めるための指定 */}
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        {/* Web Analytics 向けの指定 */}
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />
        
        {/* `import` した CSS を読み込むには以下が必要 */}
        <Links />
        
        {/* ダークテーマ切替のチラつき防止のためココで `html` 要素の `class` 属性・`data-theme` 属性を指定し LocalStorage にも書き込む */}
        <script dangerouslySetInnerHTML={{ __html: `((l,h,d,t,n)=>{n=l[t];n=(n?n===d:matchMedia('(prefers-color-scheme:dark)').matches)?d:'light';h.classList.add(n);h.dataset[t]=l[t]=n})(localStorage,document.documentElement,'dark','theme')` }} />
        
        {/* Cloudflare Web Analytics */}
        <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "5a7af3f82aef4c9bb1ec9ab68a6bf30a"}' />
      </head>
      <body suppressHydrationWarning>
        {children}
        
        {/* スクロール位置の復元用・`<Scripts />` の直前に置くこと https://react-router-docs-ja.techtalk.jp/api/components/ScrollRestoration */}
        <ScrollRestoration />
        {/* React のクライアントランタイムを置く・`</body>` の直前に置くこと https://react-router-docs-ja.techtalk.jp/api/components/Scripts */}
        <Scripts />
      </body>
    </html>
  );
}

export default function App(): ReactElement {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // カラーテーマを設定する (`head` 要素内の `script` でも指定しているが React 内でも整合を取るため)
  useEffect(() => {
    const lastTheme = localStorage.getItem('theme');
    const condition = lastTheme == null ? window.matchMedia('(prefers-color-scheme: dark)').matches : lastTheme === 'dark';
    onChangeTheme(condition);
    // OS・ブラウザの設定変更時に反応するようにする
    window.matchMedia('(prefers-color-scheme: dark)').onchange = (event: MediaQueryListEvent): void => onChangeTheme(event.matches);
  }, []);
  
  /** テーマ変更に応じてクラス名・`data-theme` 属性と LocalStorage を設定する */
  const onChangeTheme = (condition: boolean): void => {
    const currentTheme = condition ? 'light' : 'dark';
    const nextTheme    = condition ? 'dark' : 'light';
    document.documentElement.classList.remove(currentTheme);
    document.documentElement.classList.add(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('theme', nextTheme);
    setIsDarkMode(nextTheme === 'dark');
  };
  
  // PV カウントする
  const isCounted = useRef(false);
  useEffect(() => {
    if(isCounted.current) return;  // 開発中の Strict Mode でも1回しか実行させないようにする
    isCounted.current = true;
    if(location.href.includes(pagePaths.admin.route)) return;  // 開発者画面を初期表示している人はカウントしない
    userApi.post(apiPaths.pv.route, { json: { referrer: document.referrer }}).json().catch(() => null);  // もし JWT があれば送信したいので `userApi` を使う
  }, []);
  
  return (
    <>
      <div className="first-view-backdrop" />
      <div className="min-h-full px-4 mx-auto sm:max-w-6xl">
        <header className="flex items-center justify-between py-3">
          <h1>
            <Link to={pagePaths.route} className="font-bold text-base-content hover:text-base-content/70">ころねっと</Link>
          </h1>
          <button type="button" title={isDarkMode ? '明るくする' : '暗くする'} className="btn btn-circle" onClick={() => onChangeTheme(!isDarkMode)}>
            {isDarkMode ? <Sun /> : <Moon />}
          </button>
        </header>
        <main>
          <Outlet />
        </main>
        <footer className="text-center py-14 sticky top-[100vh]">
          <Link to={pagePaths.route} className="text-base-content/70 hover:text-base-content/50">ころねっと</Link>
        </footer>
      </div>
    </>
  );
}

/** コレがないとビルド後の `index.html` に `console.log` が仕込まれるため入れておく */
export function HydrateFallback(): ReactElement {
  return (<></>);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): ReactElement {
  let title = 'エラー';
  let text = '予期しないエラーが発生しました';
  if(isRouteErrorResponse(error)) {
    if(error.status === 404) {
      title = '404';
      text  = 'ページが見つかりませんでした';
    }
    if(!isEmpty(error.statusText)) text = error.statusText;
  }
  // `body` 要素の直下に出力される
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="p-4 m-4 text-center border rounded-md">
        <h1 className="text-lg font-bold">{title}</h1>
        <div className="mt-3">{text}</div>
        <div className="mt-4"><Link to={pagePaths.route} className="font-bold text-info hover:text-secondary">トップページに戻る</Link></div>
      </div>
    </div>
  );
}
