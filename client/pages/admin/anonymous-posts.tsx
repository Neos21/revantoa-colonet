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

import type { AnonymousPostForAdmin } from '../../../shared/types/anonymous-post';

export default function AdminAnonymousPosts(): ReactNode {
  const [anonymousPosts, setAnonymousPosts] = useState<Array<AnonymousPostForAdmin> | null>(null);
  const [anonymousPost, setAnonymousPost] = useState<AnonymousPostForAdmin | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      await adminApi.post(apiPaths.admin.checkToken.route).json();
      
      await fetchAnonymousPosts();
    })();
  }, []);
  
  const fetchAnonymousPosts = async (): Promise<void> => {
    try {
      const response = await adminApi.get(apiPaths.admin.anonymousPosts.route).json<{ result: Array<AnonymousPostForAdmin>; }>();
      setAnonymousPosts(response.result);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '一覧の取得に失敗しました');
      setErrorMessage(errorMessage);
    }
  };
  
  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    try {
      await adminApi.post(apiPaths.admin.anonymousPosts.route, { json: anonymousPost }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '更新に失敗しました');
      return setErrorMessage(errorMessage);
    }
    setAnonymousPost(null);
    await fetchAnonymousPosts();
  };
  
  return (
    <>
      <h1 className="text-lg font-bold">Admin Anonymous Posts</h1>
      <div className="mt-6"><Link to={pagePaths.admin.dashboard.route} className="link-line">Dashboard</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.timelines.route} className="link-line">Timelines</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.users.route} className="link-line">Users</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.posts.route} className="link-line">Posts</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.votes.route} className="link-line">Votes</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.denyIpAddresses.route} className="link-line">Deny IP Addresses</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.auditLogs.route} className="link-line">Audit Logs</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.counters.route} className="link-line">Counters</Link>&nbsp;|&nbsp;Anonymous Posts</div>
      
      {!isEmpty(errorMessage) && <div className="mt-6 text-error">{errorMessage}</div>}
      
      {anonymousPost != null && (
        <>
          <h2 className="mt-6 font-bold">Edit : ID [{anonymousPost.id}]</h2>
          <form onSubmit={onSubmit} className="mt-2 space-y-2">
            <textarea rows={3} className="w-full textarea" placeholder="Content"
              value={anonymousPost.content ?? ''} onChange={event => setAnonymousPost(prevAnonymousPost => ({ ...prevAnonymousPost!, content: event.target.value }))} />
            <input type="text" className="w-full input" placeholder="IP Address"
              value={anonymousPost.ip_address} onChange={event => setAnonymousPost(prevAnonymousPost => ({ ...prevAnonymousPost!, ip_address: event.target.value }))} />
            <input type="text" className="w-full input" placeholder="User Agent"
              value={anonymousPost.user_agent} onChange={event => setAnonymousPost(prevAnonymousPost => ({ ...prevAnonymousPost!, user_agent: event.target.value }))} />
            <input type="text" className="w-full input" placeholder="Created At"
              value={anonymousPost.created_at} onChange={event => setAnonymousPost(prevAnonymousPost => ({ ...prevAnonymousPost!, created_at: event.target.value }))} />
            <label className="label">
              <input type="checkbox" className="checkbox"
                checked={convertNumberToBoolean(anonymousPost.is_deleted)} onChange={event => setAnonymousPost(prevAnonymousPost => ({ ...prevAnonymousPost!, is_deleted: convertBooleanToNumber(event.target.checked) as typeof anonymousPost.is_deleted }))} />
              Is Deleted
            </label>
            <textarea rows={3} className="w-full textarea" placeholder="Admin Memo"
              value={anonymousPost.admin_memo ?? ''} onChange={event => setAnonymousPost(prevAnonymousPost => ({ ...prevAnonymousPost!, admin_memo: event.target.value }))} />
            <div className="text-right"><button type="submit" className="btn btn-primary">Update</button></div>
          </form>
        </>
      )}
      
      {anonymousPosts != null && anonymousPosts.length === 0 && <div className="mt-6">No Anonymous Posts</div>}
      {anonymousPosts != null && anonymousPosts.length > 0 && (
        <div className="mt-6 overflow-x-auto border rounded-box border-base-content bg-base-100">
          <table className="table table-sm [&_th,&_td]:border-base-content">
            <thead className="[&_th]:whitespace-nowrap [&_th]:text-base-content">
              <tr>
                <th>ID</th>
                <th>Content</th>
                <th>IP Address</th>
                <th>User Agent</th>
                <th>Created At</th>
                <th>Deleted</th>
                <th>Admin Memo</th>
              </tr>
            </thead>
            <tbody className="[&_td]:align-top">
              {anonymousPosts.map(anonymousPost => (
                <tr key={anonymousPost.id} className={convertNumberToBoolean(anonymousPost.is_deleted) ? 'bg-error/20' : ''}>
                  <td className={`min-w-[3rem]                    `}><span className="block font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => setAnonymousPost(anonymousPost)}>{anonymousPost.id}</span></td>
                  <td className={`min-w-[9rem] whitespace-pre-wrap`}>{anonymousPost.content}</td>
                  <td className={`min-w-[8rem]                    `}><a href={`https://whatismyipaddress.com/ip/${anonymousPost.ip_address}`} target="_blank" rel="noreferrer noopener" className="link-line">{anonymousPost.ip_address}</a></td>
                  <td className={`min-w-[8rem]                    `}>{anonymousPost.user_agent}</td>
                  <td className={`             whitespace-nowrap  `}>{convertUtcToJst(anonymousPost.created_at)}</td>
                  <td                                               >{convertNumberToBoolean(anonymousPost.is_deleted) ? <X className="text-error" /> : <Minus className="text-base-content/50" />}</td>
                  <td className={`min-w-[8rem] whitespace-pre-wrap`}>{anonymousPost.admin_memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
