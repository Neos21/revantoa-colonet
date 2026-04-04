import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import ChangePassword from './components/change-password';
import RemoveAccount from './components/remove-account';
import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { pagePaths } from '../../shared/constants/page-paths';
import { setIndexMessage } from '../../shared/helpers/index-message';
import { userApi } from '../../shared/helpers/user-api';
import { useUserStore } from '../../shared/stores/user-store';

export default function Settings(): ReactNode {
  const navigate = useNavigate();
  
  const jwt = useUserStore(state => state.jwt);
  const name = useUserStore(state => state.name);
  const logout = useUserStore(state => state.logout);
  
  const [recoveryCode, setRecoveryCode] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      try {
        if(isEmpty(jwt)) {  // 未ログインユーザによるアクセスは封じる
          logout();
          return navigate(pagePaths.route);
        }
        await userApi.post(apiPaths.auth.checkToken.route).json();  // Throws
      }
      catch(error) {
        console.error('トークンチェックに失敗しました', error);
        logout();
        setIndexMessage('トークンチェックに失敗したためログアウトしました。再度ログインしてやり直してください');
        return navigate(pagePaths.route);
      }
      
      // ユーザ情報を取得する
      try {
        const result = await userApi.get(apiPaths.users.me.route).json<{ result: { recovery_code: string; }; }>();
        setRecoveryCode(result.result.recovery_code);
      }
      catch(error) {
        console.error('ユーザ情報の取得に失敗しました', error);
        logout();
        setIndexMessage('ユーザ情報の取得に失敗したためログアウトしました。再度ログインしてやり直してください');
        return navigate(pagePaths.route);
      }
    })();
  }, []);
  
  const onLogout = async (): Promise<void> => {
    logout();
    setIndexMessage('ログアウトしました');
    navigate(pagePaths.route);
  };
  
  return (
    <>
      <h1 className="text-2xl font-bold">ユーザ設定</h1>
      <div className="mt-6"><Link to={pagePaths.route} className="link">トップに戻る</Link></div>
      
      <h2 className="mt-6 text-xl font-bold">あなたの情報 (ユーザ ID : {name})</h2>
      <div className="mt-6"><b>リカバリコード</b> : {recoveryCode}</div>
      <ul className="pl-5 mt-6 list-disc text-base-content/80">
        <li>リカバリコードは、パスワードを忘れてしまった時に使用する緊急用パスワードです。ご自身で保管してください</li>
        <li>リカバリコードを使用してパスワードリセットすると、そのリカバリコードは無効となります。ログイン後にこの画面で新しいリカバリコードを確認できますので、保管するリカバリコードの更新をお忘れなく</li>
      </ul>
      <div className="mt-6"><Link to={pagePaths.settings.posts.route} className="link">過去の自分の投稿を確認する</Link></div>
      
      <ChangePassword />
      
      <RemoveAccount />
      
      <div className="text-right mt-14">
        <button type="button" className="btn btn-sm" onClick={onLogout}>ログアウトする</button>
      </div>
    </>
  );
}
