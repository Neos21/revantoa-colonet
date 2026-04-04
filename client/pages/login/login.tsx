import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import ky from 'ky';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { nameDisplay, nameMaxLength, newUserSchema, passwordDisplay, passwordMaxLength, type NewUser } from '../../../shared/schemas/new-user';
import { pagePaths } from '../../shared/constants/page-paths';
import { turnstileSiteKey } from '../../shared/constants/turnstile';
import { extractApiErrorMessage } from '../../shared/helpers/extract-api-error-message';
import { setIndexMessage, setIsFirstLogin } from '../../shared/helpers/index-message';
import { useUserStore } from '../../shared/stores/user-store';

import type { LoginResult } from '../../../shared/types/login-result';

export default function Login(): ReactNode {
  const navigate = useNavigate();
  
  const jwt = useUserStore(state => state.jwt);
  const setAuth = useUserStore(state => state.setAuth);
  
  const [form, setForm] = useState<NewUser>({ name: '', password: '' });
  
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    if(!isEmpty(jwt)) navigate(pagePaths.route);  // ログイン済みならトップページに遷移する
  }, []);
  
  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    const parsed = newUserSchema.safeParse(form);
    if(!parsed.success) {
      setErrorMessage(mergeIssues(parsed.error));
      return setIsSubmitting(false);
    }
    
    try {
      const requestBody = {
        name           : parsed.data.name,
        password       : parsed.data.password,
        turnstile_token: turnstileToken
      };
      const response = await ky.post(apiPaths.auth.login.route, { json: requestBody }).json<{ result: LoginResult; }>();
      
      setAuth(response.result.jwt, response.result.name);  // トークンを記録する
      // メッセージを保存して遷移する
      setIndexMessage('ログインに成功しました');
      setIsFirstLogin(response.result.is_first_login);
      navigate(pagePaths.route);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, 'ログインに失敗しました');
      setErrorMessage(errorMessage);
      
      setTurnstileToken('');
      turnstileRef.current?.reset();
      
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <h1 className="text-2xl font-bold">ログイン</h1>
      <div className="mt-6"><Link to={pagePaths.route} className="link">トップに戻る</Link></div>
      
      <div className="mt-6">ユーザ登録がまだの方は、先に<Link to={pagePaths.signup.route} className="link">ユーザ登録</Link>をしてください。</div>
      <div className="mt-6"><Link to={pagePaths.forgotPassword.route} className="link">パスワードを忘れてしまった</Link>場合はコチラからパスワードリセットができます。</div>
      
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="mt-6 space-y-2">
          <label className="label">{nameDisplay}</label>
          <input type="text" className="w-full input" placeholder={nameDisplay} maxLength={nameMaxLength} disabled={isSubmitting}
            value={form.name} onChange={event => setForm(prevForm => ({ ...prevForm, name: event.target.value }))} />
        </div>
        <div className="mt-6 space-y-2">
          <label className="label">{passwordDisplay}</label>
          <input type="password" className="w-full input" placeholder={passwordDisplay} maxLength={passwordMaxLength} disabled={isSubmitting}
            value={form.password} onChange={event => setForm(prevForm => ({ ...prevForm, password: event.target.value }))} />
        </div>
        
        <div className="mt-6">
          <Turnstile siteKey={turnstileSiteKey} options={{ language: 'ja' }} ref={turnstileRef} onSuccess={setTurnstileToken} />
        </div>
        
        <div className="mt-2 text-right">
          <button type="submit" className="btn btn-primary"
            disabled={isSubmitting || isEmpty(turnstileToken) || isEmpty(form.name) || isEmpty(form.password)}>ログインする</button>
        </div>
        
        {!isEmpty(errorMessage) && <div className="mt-2 text-error">{errorMessage}</div>}
      </form>
    </>
  );
}
