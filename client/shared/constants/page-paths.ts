import { joinPath } from '../../../shared/constants/api-paths';

/** ページパスに使用するセグメント (`/` を付与しないで宣言する) */
const pageSegments = {
  signup: 'signup',
  login : 'login',
  forgotPassword: 'forgot-password',
  
  anonymous: 'anonymous',
  
  settings: 'settings',
  settingsPosts: 'posts',
  
  admin: 'admin',
  adminDashboard: 'dashboard',
  adminUsers: 'users',
  adminPosts: 'posts',
  adminVotes: 'votes',
  adminDenyIpAddresses: 'deny-ip-addresses',
  adminAuditLogs: 'audit-logs',
  adminTimelines: 'timelines',
  adminCounters: 'counters',
  adminAnonymousPosts: 'anonymous-posts'
} as const;

/** ページパス定義 */
export const pagePaths = {
  /** 通常タイムライン */
  route: joinPath(),
  
  /** ユーザ登録 */
  signup: {
    route: joinPath(pageSegments.signup)
  },
  /** ログイン */
  login: {
    route: joinPath(pageSegments.login)
  },
  /** パスワードリセット */
  forgotPassword: {
    route: joinPath(pageSegments.forgotPassword)
  },
  
  /** 匿名タイムライン */
  anonymous: {
    route: joinPath(pageSegments.anonymous)
  },
  
  /** ユーザ設定 */
  settings: {
    route: joinPath(pageSegments.settings),
    
    posts: {
      route: joinPath(pageSegments.settings, pageSegments.settingsPosts)
    }
  },
  
  /** 管理用 */
  admin: {
    route: joinPath(pageSegments.admin),
    
    dashboard: {
      route: joinPath(pageSegments.admin, pageSegments.adminDashboard)
    },
    users: {
      route: joinPath(pageSegments.admin, pageSegments.adminUsers)
    },
    posts: {
      route: joinPath(pageSegments.admin, pageSegments.adminPosts)
    },
    votes: {
      route: joinPath(pageSegments.admin, pageSegments.adminVotes)
    },
    denyIpAddresses: {
      route: joinPath(pageSegments.admin, pageSegments.adminDenyIpAddresses)
    },
    auditLogs: {
      route: joinPath(pageSegments.admin, pageSegments.adminAuditLogs)
    },
    timelines: {
      route: joinPath(pageSegments.admin, pageSegments.adminTimelines)
    },
    counters: {
      route: joinPath(pageSegments.admin, pageSegments.adminCounters)
    },
    anonymousPosts: {
      route: joinPath(pageSegments.admin, pageSegments.adminAnonymousPosts)
    }
  }
} as const;
