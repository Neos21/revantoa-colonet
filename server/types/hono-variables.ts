export type HonoVariables = {
  /** `context.get('jwtPayload')` で取得できる内容を型定義しておく */
  jwtPayload: {
    /** ユーザ名 (`users.name`) */
    sub: string;
    /** 有効期限 (秒単位) */
    exp: number;
  };
};
