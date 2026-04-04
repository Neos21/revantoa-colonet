import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import ky from 'ky';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { forgotPasswordSchema, nameDisplay, nameMaxLength, newPasswordDisplay, passwordMaxLength, passwordMinLength, recoveryCodeDisplay, recoveryCodeMaxLength, type ForgotPassword } from '../../../shared/schemas/new-user';
import { pagePaths } from '../../shared/constants/page-paths';
import { turnstileSiteKey } from '../../shared/constants/turnstile';
import { extractApiErrorMessage } from '../../shared/helpers/extract-api-error-message';
import { setIndexMessage } from '../../shared/helpers/index-message';
import { useUserStore } from '../../shared/stores/user-store';

export default function ForgotPassword(): ReactNode {
  const navigate = useNavigate();
  
  const jwt = useUserStore(state => state.jwt);
  
  const [form, setForm] = useState<ForgotPassword>({ name: '', recovery_code: '', new_password: '' });
  
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
    
    const parsed = forgotPasswordSchema.safeParse(form);
    if(!parsed.success) {
      setErrorMessage(mergeIssues(parsed.error));
      return setIsSubmitting(false);
    }
    
    try {
      const requestBody = {
        name           : parsed.data.name,
        recovery_code  : parsed.data.recovery_code,
        new_password   : parsed.data.new_password,
        turnstile_token: turnstileToken
      };
      await ky.post(apiPaths.auth.resetPassword.route, { json: requestBody }).json();
      
      // メッセージを保存して遷移する
      setIndexMessage('パスワードをリセットしました。改めてログインしてください');
      navigate(pagePaths.route);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, 'パスワードリセットに失敗しました');
      setErrorMessage(errorMessage);
      
      setTurnstileToken('');
      turnstileRef.current?.reset();
      
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <h1 className="text-2xl font-bold">パスワードを忘れてしまった</h1>
      <div className="mt-6"><Link to={pagePaths.route} className="link">トップに戻る</Link></div>
      
      <div className="mt-6">リカバリコードと、再設定したいパスワードを入力してください。パスワードリセットに成功したら再度ログインしてください。</div>
      <div className="mt-6">パスワードをリセットすると、それまでのリカバリコードは無効となります。再ログイン後にユーザ設定ページで新しいリカバリコードを確認してください。</div>
      
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="mt-6 space-y-2">
          <label className="label">{nameDisplay}</label>
          <input type="text" className="w-full input" placeholder={nameDisplay} maxLength={nameMaxLength} disabled={isSubmitting}
            value={form.name} onChange={event => setForm(prevForm => ({ ...prevForm, name: event.target.value }))} />
        </div>
        <div className="mt-6 space-y-2">
          <label className="label">{recoveryCodeDisplay} <span className="text-sm">(半角数字とハイフンのみ・ハイフンはあってもなくても大丈夫)</span></label>
          <input type="text" className="w-full input" placeholder={recoveryCodeDisplay} maxLength={recoveryCodeMaxLength} disabled={isSubmitting}
            value={form.recovery_code} onChange={event => setForm(prevForm => ({ ...prevForm, recovery_code: event.target.value }))} />
        </div>
        <div className="mt-6 space-y-2">
          <label className="label">{newPasswordDisplay} <span className="text-sm">({passwordMinLength}文字以上・{passwordMaxLength}文字以内・半角英数記号のみ)</span></label>
          <input type="password" className="w-full input" placeholder={newPasswordDisplay} maxLength={passwordMaxLength} disabled={isSubmitting}
            value={form.new_password} onChange={event => setForm(prevForm => ({ ...prevForm, new_password: event.target.value }))} />
        </div>
        
        <div className="mt-6">
          <Turnstile siteKey={turnstileSiteKey} options={{ language: 'ja' }} ref={turnstileRef} onSuccess={setTurnstileToken} />
        </div>
        
        <div className="mt-2 text-right">
          <button type="submit" className="btn btn-primary"
            disabled={isSubmitting || isEmpty(turnstileToken) || isEmpty(form.name) || isEmpty(form.recovery_code) || isEmpty(form.new_password)}>パスワードをリセットする</button>
        </div>
        
        {!isEmpty(errorMessage) && <div className="mt-2 text-error">{errorMessage}</div>}
      </form>
    </>
  );
}
