import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import ky from 'ky';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { nameDisplay, nameMaxLength, nameMinLength, newUserSchema, passwordDisplay, passwordMaxLength, passwordMinLength, type NewUser } from '../../../shared/schemas/new-user';
import { pagePaths } from '../../shared/constants/page-paths';
import { turnstileSiteKey } from '../../shared/constants/turnstile';
import { extractApiErrorMessage } from '../../shared/helpers/extract-api-error-message';
import { useUserStore } from '../../shared/stores/user-store';

export default function Signup(): ReactNode {
  const navigate = useNavigate();
  
  const jwt = useUserStore(state => state.jwt);
  
  const [form, setForm] = useState<NewUser>({ name: '', password: '' });
  
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSucceeded, setIsSucceeded] = useState<boolean>(false);
  
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
      await ky.post(apiPaths.auth.signup.route, { json: requestBody }).json();
      
      setForm(prevForm => ({ ...prevForm, password: '' }));  // パスワードだけ何となくリセットしておく
      setIsSucceeded(true);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, 'ユーザ登録に失敗しました');
      setErrorMessage(errorMessage);
      
      // 一度認証した Turnstile で再度 Submit するとエラーになるため必ずリセットする
      setTurnstileToken('');
      turnstileRef.current?.reset();
      
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <h1 className="text-2xl font-bold">ユーザ登録</h1>
      <div className="mt-6"><Link to={pagePaths.route} className="link">トップに戻る</Link></div>
      
      <div className="mt-6">既にユーザ登録済の方は、コチラより<Link to={pagePaths.login.route} className="link">ログイン</Link>してください。</div>
      
      <ul className="pl-5 mt-6 list-disc">
        <li>ユーザ登録することで、投稿、および他の人の投稿に対する評価を行えるようになります</li>
        <li>ユーザ名はログインにのみ使用され、タイムラインには一切表示されません</li>
      </ul>
      
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="mt-6 space-y-2">
          <label className="label">{nameDisplay} <span className="text-sm">({nameMinLength}文字以上・{nameMaxLength}文字以内・半角英小文字・数字・アンダースコア・ハイフンのみ)</span></label>
          <input type="text" className="w-full input" placeholder={nameDisplay} maxLength={nameMaxLength} disabled={isSubmitting}
            value={form.name} onChange={event => setForm(prevForm => ({ ...prevForm, name: event.target.value }))} />
        </div>
        <div className="mt-6 space-y-2">
          <label className="label">{passwordDisplay} <span className="text-sm">({passwordMinLength}文字以上・{passwordMaxLength}文字以内・半角英数記号のみ)</span></label>
          <input type="password" className="w-full input" placeholder={passwordDisplay} maxLength={passwordMaxLength} disabled={isSubmitting}
            value={form.password} onChange={event => setForm(prevForm => ({ ...prevForm, password: event.target.value }))} />
        </div>
        
        <div className="mt-6">
          <Turnstile siteKey={turnstileSiteKey} options={{ language: 'ja' }} ref={turnstileRef} onSuccess={setTurnstileToken} />
        </div>
        
        <div className="mt-2 text-right">
          <button type="submit" className="btn btn-primary"
            disabled={isSucceeded || isSubmitting || isEmpty(turnstileToken) || isEmpty(form.name) || isEmpty(form.password)}>登録する</button>
        </div>
        
        {!isEmpty(errorMessage) && <div className="mt-2 text-error">{errorMessage}</div>}
      </form>
      
      {isSucceeded && (
        <div className="mt-6 text-success">ユーザ登録が完了しました。<Link to={pagePaths.login.route} className="link">ログイン</Link>してご利用ください。</div>
      )}
    </>
  );
}
