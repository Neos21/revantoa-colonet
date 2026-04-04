import ky from 'ky';

import { getJwt, removeJwt, setUnauthorizedMessage } from './auth';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { pagePaths } from '../../../shared/constants/page-paths';

export const adminApi = ky.extend({
  hooks: {
    beforeRequest: [(request): void => {
      const jwt = getJwt();
      if(isEmpty(jwt)) {  // トークンがない状態で本 API をコールした場合は管理ログイン画面に遷移する
        removeJwt();
        setUnauthorizedMessage();
        window.location.href = pagePaths.admin.route;
        return;
      }
      request.headers.set('Authorization', `Bearer ${jwt}`);
    }],
    afterResponse: [(_request, _options, response): void => {
      if(response.status === 401) {
        removeJwt();
        setUnauthorizedMessage();
        window.location.href = pagePaths.admin.route;
        return;
      }
    }]
  }
});
