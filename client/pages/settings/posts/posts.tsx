import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { apiPaths } from '../../../../shared/constants/api-paths';
import { convertUtcToJst } from '../../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { pagePaths } from '../../../shared/constants/page-paths';
import { setIndexMessage } from '../../../shared/helpers/index-message';
import { userApi } from '../../../shared/helpers/user-api';
import { useUserStore } from '../../../shared/stores/user-store';

import type { Post } from '../../../../shared/types/post';

export default function SettingsPosts(): ReactNode {
  const navigate = useNavigate();
  
  const jwt = useUserStore(state => state.jwt);
  const logout = useUserStore(state => state.logout);
  
  const [posts, setPosts] = useState<'LOADING' | Array<Post> | 'ERROR'>('LOADING');
  
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
      
      await fetchPosts();
    })();
  }, []);
  
  const fetchPosts = async (): Promise<void> => {
    setPosts('LOADING');
    try {
      const response = await userApi.get(apiPaths.users.me.posts.route).json<{ result: Array<Post>; }>();
      setPosts(response.result);
    }
    catch(error) {
      console.error('投稿一覧の読み込みに失敗しました', error);
      setPosts('ERROR');
    }
  };
  
  const onRemovePost = async (id: number): Promise<void> => {
    try {
      await userApi.delete(apiPaths.posts.byId.buildRoute(id)).json();
    }
    catch(error) {
      console.error('投稿の削除に失敗しました', error);
    }
    finally {
      await fetchPosts();
    }
  };
  
  return (
    <>
      <h1 className="text-2xl font-bold">自分の投稿</h1>
      <div className="mt-6"><Link to={pagePaths.settings.route} className="link">ユーザ設定に戻る</Link></div>
      
      {posts === 'LOADING'                      && <div className="text-center mt-14 fade-first-view more-animation-delay text-base-content/70">読み込み中……</div>}
      {posts === 'ERROR'                        && <div className="text-center mt-14 text-error">投稿一覧の読み込みに失敗しました。ページを再読み込みしてみてください</div>}
      {posts !== 'LOADING' && posts !== 'ERROR' && (
        <>
          {posts.length === 0 && <div className="text-center">投稿はありません</div>}
          
          {posts.length > 0 && posts.map(post => (
            <div key={post.id} className="px-3 py-4 mt-12 border rounded shadow-sm border-base-content/10 bg-base-100 dark:bg-base-200">
              <div className="text-xs text-base-content/50">{convertUtcToJst(post.created_at)}</div>
              <div className="mt-1 whitespace-pre-wrap">{post.content}</div>
              <div className="mt-2 text-right"><button type="button" className="btn btn-sm" onClick={() => onRemovePost(post.id)}>削除する</button></div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
