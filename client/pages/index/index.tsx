import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';

import PostForm from './components/post-form';
import Timeline from './components/timeline';
import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { pagePaths } from '../../shared/constants/page-paths';
import { getIndexMessage, getIsFirstLogin } from '../../shared/helpers/index-message';
import { isUnauthorizedError } from '../../shared/helpers/is-unauthorized-error';
import { userApi } from '../../shared/helpers/user-api';
import { useUserStore } from '../../shared/stores/user-store';

import type { Post } from '../../../shared/types/post';

export default function Index(): ReactNode {
  const jwt = useUserStore(state => state.jwt);
  const logout = useUserStore(state => state.logout);
  
  const isLoggedIn = useMemo(() => !isEmpty(jwt), [jwt]);
  
  const [indexMessage, setIndexMessage] = useState<string | null>(getIndexMessage());
  const [isFirstLogin] = useState<boolean>(getIsFirstLogin());
  
  const [posts, setPosts] = useState<'LOADING' | Array<Post> | 'ERROR'>('LOADING');
  
  useEffect(() => {
    (async () => {
      try {
        if(isLoggedIn) await userApi.post(apiPaths.auth.checkToken.route).json();  // Throws
      }
      catch(error) {
        logout();
        if(isUnauthorizedError(error)) {
          console.error('トークンの有効期限が切れています', error);
          setIndexMessage('トークンの有効期限が切れています。再度ログインしてください');
        }
        else {
          console.error('トークンチェックに失敗しました', error);
          setIndexMessage('トークンチェックに失敗しました。再度ログインしてください');
        }
      }
      finally {
        await fetchPosts();  // 必ず最後に読み込みを行う : ログインしていない場合はココだけ動いて終わり
      }
    })();
  }, []);
  
  const fetchPosts = async (): Promise<void> => {
    setPosts('LOADING');
    try {
      const response = await userApi.get(apiPaths.posts.route).json<{ result: Array<Post>; }>();  // `userApi` は JWT がなくてもリクエストは投げるので常にコレを使って良い
      setPosts(response.result);
    }
    catch(error) {
      console.error('タイムラインの読み込みに失敗しました', error);
      setPosts('ERROR');
    }
  };
  
  const onSubmittedPost = async (): Promise<void> => {
    setIndexMessage('投稿しました');
    await fetchPosts();
    setTimeout(() => setIndexMessage(null), 5000);
  };
  
  const onLogout = async (): Promise<void> => {
    logout();
    setIndexMessage('ログアウトしました');
    await fetchPosts();
    setTimeout(() => setIndexMessage(null), 5000);
  };
  
  return (
    <>
      <h1 className="mt-6 text-4xl font-bold text-center text-base-content/80">ころねっと</h1>
      <div className="mt-6 text-center text-base-content/70">主張しない、争わない、静かな SNS。</div>
      {!isLoggedIn && (
        <>
          <div className="mx-1 mt-14 text-base-content/70">ここでは、静かな言葉がゆっくり流れています。<br />読むだけなら、登録は必要ありません。</div>
          <div className="mx-1 mt-4 text-base-content/70">もし、ひとこと置いてみたくなったら<br /><Link to={pagePaths.login.route} className="link">ログイン</Link>して、匿名で書き込めます。</div>
          <div className="mx-1 mt-4 text-base-content/70">ユーザ登録が手間な人のために、<Link to={pagePaths.anonymous.route} className="link">ユーザ登録なしで書き込めるタイムライン</Link>もご用意しました。</div>
        </>
      )}
      
      {isLoggedIn && isFirstLogin && (
        <div className="mx-1 mt-14">
          はじめまして。ログインできてよかったです。<br />ころねっとについて、知っておくと安心なことを少しだけ。
          <ul className="pl-5 my-6 list-disc">
            <li>ここでは、誰が書いたかは分からないようになっています</li>
            <li>投稿への評価は、言葉の居心地を整えるために使われます<br />誰が評価したかは、誰にも分かりません</li>
            <li>タイムラインは、静かさを保つ順番で並びます</li>
          </ul>
          眺めるだけでも大丈夫です。
        </div>
      )}
      
      {isLoggedIn && <PostForm onSubmitted={onSubmittedPost} />}
      
      {!isEmpty(indexMessage) && <div className="mx-1 mt-14 text-success">{indexMessage}</div>}
      
      {posts === 'LOADING'                      && <div className="text-center mt-14 fade-first-view more-animation-delay text-base-content/70">読み込み中……</div>}
      {posts === 'ERROR'                        && <div className="text-center mt-14 text-error">タイムラインの読み込みに失敗しました。ページを再読み込みしてみてください</div>}
      {posts !== 'LOADING' && posts !== 'ERROR' && <div className="mt-14 fade-first-view animation-delay"><Timeline posts={posts} isLoggedIn={isLoggedIn} clearIndexMessage={() => setIndexMessage(null)} /></div>}
      
      {!isLoggedIn && (
        <div className="text-center mt-14">
          <Link to={pagePaths.login.route} className="link" title="ログイン">参加する</Link> | <Link to={pagePaths.signup.route} className="link" title="ユーザ登録">はじめての方はこちら</Link> | <Link to={pagePaths.anonymous.route} className="link" title="匿名版">ユーザ登録せず書き込む</Link>
        </div>
      )}
      {isLoggedIn && (
        <div className="text-right mt-14">
          <Link to={pagePaths.anonymous.route} className="link">ユーザ登録なしで書き込めるタイムラインに行く</Link> | <Link to={pagePaths.settings.route} className="link">ユーザ設定</Link> | <button type="button" className="btn btn-sm" onClick={onLogout}>ログアウトする</button>
        </div>
      )}
    </>
  );
}
