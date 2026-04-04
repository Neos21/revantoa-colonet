import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';

import { adminApi } from './helpers/admin-api';
import { apiPaths } from '../../../shared/constants/api-paths';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { pagePaths } from '../../shared/constants/page-paths';
import { extractApiErrorMessage } from '../../shared/helpers/extract-api-error-message';

import type { DenyIpAddress } from '../../../shared/types/deny-ip-address';

export default function AdminDenyIpAddresses(): ReactNode {
  const [denyIpAddresses, setDenyIpAddresses] = useState<Array<DenyIpAddress> | null>(null);
  const [denyIpAddress, setDenyIpAddress] = useState<Partial<DenyIpAddress>>({ ip_address: '' });
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      await adminApi.post(apiPaths.admin.checkToken.route).json();
      
      await fetchDenyIpAddresses();
    })();
  }, []);
  
  const fetchDenyIpAddresses = async (): Promise<void> => {
    try {
      const response = await adminApi.get(apiPaths.admin.denyIpAddresses.route).json<{ result: Array<DenyIpAddress>; }>();
      setDenyIpAddresses(response.result);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '一覧の取得に失敗しました');
      setErrorMessage(errorMessage);
    }
  };
  
  const onAdd = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    try {
      await adminApi.post(apiPaths.admin.denyIpAddresses.route, { json: denyIpAddress }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '追加に失敗しました');
      return setErrorMessage(errorMessage);
    }
    setDenyIpAddress({ ip_address: '' });
    await fetchDenyIpAddresses();
  };
  
  const onRemove = async (id: number): Promise<void> => {
    setErrorMessage('');
    try {
      await adminApi.delete(apiPaths.admin.denyIpAddresses.route, { json: { id } }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '削除に失敗しました');
      return setErrorMessage(errorMessage);
    }
    await fetchDenyIpAddresses();
  };
  
  return (
    <>
      <h1 className="text-lg font-bold">Admin Deny IP Addresses</h1>
      <div className="mt-6"><Link to={pagePaths.admin.dashboard.route} className="link-line">Dashboard</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.timelines.route} className="link-line">Timelines</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.users.route} className="link-line">Users</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.posts.route} className="link-line">Posts</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.votes.route} className="link-line">Votes</Link>&nbsp;|&nbsp;Deny IP Addresses&nbsp;|&nbsp;<Link to={pagePaths.admin.auditLogs.route} className="link-line">Audit Logs</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.counters.route} className="link-line">Counters</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.anonymousPosts.route} className="link-line">Anonymous Posts</Link></div>
      
      {!isEmpty(errorMessage) && <div className="mt-6 text-error">{errorMessage}</div>}
      
      <h2 className="mt-6 font-bold">New</h2>
      <form onSubmit={onAdd} className="mt-2 space-y-2">
        <input type="text" className="w-full input" placeholder="IP Address (Auto Convert To 64 Bit)"
          value={denyIpAddress.ip_address} onChange={event => setDenyIpAddress(prevDenyIpAddress => ({ ...prevDenyIpAddress, ip_address: event.target.value }))} />
        <div className="text-right"><button type="submit" className="btn btn-primary">Add</button></div>
      </form>
      
      <h2 className="mt-6 font-bold">List</h2>
      {denyIpAddresses != null && denyIpAddresses.length === 0 && <div className="mt-6">No Deny IP Addresses</div>}
      {denyIpAddresses != null && denyIpAddresses.length > 0 && (
        <div className="mt-6 overflow-x-auto border rounded-box border-base-content bg-base-100">
          <table className="table table-sm [&_th,&_td]:border-base-content">
            <thead className="[&_th]:whitespace-nowrap [&_th]:text-base-content">
              <tr>
                <th>ID</th>
                <th>IP Address</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody className="[&_td]:align-top">
              {denyIpAddresses.map(denyIpAddress => (
                <tr key={denyIpAddress.id}>
                  <td className="min-w-[3rem]"     ><span className="block font-bold underline cursor-pointer text-primary hover:no-underline" onClick={() => onRemove(denyIpAddress.id)}>{denyIpAddress.id}</span></td>
                  <td className="min-w-[8rem]"     >{denyIpAddress.ip_address}</td>
                  <td className="whitespace-nowrap">{convertUtcToJst(denyIpAddress.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
