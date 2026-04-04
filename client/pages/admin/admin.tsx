import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import ky from 'ky';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { adminApi } from './helpers/admin-api';
import { getUnauthorizedMessage, isAuthenticated, saveJwt } from './helpers/auth';
import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { pagePaths } from '../../shared/constants/page-paths';
import { turnstileSiteKey } from '../../shared/constants/turnstile';
import { extractApiErrorMessage } from '../../shared/helpers/extract-api-error-message';

import type { AdminLoginResult } from '../../../shared/types/admin-login-result';

export default function Admin(): ReactNode {
  const navigate = useNavigate();
  
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // 既にトークンを発行してあり、期限切れでなければダッシュボードにリダイレクトする
  useEffect(() => {
    (async () => {
      // 認証エラーによるメッセージがあれば表示してこの画面を表示する
      const message = getUnauthorizedMessage();
      if(!isEmpty(message)) return setErrorMessage(message!);
      
      // トークンがローカルになければログアウト状態として、以下の有効期限チェックを行わずにこの画面を表示する
      if(!isAuthenticated()) return;
      
      // トークンがあれば有効期限チェックを行いダッシュボードに遷移する・NG の場合は `adminApi` の `afterResponse` 処理でリダイレクトと同時にメッセージ挿入がかかる
      await adminApi.post(apiPaths.admin.checkToken.route).json();
      navigate(pagePaths.admin.dashboard.route);
    })();
  }, []);
  
  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const response = await ky.post(apiPaths.admin.login.route, { json: { password, turnstile_token: turnstileToken } }).json<{ result: AdminLoginResult; }>();
      saveJwt(response.result.admin_jwt);
      navigate(pagePaths.admin.dashboard.route);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '認証に失敗しました');
      setErrorMessage(errorMessage);
      
      setTurnstileToken('');
      turnstileRef.current?.reset();
      
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <h1 className="text-lg font-bold">Admin</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-2">
        <input type="password" className="w-full input" placeholder="Password"
          value={password} onChange={event => setPassword(event.target.value)} />
        <div className="mt-6">
          <Turnstile siteKey={turnstileSiteKey} options={{ language: 'ja' }} ref={turnstileRef} onSuccess={setTurnstileToken} />
        </div>
        <div className="mt-2 text-right">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || isEmpty(turnstileToken) || isEmpty(password)}>Login</button>
        </div>
      </form>
      {!isEmpty(errorMessage) && <div className="mt-6 text-sm text-error">{errorMessage}</div>}
      <div className="mt-6 text-right"><Link to={pagePaths.route} className="link-line">Go To Index</Link></div>
    </>
  );
}
