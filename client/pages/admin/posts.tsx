import { Minus, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';

import { adminApi } from './helpers/admin-api';
import { apiPaths } from '../../../shared/constants/api-paths';
import { convertBooleanToNumber } from '../../../shared/helpers/convert-boolean-to-number';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { pagePaths } from '../../shared/constants/page-paths';
import { extractApiErrorMessage } from '../../shared/helpers/extract-api-error-message';

import type { PostForAdmin } from '../../../shared/types/post';

export default function AdminPosts(): ReactNode {
  const [posts, setPosts] = useState<Array<PostForAdmin> | null>(null);
  const [post, setPost] = useState<PostForAdmin | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      await adminApi.post(apiPaths.admin.checkToken.route).json();
      
      await fetchPosts();
    })();
  }, []);
  
  const fetchPosts = async (): Promise<void> => {
    try {
      const response = await adminApi.get(apiPaths.admin.posts.route).json<{ result: Array<PostForAdmin>; }>();
      setPosts(response.result);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '一覧の取得に失敗しました');
      setErrorMessage(errorMessage);
    }
  };
  
  const onRecountVotes = async (): Promise<void> => {
    setErrorMessage('');
    try {
      await adminApi.post(apiPaths.admin.posts.recountVotes.route).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '評価カウントの全再集計に失敗しました');
      return setErrorMessage(errorMessage);
    }
    setPost(null);
    await fetchPosts();
  };
  
  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    try {
      await adminApi.post(apiPaths.admin.posts.route, { json: post }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '更新に失敗しました');
      return setErrorMessage(errorMessage);
    }
    setPost(null);
    await fetchPosts();
  };
  
  return (
    <>
      <h1 className="text-lg font-bold">Admin Posts</h1>
      <div className="mt-6"><Link to={pagePaths.admin.dashboard.route} className="link-line">Dashboard</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.timelines.route} className="link-line">Timelines</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.users.route} className="link-line">Users</Link>&nbsp;|&nbsp;Posts&nbsp;|&nbsp;<Link to={pagePaths.admin.votes.route} className="link-line">Votes</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.denyIpAddresses.route} className="link-line">Deny IP Addresses</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.auditLogs.route} className="link-line">Audit Logs</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.counters.route} className="link-line">Counters</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.anonymousPosts.route} className="link-line">Anonymous Posts</Link></div>
      
      {!isEmpty(errorMessage) && <div className="mt-6 text-error">{errorMessage}</div>}
      
      <div className="mt-6 text-right"><button type="button" className="btn" onClick={onRecountVotes}>評価カウントの全再集計</button></div>
      
      {post != null && (
        <>
          <h2 className="mt-6 font-bold">Edit : ID [{post.id}]</h2>
          <form onSubmit={onSubmit} className="mt-2 space-y-2">
            <textarea rows={3} className="w-full textarea" placeholder="Content"
              value={post.content ?? ''} onChange={event => setPost(prevPost => ({ ...prevPost!, content: event.target.value }))} />
            <div>User ID : [{post.user_id}] {post.user_name}{convertNumberToBoolean(post.user_is_deleted) && <span className="ml-2 text-error">(削除済ユーザ)</span>}</div>
            <input type="text" className="w-full input" placeholder="IP Address"
              value={post.ip_address} onChange={event => setPost(prevPost => ({ ...prevPost!, ip_address: event.target.value }))} />
            <input type="text" className="w-full input" placeholder="User Agent"
              value={post.user_agent} onChange={event => setPost(prevPost => ({ ...prevPost!, user_agent: event.target.value }))} />
            <input type="text" className="w-full input" placeholder="Created At"
              value={post.created_at} onChange={event => setPost(prevPost => ({ ...prevPost!, created_at: event.target.value }))} />
            <div>Vote Count Up&nbsp;&nbsp; : <span className={`${post.vote_count_up > 0 ? 'text-emerald-600' : ''}`}>{post.vote_count_up}</span></div>
            <div>Vote Count Down : <span className={`${post.vote_count_down > 0 ? 'text-rose-600' : ''}`}>{post.vote_count_down}</span></div>
            <label className="label">
              <input type="checkbox" className="checkbox"
                checked={convertNumberToBoolean(post.is_deleted)} onChange={event => setPost(prevPost => ({ ...prevPost!, is_deleted: convertBooleanToNumber(event.target.checked) as typeof post.is_deleted }))} />
              Is Deleted
            </label>
            <textarea rows={3} className="w-full textarea" placeholder="Admin Memo"
              value={post.admin_memo ?? ''} onChange={event => setPost(prevPost => ({ ...prevPost!, admin_memo: event.target.value }))} />
            <div className="text-right"><button type="submit" className="btn btn-primary">Update</button></div>
          </form>
        </>
      )}
      
      {posts != null && posts.length === 0 && <div className="mt-6">No Posts</div>}
      {posts != null && posts.length > 0 && (
        <div className="mt-6 overflow-x-auto border rounded-box border-base-content bg-base-100">
          <table className="table table-sm [&_th,&_td]:border-base-content">
            <thead className="[&_th]:whitespace-nowrap [&_th]:text-base-content">
              <tr>
                <th>ID</th>
                <th>Content</th>
                <th>User ID</th>
                <th>IP Address</th>
                <th>User Agent</th>
                <th>Created At</th>
                <th>Votes</th>
                <th>Deleted</th>
                <th>Admin Memo</th>
              </tr>
            </thead>
            <tbody className="[&_td]:align-top">
              {posts.map(post => (
                <tr key={post.id} className={convertNumberToBoolean(post.is_deleted) ? 'bg-error/20' : ''}>
                  <td className={`min-w-[3rem]                                            `}><span className="block font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => setPost(post)}>{post.id}</span></td>
                  <td className={`min-w-[9rem] whitespace-pre-wrap                        `}>{post.content}</td>
                  <td className={`min-w-[5rem] ${post.user_is_deleted ? 'text-error' : ''}`}>{post.user_id}<br/>{post.user_name}</td>
                  <td className={`min-w-[8rem]                                            `}><a href={`https://whatismyipaddress.com/ip/${post.ip_address}`} target="_blank" rel="noreferrer noopener" className="link-line">{post.ip_address}</a></td>
                  <td className={`min-w-[8rem]                                            `}>{post.user_agent}</td>
                  <td className={`             whitespace-nowrap                          `}>{convertUtcToJst(post.created_at)}</td>
                  <td className={`             whitespace-nowrap                          `}><span className={`${post.vote_count_up > 0 ? 'text-emerald-600' : ''}`}>{post.vote_count_up}</span> / <span className={`${post.vote_count_down > 0 ? 'text-rose-600' : ''}`}>{post.vote_count_down}</span></td>
                  <td                                                                       >{convertNumberToBoolean(post.is_deleted) ? <X className="text-error" /> : <Minus className="text-base-content/50" />}</td>
                  <td className={`min-w-[8rem] whitespace-pre-wrap                        `}>{post.admin_memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
