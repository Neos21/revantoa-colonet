import ky from 'ky';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';

import AnonymousPostForm from './components/anonymous-post-form';
import AnonymousTimeline from './components/anonymous-timeline';
import { apiPaths } from '../../../shared/constants/api-paths';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { pagePaths } from '../../shared/constants/page-paths';

import type { AnonymousPost } from '../../../shared/types/anonymous-post';

export default function Anonymous(): ReactNode {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [anonymousPosts, setAnonymousPosts] = useState<'LOADING' | Array<AnonymousPost> | 'ERROR'>('LOADING');
  
  useEffect(() => {
    fetchAnonymousPosts();
  }, []);
  
  const fetchAnonymousPosts = async (): Promise<void> => {
    setAnonymousPosts('LOADING');
    try {
      const response = await ky.get(apiPaths.anonymousPosts.route).json<{ result: Array<AnonymousPost>; }>();
      setAnonymousPosts(response.result);
    }
    catch(error) {
      console.error('タイムラインの読み込みに失敗しました', error);
      setAnonymousPosts('ERROR');
    }
  };
  
  const onSubmittedPost = async (): Promise<void> => {
    setSuccessMessage('投稿しました');
    await fetchAnonymousPosts();
    setTimeout(() => setSuccessMessage(null), 5000);
  };
  
  return (
    <>
      <h1 className="mt-6 text-4xl font-bold text-center text-base-content/80">ころねっと</h1>
      <div className="mt-6 text-center text-base-content/70">主張しない、争わない、静かな SNS。</div>
      
      <div className="mx-1 mt-14 text-base-content/70">こちらは登録しなくても書き込める、完全匿名版のタイムラインです。</div>
      <div className="mx-1 mt-3 text-base-content/70">投稿した内容は自分で削除ができませんのでご注意ください。</div>
      <div className="mx-1 mt-3 text-base-content/70">眺めるだけでも大丈夫です。</div>
      
      <AnonymousPostForm onSubmitted={onSubmittedPost} />
      
      {!isEmpty(successMessage) && <div className="mx-1 mt-14 text-success">{successMessage}</div>}
      
      {anonymousPosts === 'LOADING'                               && <div className="text-center mt-14 fade-first-view more-animation-delay text-base-content/70">読み込み中……</div>}
      {anonymousPosts === 'ERROR'                                 && <div className="text-center mt-14 text-error">タイムラインの読み込みに失敗しました。ページを再読み込みしてみてください</div>}
      {anonymousPosts !== 'LOADING' && anonymousPosts !== 'ERROR' && <div className="mt-14 fade-first-view animation-delay"><AnonymousTimeline anonymousPosts={anonymousPosts} /></div>}
      
      <div className="text-right mt-14">
        <Link to={pagePaths.route} className="link">通常タイムラインに戻る</Link>
      </div>
    </>
  );
}
