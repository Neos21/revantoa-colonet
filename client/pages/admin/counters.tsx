import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';

import { adminApi } from './helpers/admin-api';
import { apiPaths } from '../../../shared/constants/api-paths';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { pagePaths } from '../../shared/constants/page-paths';
import { extractApiErrorMessage } from '../../shared/helpers/extract-api-error-message';

import type { Counter } from '../../../shared/types/counter';

export default function AdminCounters(): ReactNode {
  const [counters, setCounters] = useState<Array<Counter> | null>(null);
  const [counter, setCounter] = useState<Partial<Counter>>({ created_at: '' });
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      await adminApi.post(apiPaths.admin.checkToken.route).json();
      
      await fetchCounters();
    })();
  }, []);
  
  const fetchCounters = async (): Promise<void> => {
    try {
      const response = await adminApi.get(apiPaths.admin.counters.route).json<{ result: Array<Counter>; }>();
      setCounters(response.result);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '一覧の取得に失敗しました');
      setErrorMessage(errorMessage);
    }
  };
  
  const onRemove = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    try {
      await adminApi.delete(apiPaths.admin.counters.route, { json: counter }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '削除に失敗しました');
      return setErrorMessage(errorMessage);
    }
    await fetchCounters();
  };
  
  // NOTE : 指定の IP アドレスの詳細が確認できるサイトは以下あたりがあった・IPv6 も完全展開なら対応 (`::/64` は非対応)
  // - https://whatismyipaddress.com/ip/【IP】
  // - https://iplocation.io/ip/【IP】
  // - https://www.whatismyip.com/ip/【IP】
  
  return (
    <>
      <h1 className="text-lg font-bold">Admin Counters</h1>
      <div className="mt-6"><Link to={pagePaths.admin.dashboard.route} className="link-line">Dashboard</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.timelines.route} className="link-line">Timelines</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.users.route} className="link-line">Users</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.posts.route} className="link-line">Posts</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.votes.route} className="link-line">Votes</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.denyIpAddresses.route} className="link-line">Deny IP Addresses</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.auditLogs.route} className="link-line">Audit Logs</Link>&nbsp;|&nbsp;Counters&nbsp;|&nbsp;<Link to={pagePaths.admin.anonymousPosts.route} className="link-line">Anonymous Posts</Link></div>
      
      {!isEmpty(errorMessage) && <div className="mt-6 text-error">{errorMessage}</div>}
      
      <h2 className="mt-6 font-bold">Remove</h2>
      <form onSubmit={onRemove} className="mt-2 space-y-2">
        <input type="text" className="w-full input" placeholder="Created At (JST)"
          value={counter.created_at} onChange={event => setCounter(prevCounter => ({ ...prevCounter, created_at: event.target.value }))} />
        <div className="text-right"><button type="submit" className="btn btn-primary">Remove</button></div>
      </form>
      
      <h2 className="mt-6 font-bold">List</h2>
      {counters != null && counters.length === 0 && <div className="mt-6">No Counters</div>}
      {counters != null && counters.length > 0 && (
        <div className="mt-6 overflow-x-auto border rounded-box border-base-content">
          <table className="table table-sm [&_th,&_td]:border-base-content">
            <thead className="[&_th]:whitespace-nowrap [&_th]:text-base-content">
              <tr>
                <th>Created At</th>
                <th>Referrer</th>
                <th>Name</th>
                <th>IP Address</th>
                <th>User Agent</th>
              </tr>
            </thead>
            <tbody className="[&_td]:align-top">
              {counters.map(counter => (
                <tr key={counter.id} title={String(counter.id)}>
                  <td className="whitespace-nowrap">{convertUtcToJst(counter.created_at)}</td>
                  <td className="min-w-[9rem]"     ><a href={counter.referrer ?? '#'} target="_blank" rel="noreferrer noopener" className="link-line">{counter.referrer}</a></td>
                  <td className="min-w-[5rem]"     >{counter.name}</td>
                  <td className="min-w-[8rem]"     ><a href={`https://whatismyipaddress.com/ip/${counter.ip_address}`} target="_blank" rel="noreferrer noopener" className="link-line">{counter.ip_address}</a></td>
                  <td                              >{counter.user_agent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
