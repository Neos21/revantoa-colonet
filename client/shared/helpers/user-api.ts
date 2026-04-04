import ky from 'ky';

import { isEmpty } from '../../../shared/helpers/is-empty';
import { useUserStore } from '../stores/user-store';

/** JWT がストアにあればリクエストヘッダを付与する・ストアになかった場合もリクエスト自体は通る */
export const userApi = ky.extend({
  hooks: {
    beforeRequest: [(request): void => {
      const jwt = useUserStore.getState().jwt;
      if(!isEmpty(jwt)) request.headers.set('Authorization', `Bearer ${jwt}`);
    }]
    // `afterRequest` で 401 の場合にエラーを投げると呼び出し元にエラーオブジェクトが伝わらないのでやめる
  }
});
