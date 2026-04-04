import { ArrowBigDown, ArrowBigUp, Minus, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';

import { adminApi } from './helpers/admin-api';
import { apiPaths } from '../../../shared/constants/api-paths';
import { voteValue } from '../../../shared/constants/vote-value';
import { convertBooleanToNumber } from '../../../shared/helpers/convert-boolean-to-number';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { pagePaths } from '../../shared/constants/page-paths';
import { extractApiErrorMessage } from '../../shared/helpers/extract-api-error-message';

import type { VoteForAdmin } from '../../../shared/types/vote';

export default function AdminVotes(): ReactNode {
  const [votes, setVotes] = useState<Array<VoteForAdmin> | null>(null);
  const [vote, setVote] = useState<VoteForAdmin | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      await adminApi.post(apiPaths.admin.checkToken.route).json();
      
      await fetchVotes();
    })();
  }, []);
  
  const fetchVotes = async (): Promise<void> => {
    try {
      const response = await adminApi.get(apiPaths.admin.votes.route).json<{ result: Array<VoteForAdmin>; }>();
      setVotes(response.result);
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
      await adminApi.post(apiPaths.admin.votes.route, { json: vote }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '更新に失敗しました');
      return setErrorMessage(errorMessage);
    }
    setVote(null);
    await fetchVotes();
  };
  
  return (
    <>
      <h1 className="text-lg font-bold">Admin Votes</h1>
      <div className="mt-6"><Link to={pagePaths.admin.dashboard.route} className="link-line">Dashboard</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.timelines.route} className="link-line">Timelines</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.users.route} className="link-line">Users</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.posts.route} className="link-line">Posts</Link>&nbsp;|&nbsp;Votes&nbsp;|&nbsp;<Link to={pagePaths.admin.denyIpAddresses.route} className="link-line">Deny IP Addresses</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.auditLogs.route} className="link-line">Audit Logs</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.counters.route} className="link-line">Counters</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.anonymousPosts.route} className="link-line">Anonymous Posts</Link></div>
      
      {!isEmpty(errorMessage) && <div className="mt-6 text-error">{errorMessage}</div>}
      
      {vote != null && (
        <>
          <h2 className="mt-6 font-bold">Edit : ID [{vote.id}]</h2>
          <form onSubmit={onSubmit} className="mt-2 space-y-2">
            <div>Post ID : [{vote.post_id}]{convertNumberToBoolean(vote.post_is_deleted) && <span className="ml-2 text-error">(削除済投稿)</span>}</div>
            <div className="ml-4">Posted User ID : [{vote.post_user_id}] {vote.post_user_name}{convertNumberToBoolean(vote.post_user_is_deleted) && <span className="ml-2 text-error">(削除済ユーザ)</span>}</div>
            <div className="ml-4 whitespace-pre-wrap">{vote.post_content}</div>
            <div>User ID : [{vote.user_id}] {vote.user_name}{convertNumberToBoolean(vote.user_is_deleted) && <span className="ml-2 text-error">(削除済ユーザ)</span>}</div>
            <div className="flex gap-x-6">
              <label className="label" htmlFor="radio-up-vote">
                <input type="radio" className="radio" id="radio-up-vote" name="radio-up-vote"
                  checked={vote.vote === voteValue.upVote} onChange={() => setVote(prevVote => ({ ...prevVote!, vote: voteValue.upVote }))} />
                <ArrowBigUp className="text-success" />
              </label>
              <label className="label" htmlFor="radio-down-vote">
                <input type="radio" className="radio" id="radio-down-vote" name="radio-down-vote"
                  checked={vote.vote === voteValue.downVote} onChange={() => setVote(prevVote => ({ ...prevVote!, vote: voteValue.downVote }))} />
                <ArrowBigDown className="text-error" />
              </label>
            </div>
            <label className="label">
              <input type="checkbox" className="checkbox"
                checked={convertNumberToBoolean(vote.is_cancelled)} onChange={event => setVote(prevVote => ({ ...prevVote!, is_cancelled: convertBooleanToNumber(event.target.checked) as typeof vote.is_cancelled }))} />
              Is Cancelled
            </label>
            <input type="text" className="w-full input" placeholder="IP Address"
              value={vote.ip_address} onChange={event => setVote(prevVote => ({ ...prevVote!, ip_address: event.target.value }))} />
            <input type="text" className="w-full input" placeholder="User Agent"
              value={vote.user_agent} onChange={event => setVote(prevVote => ({ ...prevVote!, user_agent: event.target.value }))} />
            <input type="text" className="w-full input" placeholder="Created At"
              value={vote.created_at} onChange={event => setVote(prevVote => ({ ...prevVote!, created_at: event.target.value }))} />
            <label className="label">
              <input type="checkbox" className="checkbox"
                checked={convertNumberToBoolean(vote.is_deleted)} onChange={event => setVote(prevVote => ({ ...prevVote!, is_deleted: convertBooleanToNumber(event.target.checked) as typeof vote.is_deleted }))} />
              Is Deleted
            </label>
            <textarea rows={3} className="w-full textarea" placeholder="Admin Memo"
              value={vote.admin_memo ?? ''} onChange={event => setVote(prevVote => ({ ...prevVote!, admin_memo: event.target.value }))} />
            <div className="text-right"><button type="submit" className="btn btn-primary">Update</button></div>
          </form>
        </>
      )}
      
      {votes != null && votes.length === 0 && <div className="mt-6">No Votes</div>}
      {votes != null && votes.length > 0 && (
        <div className="mt-6 overflow-x-auto border rounded-box border-base-content bg-base-100">
          <table className="table table-sm [&_th,&_td]:border-base-content">
            <thead className="[&_th]:whitespace-nowrap [&_th]:text-base-content">
              <tr>
                <th>ID</th>
                <th>Post ID</th>
                <th>User ID</th>
                <th>Vote</th>
                <th>Cancelled</th>
                <th>IP Address</th>
                <th>User Agent</th>
                <th>Created At</th>
                <th>Deleted</th>
                <th>Admin Memo</th>
              </tr>
            </thead>
            <tbody className="[&_td]:align-top">
              {votes.map(vote => (
                <tr key={vote.id} className={convertNumberToBoolean(vote.is_deleted) ? 'bg-error/20' : convertNumberToBoolean(vote.is_cancelled) ? 'bg-base-300' : ''}>
                  <td className={`min-w-[3rem]                                            `}><span className="block font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => setVote(vote)}>{vote.id}</span></td>
                  <td className={`min-w-[9rem] ${vote.post_is_deleted ? 'text-error' : ''}`}>{vote.post_id}<br />{vote.post_user_name}<br />{vote.post_content}</td>
                  <td className={`min-w-[8rem] ${vote.user_is_deleted ? 'text-error' : ''}`}>{vote.user_id}<br />{vote.user_name}</td>
                  <td                                                                       >{vote.vote === voteValue.upVote ? <ArrowBigUp className="text-success" /> : vote.vote === voteValue.downVote ? <ArrowBigDown className="text-error" /> : <span className="text-error">{vote.vote} (異常値)</span>}</td>
                  <td                                                                       >{convertNumberToBoolean(vote.is_cancelled) ? <X className="text-info" /> : <Minus className="text-base-content/50" />}</td>
                  <td className={`min-w-[8rem]                                            `}><a href={`https://whatismyipaddress.com/ip/${vote.ip_address}`} target="_blank" rel="noreferrer noopener" className="link-line">{vote.ip_address}</a></td>
                  <td className={`min-w-[8rem]                                            `}>{vote.user_agent}</td>
                  <td className={`             whitespace-nowrap                          `}>{convertUtcToJst(vote.created_at)}</td>
                  <td                                                                       >{convertNumberToBoolean(vote.is_deleted) ? <X className="text-error" /> : <Minus className="text-base-content/50" />}</td>
                  <td className={`min-w-[8rem] whitespace-pre-wrap                        `}>{vote.admin_memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
