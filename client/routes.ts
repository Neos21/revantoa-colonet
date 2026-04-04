// React Router v7 ではこのファイル名指定

import { type RouteConfig, index, route } from '@react-router/dev/routes';

import { pagePaths } from './shared/constants/page-paths';

// React Router v7 のルーティング定義 : 文字列でコンポーネントパスを渡しているこの書き方なら Lazy Loading 対応
// `route()` の第1引数は `/` を含めても含めなくても全く同じ動作をする
export default [
  index('./pages/index/index.tsx'),
  
  route(pagePaths.signup.route        , './pages/signup/signup.tsx'),
  route(pagePaths.login.route         , './pages/login/login.tsx'),
  route(pagePaths.forgotPassword.route, './pages/forgot-password/forgot-password.tsx'),
  
  route(pagePaths.anonymous.route, './pages/anonymous/anonymous.tsx'),
  
  route(pagePaths.settings.route      , './pages/settings/settings.tsx'),
  route(pagePaths.settings.posts.route, './pages/settings/posts/posts.tsx'),
  
  route(pagePaths.admin.route                , './pages/admin/admin.tsx'),
  route(pagePaths.admin.dashboard.route      , './pages/admin/dashboard.tsx'),
  route(pagePaths.admin.users.route          , './pages/admin/users.tsx'),
  route(pagePaths.admin.posts.route          , './pages/admin/posts.tsx'),
  route(pagePaths.admin.votes.route          , './pages/admin/votes.tsx'),
  route(pagePaths.admin.denyIpAddresses.route, './pages/admin/deny-ip-addresses.tsx'),
  route(pagePaths.admin.auditLogs.route      , './pages/admin/audit-logs.tsx'),
  route(pagePaths.admin.timelines.route      , './pages/admin/timelines.tsx'),
  route(pagePaths.admin.counters.route       , './pages/admin/counters.tsx'),
  route(pagePaths.admin.anonymousPosts.route , './pages/admin/anonymous-posts.tsx')
] satisfies RouteConfig;
