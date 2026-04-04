/** 配列で渡されたセグメントを結合して `/` 始まりのルート相対パスを組み立てる */
export const joinPath = (...parts: Array<string>): string => {
  const cleanedPath = parts
    .filter(Boolean)  // Falsy な値が渡された場合も除外する
    .join('/')
    .replace((/\/{2,}/g), '/');  // 万が一スラッシュが2つ以上重なった場合は1つに統一する
  return cleanedPath.startsWith('/') ? cleanedPath : `/${cleanedPath}`;  // 必ず `/` 始まりにする
};

/** API パスに使用するセグメント (`/` を付与しないで宣言する) */
const apiSegments = {
  api: 'api',
  
  pv: 'pv',
  
  auth: 'auth',
  signup: 'signup',
  login: 'login',
  checkToken: 'check-token',
  changePassword: 'change-password',
  resetPassword: 'reset-password',
  account: 'account',
  
  posts: 'posts',
  post: ':id',
  votes: 'votes',
  
  anonymousPosts: 'anonymous-posts',
  
  users: 'users',
  usersMe: 'me',
  usersMePosts: 'posts',
  
  admin: 'admin',
  adminLogin: 'login',
  adminCheckToken: 'check-token',
  adminUsers: 'users',
  adminUser: ':id',
  adminPosts: 'posts',
  adminPost: ':id',
  adminPostRecountVotes: 'recount-votes',
  adminVotes: 'votes',
  adminVote: ':id',
  adminDenyIpAddresses: 'deny-ip-addresses',
  adminAuditLogs: 'audit-logs',
  adminTimelines: 'timelines',
  adminCounters: 'counters',
  adminAnonymousPosts: 'anonymous-posts',
  adminAnonymousPost: ':id'
} as const;

/** API パス定義 */
export const apiPaths = {
  subPath: joinPath(apiSegments.api),
  
  /** PV カウンタ */
  pv: {
    route  : joinPath(apiSegments.api, apiSegments.pv),
    subPath: joinPath(                 apiSegments.pv),
    
    index: {
      subPath: joinPath()
    }
  },
  
  /** ユーザ認証 */
  auth: {
    route  : joinPath(apiSegments.api, apiSegments.auth),
    subPath: joinPath(                 apiSegments.auth),
    
    /** ユーザ登録 */
    signup: {
      route  : joinPath(apiSegments.api, apiSegments.auth, apiSegments.signup),
      subPath: joinPath(                                   apiSegments.signup),
      
      index: {
        subPath: joinPath()
      }
    },
    /** ログイン */
    login: {
      route  : joinPath(apiSegments.api, apiSegments.auth, apiSegments.login),
      subPath: joinPath(                                   apiSegments.login),
      
      index: {
        subPath: joinPath()
      }
    },
    /** トークンチェック */
    checkToken: {
      route  : joinPath(apiSegments.api, apiSegments.auth, apiSegments.checkToken),
      subPath: joinPath(                                   apiSegments.checkToken)
    },
    /** パスワード変更 */
    changePassword: {
      route  : joinPath(apiSegments.api, apiSegments.auth, apiSegments.changePassword),
      subPath: joinPath(                                   apiSegments.changePassword),
      
      index: {
        subPath: joinPath()
      }
    },
    /** パスワードリセット */
    resetPassword: {
      route  : joinPath(apiSegments.api, apiSegments.auth, apiSegments.resetPassword),
      subPath: joinPath(                                   apiSegments.resetPassword),
      
      index: {
        subPath: joinPath()
      }
    },
    /** アカウント削除 */
    account: {
      route  : joinPath(apiSegments.api, apiSegments.auth, apiSegments.account),
      subPath: joinPath(                                   apiSegments.account),
      
      index: {
        subPath: joinPath()
      }
    }
  },
  
  /** 投稿 */
  posts: {
    // App で使用する定義
    route  : joinPath(apiSegments.api, apiSegments.posts),  // `route`   : クライアントからの API コール時に使用する `/api/posts` となる文字列
    subPath: joinPath(                 apiSegments.posts),  // `subPath` : Hono バックエンド定義時に使用する `/posts` となる文字列
    
    /** Posts API で使用する定義 : `route` は `posts.route` と一致するので書かない */
    index: {
      subPath: joinPath()  // `/` となる
    },
    
    /** 投稿1件を指定して削除する (ユーザ設定にて使用する) */
    byId: {
      buildRoute: (id: number | string) => joinPath(apiSegments.api, apiSegments.posts, String(id)),  // `buildRoute` : クライアントからの API コール時に ID を付与してパスを組み立てる
      subPath: joinPath(apiSegments.post)
    },
    
    /** 評価 */
    votes: {
      route  : joinPath(apiSegments.api, apiSegments.posts, apiSegments.votes),
      subPath: joinPath(                                    apiSegments.votes),
      
      /** Votes API で使用する定義 */
      index: {
        subPath: joinPath()
      }
    }
  },
  
  /** 匿名投稿 */
  anonymousPosts: {
    route  : joinPath(apiSegments.api, apiSegments.anonymousPosts),
    subPath: joinPath(                 apiSegments.anonymousPosts),
    
    index: {
      subPath: joinPath()
    }
  },
  
  /** ユーザ設定 */
  users: {
    route  : joinPath(apiSegments.api, apiSegments.users),
    subPath: joinPath(                 apiSegments.users),
    
    me: {
      route: joinPath(apiSegments.api, apiSegments.users, apiSegments.usersMe),
      
      /** ユーザ情報を取得する */
      index: {
        subPath: joinPath(apiSegments.usersMe),
      },
      
      /** ユーザの投稿一覧を取得する */
      posts: {
        route  : joinPath(apiSegments.api, apiSegments.users, apiSegments.usersMe, apiSegments.usersMePosts),
        subPath: joinPath(                                    apiSegments.usersMe, apiSegments.usersMePosts)
      }
    }
  },
  
  /** 管理用 */
  admin: {
    route  : joinPath(apiSegments.api, apiSegments.admin),
    subPath: joinPath(                 apiSegments.admin),
    
    /** 管理ログイン */
    login: {
      route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminLogin),
      subPath: joinPath(                                    apiSegments.adminLogin),
      
      index: {
        subPath: joinPath()
      }
    },
    /** 管理者トークンチェック */
    checkToken: {
      route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminCheckToken),
      subPath: joinPath(                                    apiSegments.adminCheckToken)
    },
    
    /** ユーザ管理 */
    users: {
      route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminUsers),
      subPath: joinPath(                                    apiSegments.adminUsers),
      
      index: {
        subPath: joinPath()
      },
      byId: {
        subPath: joinPath(apiSegments.adminUser)
      }
    },
    
    /** 投稿管理 */
    posts: {
      route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminPosts),
      subPath: joinPath(                                    apiSegments.adminPosts),
      
      index: {
        subPath: joinPath()
      },
      byId: {
        subPath: joinPath(apiSegments.adminPost)
      },
      recountVotes: {
        route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminPosts, apiSegments.adminPostRecountVotes),
        subPath: joinPath(                                                            apiSegments.adminPostRecountVotes)
      }
    },
    
    /** 評価管理 */
    votes: {
      route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminVotes),
      subPath: joinPath(                                    apiSegments.adminVotes),
      
      index: {
        subPath: joinPath()
      },
      byId: {
        subPath: joinPath(apiSegments.adminVote)
      }
    },
    
    /** 拒否する IP アドレス管理 */
    denyIpAddresses: {
      route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminDenyIpAddresses),
      subPath: joinPath(                                    apiSegments.adminDenyIpAddresses),
      
      index: {
        subPath: joinPath()
      }
    },
    
    /** 監査ログ管理 */
    auditLogs: {
      route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminAuditLogs),
      subPath: joinPath(                                    apiSegments.adminAuditLogs),
      
      index: {
        subPath: joinPath()
      }
    },
    
    /** タイムライン管理 */
    timelines: {
      route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminTimelines),
      subPath: joinPath(                                    apiSegments.adminTimelines),
      
      index: {
        subPath: joinPath()
      }
    },
    
    /** PV カウンタ管理 */
    counters: {
      route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminCounters),
      subPath: joinPath(                                    apiSegments.adminCounters),
      
      index: {
        subPath: joinPath()
      }
    },
    
    /** 匿名投稿管理 */
    anonymousPosts: {
      route  : joinPath(apiSegments.api, apiSegments.admin, apiSegments.adminAnonymousPosts),
      subPath: joinPath(                                    apiSegments.adminAnonymousPosts),
      
      index: {
        subPath: joinPath()
      },
      byId: {
        subPath: joinPath(apiSegments.adminAnonymousPost)
      }
    }
  }
} as const;
