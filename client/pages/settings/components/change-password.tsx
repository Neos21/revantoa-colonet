import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { apiPaths } from '../../../../shared/constants/api-paths';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { changePasswordSchema, currentPasswordDisplay, newPasswordDisplay, passwordMaxLength, passwordMinLength, type ChangePassword } from '../../../../shared/schemas/new-user';
import { pagePaths } from '../../../shared/constants/page-paths';
import { extractApiErrorMessage } from '../../../shared/helpers/extract-api-error-message';
import { setIndexMessage } from '../../../shared/helpers/index-message';
import { userApi } from '../../../shared/helpers/user-api';
import { useUserStore } from '../../../shared/stores/user-store';

export default function ChangePassword(): ReactNode {
  const navigate = useNavigate();
  
  const logout = useUserStore(state => state.logout);
  
  const [form, setForm] = useState<ChangePassword>({ current_password: '', new_password: '' });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    const parsed = changePasswordSchema.safeParse(form);
    if(!parsed.success) {
      setErrorMessage(mergeIssues(parsed.error));
      return setIsSubmitting(false);
    }
    
    try {
      await userApi.post(apiPaths.auth.changePassword.route, { json: parsed.data }).json();
      
      logout();
      setIndexMessage('パスワードを変更しました。再度ログインしてください');
      navigate(pagePaths.route);  // NOTE : ログイン画面に直接遷移させた方が良いか？その場合はメッセージ表示方法を考える
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, 'パスワード変更に失敗しました');
      setErrorMessage(errorMessage);
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <h2 className="mt-6 text-xl font-bold">パスワードを変更する</h2>
      <div className="mt-6 text-base-content/80">パスワードを変更するとログアウト状態になりますので、再度ログインしてください。</div>
      
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="mt-6 space-y-2">
          <label className="label">{currentPasswordDisplay}</label>
          <input type="password" className="w-full input" placeholder={currentPasswordDisplay} maxLength={passwordMaxLength} disabled={isSubmitting}
            value={form.current_password} onChange={event => setForm(prevForm => ({ ...prevForm, current_password: event.target.value }))} />
        </div>
        <div className="mt-6 space-y-2">
          <label className="label">{newPasswordDisplay} <span className="text-sm">({passwordMinLength}文字以上・{passwordMaxLength}文字以内・半角英数記号のみ)</span></label>
          <input type="password" className="w-full input" placeholder={newPasswordDisplay} maxLength={passwordMaxLength} disabled={isSubmitting}
            value={form.new_password} onChange={event => setForm(prevForm => ({ ...prevForm, new_password: event.target.value }))} />
        </div>
        
        <div className="mt-2 text-right">
          <button type="submit" className="btn btn-primary"
            disabled={isSubmitting || isEmpty(form.current_password) || isEmpty(form.new_password)}>パスワードを変更する</button>
        </div>
        
        {!isEmpty(errorMessage) && <div className="mt-2 text-error">{errorMessage}</div>}
      </form>
    </>
  );
}
