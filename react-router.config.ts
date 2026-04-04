// React Router v7 はデフォルトでディレクトリ構成やファイル命名規則に決まりがある・それらを調整するのが本ファイル・特にファイルパスを指定しなくても自動的に読み込まれる

import type { Config } from '@react-router/dev/config';

export default {
  // `client/` ディレクトリ配下を React Router v7 使用のプロジェクトとして認識させる (デフォルトは `app/` ディレクトリ)
  appDirectory: 'client',
  // SSR を無効にする (デフォルトは `true`)
  ssr: false
} satisfies Config;
