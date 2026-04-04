import { ArrowBigDown, ArrowBigUp, Minus, X } from 'lucide-react';
import { Fragment, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';

import { adminApi } from './helpers/admin-api';
import { apiPaths, joinPath } from '../../../shared/constants/api-paths';
import { voteValue } from '../../../shared/constants/vote-value';
import { convertBooleanToNumber } from '../../../shared/helpers/convert-boolean-to-number';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { pagePaths } from '../../shared/constants/page-paths';
import { extractApiErrorMessage } from '../../shared/helpers/extract-api-error-message';

import type { AdminTimeline } from '../../../shared/types/admin-timeline';
import type { PostForAdmin } from '../../../shared/types/post';
import type { UserForAdmin } from '../../../shared/types/user';
import type { VoteForAdmin } from '../../../shared/types/vote';

export default function AdminTimelines(): ReactNode {
  const [timelines, setTimelines] = useState<Array<AdminTimeline> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [user, setUser] = useState<UserForAdmin | null>(null);
  const [post, setPost] = useState<PostForAdmin | null>(null);
  const [vote, setVote] = useState<VoteForAdmin | null>(null);
  
  useEffect(() => {
    (async () => {
      await adminApi.post(apiPaths.admin.checkToken.route).json();
      
      await fetchTimelines();
    })();
  }, []);
  
  const fetchTimelines = async (): Promise<void> => {
    try {
      const response = await adminApi.get(apiPaths.admin.timelines.route).json<{ result: Array<AdminTimeline>; }>();
      setTimelines(response.result);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '一覧の取得に失敗しました');
      setErrorMessage(errorMessage);
    }
  };
  
  const clearEdits = (): void => {
    setUser(null);
    setPost(null);
    setVote(null);
  };
  
  const onEditUser = async (userId: number): Promise<void> => {
    clearEdits();
    try {
      const response = await adminApi.get(joinPath(apiPaths.admin.users.route, String(userId))).json<{ result: UserForAdmin; }>();
      setUser(response.result);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, 'ユーザの取得に失敗しました');
      return setErrorMessage(errorMessage);
    }
  };
  
  const onSubmitUser = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    try {
      await adminApi.post(apiPaths.admin.users.route, { json: user }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, 'ユーザの更新に失敗しました');
      return setErrorMessage(errorMessage);
    }
    await fetchTimelines();
    clearEdits();
  };
  
  const onEditPost = async (postId: number): Promise<void> => {
    clearEdits();
    try {
      const response = await adminApi.get(joinPath(apiPaths.admin.posts.route, String(postId))).json<{ result: PostForAdmin; }>();
      setPost(response.result);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '投稿の取得に失敗しました');
      return setErrorMessage(errorMessage);
    }
  };
  
  const onSubmitPost = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    try {
      await adminApi.post(apiPaths.admin.posts.route, { json: post }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '投稿の更新に失敗しました');
      return setErrorMessage(errorMessage);
    }
    await fetchTimelines();
    clearEdits();
  };
  
  const onEditVote = async (voteId: number): Promise<void> => {
    clearEdits();
    try {
      const response = await adminApi.get(joinPath(apiPaths.admin.votes.route, String(voteId))).json<{ result: VoteForAdmin; }>();
      setVote(response.result);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '評価の取得に失敗しました');
      return setErrorMessage(errorMessage);
    }
  };
  
  const onSubmitVote = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    try {
      await adminApi.post(apiPaths.admin.votes.route, { json: vote }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '評価の更新に失敗しました');
      return setErrorMessage(errorMessage);
    }
    await fetchTimelines();
    clearEdits();
  };
  
  return (
    <>
      <h1 className="text-lg font-bold">Admin Timelines</h1>
      <div className="mt-6"><Link to={pagePaths.admin.dashboard.route} className="link-line">Dashboard</Link>&nbsp;|&nbsp;Timelines&nbsp;|&nbsp;<Link to={pagePaths.admin.users.route} className="link-line">Users</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.posts.route} className="link-line">Posts</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.votes.route} className="link-line">Votes</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.denyIpAddresses.route} className="link-line">Deny IP Addresses</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.auditLogs.route} className="link-line">Audit Logs</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.counters.route} className="link-line">Counters</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.anonymousPosts.route} className="link-line">Anonymous Posts</Link></div>
      
      {!isEmpty(errorMessage) && <div className="mt-6 text-error">{errorMessage}</div>}
      
      {user != null && (
        <>
          <h2 className="mt-6 font-bold">Edit User : ID [{user.id}]</h2>
          <form onSubmit={onSubmitUser} className="mt-2 space-y-2">
            <input type="text" className="w-full input" placeholder="Name"
              value={user.name} onChange={event => setUser(prevUser => ({ ...prevUser!, name: event.target.value }))} />
            <input type="text" className="w-full input" placeholder="Created At"
              value={user.created_at} onChange={event => setUser(prevUser => ({ ...prevUser!, created_at: event.target.value }))} />
            <input type="text" className="w-full input" placeholder="Last Login At"
              value={user.last_login_at ?? ''} onChange={event => setUser(prevUser => ({ ...prevUser!, last_login_at: event.target.value }))} />
            <label className="label">
              <input type="checkbox" className="checkbox"
                checked={convertNumberToBoolean(user.is_deleted)} onChange={event => setUser(prevUser => ({ ...prevUser!, is_deleted: convertBooleanToNumber(event.target.checked) as typeof user.is_deleted }))} />
              Is Deleted
            </label>
            <textarea rows={3} className="w-full textarea" placeholder="Admin Memo"
              value={user.admin_memo ?? ''} onChange={event => setUser(prevUser => ({ ...prevUser!, admin_memo: event.target.value }))} />
            <div className="text-right"><button type="submit" className="btn btn-primary">Update</button></div>
          </form>
        </>
      )}
      
      {post != null && (
        <>
          <h2 className="mt-6 font-bold">Edit Post : ID [{post.id}]</h2>
          <form onSubmit={onSubmitPost} className="mt-2 space-y-2">
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
      
      {vote != null && (
        <>
          <h2 className="mt-6 font-bold">Edit Vote : ID [{vote.id}]</h2>
          <form onSubmit={onSubmitVote} className="mt-2 space-y-2">
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
      
      {timelines != null && timelines.length === 0 && <div className="mt-6">No Timelines</div>}
      {timelines != null && timelines.length > 0 && (
        <>
          <div className="mt-6"><span className="text-error/60">■</span><span className="mr-3">投稿や投票が削除</span><span className="text-error/30">■</span><span className="mr-3">投稿や投票に紐付くユーザが削除</span><span className="text-base-content/30">■</span>キャンセルされた投票</div>
          <div className="mt-6 overflow-x-auto border border-base-content bg-base-100 w-[94vw] relative left-1/2 right-1/2 -ml-[47vw] +mr-[47vw]">  {/* eslint-disable-line tailwindcss/enforces-negative-arbitrary-values */}
            <table className="table table-sm border-b-0 rounded-none [&_th,&_td]:border-base-content [&_svg]:inline">
              <thead className="[&_th]:whitespace-nowrap [&_th]:text-base-content">
                <tr>
                  <th colSpan={6} className="border-r">Post</th>
                  <th colSpan={2} className="border-r">Posted User</th>
                  <th colSpan={4} className="border-r">Votes</th>
                  <th colSpan={2}                     >Voted User</th>
                </tr>
                <tr>
                  {/* Post : User Agent のみ除外 */}
                  <th                     >ID</th>  {/* Is Deleted も併記 */}
                  <th                     >Content</th>
                  <th                     >IP Address</th>
                  <th                     >Created At</th>
                  <th                     >Votes</th>
                  <th className="border-r">Admin Memo</th>
                  {/* User */}
                  <th                     >Name</th>  {/* ID・Is Deleted も併記 */}
                  <th className="border-r">Admin Memo</th>
                  {/* Votes : User Agent のみ除外 */}
                  <th                     >Vote</th>  {/* Vote・Cancelled・Deleted も併記 */}
                  <th                     >IP Address</th>
                  <th                     >Created At</th>
                  <th className="border-r">Admin Memo</th>
                  {/* Votes User */}
                  <th                     >Name</th>  {/* ID・Is Deleted も併記 */}
                  <th                     >Admin Memo</th>
                </tr>
              </thead>
              <tbody className="[&_td]:align-top [&_td]:border-b">
                {timelines.map(timeline => {
                  const postIsDeleted     = convertNumberToBoolean(timeline.post_is_deleted);
                  const postUserIsDeleted = convertNumberToBoolean(timeline.user_is_deleted);
                  const postBg = postUserIsDeleted ? 'bg-error/60' : postIsDeleted ? 'bg-error/30' : '';
                  
                  const voteIsCancelled   = timeline.votes[0]?.vote_is_cancelled != null && convertNumberToBoolean(timeline.votes[0].vote_is_cancelled);
                  const voteIsDeleted     = timeline.votes[0]?.vote_is_deleted   != null && convertNumberToBoolean(timeline.votes[0].vote_is_deleted);
                  const voteUserIsDeleted = timeline.votes[0]?.user_is_deleted   != null && convertNumberToBoolean(timeline.votes[0].user_is_deleted);
                  const voteBg = voteUserIsDeleted ? 'bg-error/60' : voteIsDeleted ? 'bg-error/30' : voteIsCancelled ? 'bg-base-content/30' : '';
                  return (
                    <Fragment key={timeline.post_id}>
                      <tr>
                        <td rowSpan={timeline.votes.length || 1} className={`${postBg}              whitespace-nowrap           `}>{convertNumberToBoolean(timeline.post_is_deleted) ? <X className="mr-1 -ml-1 text-error" /> : <Minus className="mr-1 -ml-1 text-base-content/50" />}<span className="font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => onEditPost(timeline.post_id)}>{timeline.post_id}</span></td>
                        <td rowSpan={timeline.votes.length || 1} className={`${postBg} min-w-[9rem] whitespace-pre-wrap         `}>{timeline.post_content}</td>
                        <td rowSpan={timeline.votes.length || 1} className={`${postBg} min-w-[8rem]                             `}><a href={`https://whatismyipaddress.com/ip/${timeline.post_ip_address}`} target="_blank" rel="noreferrer noopener" className="link-line">{timeline.post_ip_address}</a></td>
                        <td rowSpan={timeline.votes.length || 1} className={`${postBg}              whitespace-nowrap           `}>{convertUtcToJst(timeline.post_created_at)}</td>
                        <td rowSpan={timeline.votes.length || 1} className={`${postBg}              whitespace-nowrap           `}><span className={`${timeline.post_vote_count_up > 0 ? 'text-emerald-600' : ''}`}>{timeline.post_vote_count_up}</span> / <span className={`${timeline.post_vote_count_down > 0 ? 'text-rose-600' : ''}`}>{timeline.post_vote_count_down}</span></td>
                        <td rowSpan={timeline.votes.length || 1} className={`${postBg} min-w-[6rem] whitespace-pre-wrap border-r`}>{timeline.post_admin_memo}</td>
                        
                        <td rowSpan={timeline.votes.length || 1} className={`${postBg} min-w-[5rem]                             `}>{convertNumberToBoolean(timeline.user_is_deleted) ? <X className="mr-1 -ml-1 text-error" /> : <Minus className="mr-1 -ml-1 text-base-content/50" />}<span className="font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => onEditUser(timeline.user_id)}>{timeline.user_id}</span><br />{timeline.user_name}</td>
                        <td rowSpan={timeline.votes.length || 1} className={`${postBg} min-w-[6rem] whitespace-pre-wrap border-r`}>{timeline.user_admin_memo}</td>
                        
                        <td className={`${voteBg}              whitespace-nowrap           `}>{timeline.votes[0]?.vote_vote         != null && (timeline.votes[0]?.vote_vote === voteValue.upVote ? <ArrowBigUp className="inline -ml-1 text-success" /> : timeline.votes[0]?.vote_vote === voteValue.downVote ? <ArrowBigDown className="inline -ml-1 text-error" /> : <span className="text-error">{timeline.votes[0]?.vote_vote} (異常値)</span>)}
                                                                                              {timeline.votes[0]?.vote_is_cancelled != null && (convertNumberToBoolean(timeline.votes[0].vote_is_cancelled) ? <X className="inline text-info" />       : <Minus className="inline text-base-content/50" />)}
                                                                                              {timeline.votes[0]?.vote_is_deleted   != null && (convertNumberToBoolean(timeline.votes[0].vote_is_deleted)   ? <X className="inline mr-1 text-error" /> : <Minus className="inline mr-1 text-base-content/50" />)}
                                                                                              {timeline.votes[0]?.vote_id           != null && <span className="font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => onEditVote(timeline.votes[0].vote_id)}>{timeline.votes[0].vote_id}</span>}</td>
                        <td className={`${voteBg} min-w-[8rem]                             `}><a href={`https://whatismyipaddress.com/ip/${timeline.votes[0]?.vote_ip_address}`} target="_blank" rel="noreferrer noopener" className="link-line">{timeline.votes[0]?.vote_ip_address}</a></td>
                        <td className={`${voteBg}              whitespace-nowrap           `}>{timeline.votes[0]?.vote_created_at != null && convertUtcToJst(timeline.votes[0].vote_created_at)}</td>
                        <td className={`${voteBg} min-w-[6rem] whitespace-pre-wrap border-r`}>{timeline.votes[0]?.vote_admin_memo}</td>
                        
                        <td className={`${voteBg} min-w-[5rem]                             `}>{timeline.votes[0]?.user_is_deleted != null && (convertNumberToBoolean(timeline.votes[0].user_is_deleted) ? <X className="mr-1 -ml-1 text-error" /> : <Minus className="mr-1 -ml-1 text-base-content/50" />)}{timeline.votes[0]?.user_id != null && <span className="font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => onEditUser(timeline.votes[0].user_id)}>{timeline.votes[0].user_id}</span>}<br />{timeline.votes[0]?.user_name}</td>
                        <td className={`${voteBg} min-w-[6rem] whitespace-pre-wrap         `}>{timeline.votes[0]?.user_admin_memo}</td>
                      </tr>
                      {timeline.votes.slice(1).map(vote => {
                        const voteIsCancelled   = convertNumberToBoolean(vote.vote_is_cancelled);
                        const voteIsDeleted     = convertNumberToBoolean(vote.vote_is_deleted);
                        const voteUserIsDeleted = convertNumberToBoolean(vote.user_is_deleted);
                        const voteBg = voteUserIsDeleted ? 'bg-error/60' : voteIsDeleted ? 'bg-error/30' : voteIsCancelled ? 'bg-base-content/30' : '';
                        return (
                          <tr key={vote.vote_id}>
                            <td className={`${voteBg}              whitespace-nowrap           `}>{vote.vote_vote === voteValue.upVote ? <ArrowBigUp className="inline -ml-1 text-success" /> : vote.vote_vote === voteValue.downVote ? <ArrowBigDown className="inline -ml-1 text-error" /> : <span className="text-error">{vote.vote_vote} (異常値)</span>}
                                                                                                  {convertNumberToBoolean(vote.vote_is_cancelled) ? <X className="inline text-info" />       : <Minus className="inline text-base-content/50" />}
                                                                                                  {convertNumberToBoolean(vote.vote_is_deleted)   ? <X className="inline mr-1 text-error" /> : <Minus className="inline mr-1 text-base-content/50" />}
                                                                                                  <span className="font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => onEditVote(vote.vote_id)}>{vote.vote_id}</span></td>
                            <td className={`${voteBg} min-w-[8rem]                             `}><a href={`https://whatismyipaddress.com/ip/${vote.vote_ip_address}`} target="_blank" rel="noreferrer noopener" className="link-line">{vote.vote_ip_address}</a></td>
                            <td className={`${voteBg}              whitespace-nowrap           `}>{convertUtcToJst(vote.vote_created_at)}</td>
                            <td className={`${voteBg} min-w-[6rem] whitespace-pre-wrap border-r`}>{vote.vote_admin_memo}</td>
                            
                            <td className={`${voteBg} min-w-[5rem]                             `}>{convertNumberToBoolean(vote.user_is_deleted) ? <X className="mr-1 -ml-1 text-error" /> : <Minus className="mr-1 -ml-1 text-base-content/50" />}<span className="font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => onEditUser(vote.user_id)}>{vote.user_id}</span><br />{vote.user_name}</td>
                            <td className={`${voteBg} min-w-[6rem] whitespace-pre-wrap         `}>{vote.user_admin_memo}</td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
