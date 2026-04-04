import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { apiPaths } from '../../../../shared/constants/api-paths';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { pagePaths } from '../../../shared/constants/page-paths';
import { extractApiErrorMessage } from '../../../shared/helpers/extract-api-error-message';
import { setIndexMessage } from '../../../shared/helpers/index-message';
import { userApi } from '../../../shared/helpers/user-api';
import { useUserStore } from '../../../shared/stores/user-store';

export default function RemoveAccount(): ReactNode {
  const navigate = useNavigate();
  
  const logout = useUserStore(state => state.logout);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const onRemoveAccount = async (): Promise<void> => {
    const isConfirmed = window.confirm('本当にアカウントを削除しますか？');
    if(!isConfirmed) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      await userApi.delete(apiPaths.auth.account.route).json();
      
      logout();
      setIndexMessage('アカウント削除が完了しました。よかったらまた来てください。お待ちしております');
      navigate(pagePaths.route);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, 'アカウント削除処理に失敗しました。もう一度やり直してください');
      setErrorMessage(errorMessage);
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <h2 className="mt-6 text-xl font-bold">アカウントを削除する</h2>
      <div className="mt-6 text-base-content/80">アカウントを削除する場合は、以下のボタンを押してください。確認ダイアログが表示されます。同じユーザ ID でアカウントを再作成することはできませんのでご注意ください。</div>
      
      <div className="mt-6 text-right">
        <button type="submit" className="btn btn-error text-white" onClick={onRemoveAccount} disabled={isSubmitting}>アカウントを削除する</button>
      </div>
      
      {!isEmpty(errorMessage) && <div className="mt-2 text-error">{errorMessage}</div>}
    </>
  );
}
