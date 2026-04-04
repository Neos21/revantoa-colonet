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

import type { UserForAdmin } from '../../../shared/types/user';

export default function AdminUsers(): ReactNode {
  const [users, setUsers] = useState<Array<UserForAdmin> | null>(null);
  const [user, setUser] = useState<UserForAdmin | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      await adminApi.post(apiPaths.admin.checkToken.route).json();
      
      await fetchUsers();
    })();
  }, []);
  
  const fetchUsers = async (): Promise<void> => {
    try {
      const response = await adminApi.get(apiPaths.admin.users.route).json<{ result: Array<UserForAdmin>; }>();
      setUsers(response.result);
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
      await adminApi.post(apiPaths.admin.users.route, { json: user }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '更新に失敗しました');
      return setErrorMessage(errorMessage);
    }
    setUser(null);
    await fetchUsers();
  };
  
  return (
    <>
      <h1 className="text-lg font-bold">Admin Users</h1>
      <div className="mt-6"><Link to={pagePaths.admin.dashboard.route} className="link-line">Dashboard</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.timelines.route} className="link-line">Timelines</Link>&nbsp;|&nbsp;Users&nbsp;|&nbsp;<Link to={pagePaths.admin.posts.route} className="link-line">Posts</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.votes.route} className="link-line">Votes</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.denyIpAddresses.route} className="link-line">Deny IP Addresses</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.auditLogs.route} className="link-line">Audit Logs</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.counters.route} className="link-line">Counters</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.anonymousPosts.route} className="link-line">Anonymous Posts</Link></div>
      
      {!isEmpty(errorMessage) && <div className="mt-6 text-error">{errorMessage}</div>}
      
      {user != null && (
        <>
          <h2 className="mt-6 font-bold">Edit : ID [{user.id}]</h2>
          <form onSubmit={onSubmit} className="mt-2 space-y-2">
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
      
      {users != null && users.length === 0 && <div className="mt-6">No Users</div>}
      {users != null && users.length > 0 && (
        <div className="mt-6 overflow-x-auto border rounded-box border-base-content bg-base-100">
          <table className="table table-sm [&_th,&_td]:border-base-content">
            <thead className="[&_th]:whitespace-nowrap [&_th]:text-base-content">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Created At</th>
                <th>Last Login At</th>
                <th>Deleted</th>
                <th>Admin Memo</th>
              </tr>
            </thead>
            <tbody className="[&_td]:align-top">
              {users.map(user => (
                <tr key={user.id} className={convertNumberToBoolean(user.is_deleted) ? 'bg-error/20' : ''}>
                  <td className="min-w-[3rem]"                    ><span className="block font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => setUser(user)}>{user.id}</span></td>
                  <td className="min-w-[8rem]"                    >{user.name}</td>
                  <td className="whitespace-nowrap"               >{convertUtcToJst(user.created_at)}</td>
                  <td className="whitespace-nowrap"               >{convertUtcToJst(user.last_login_at)}</td>
                  <td                                             >{convertNumberToBoolean(user.is_deleted) ? <X className="text-error" /> : <Minus className="text-base-content/50" />}</td>
                  <td className="min-w-[8rem] whitespace-pre-wrap">{user.admin_memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
