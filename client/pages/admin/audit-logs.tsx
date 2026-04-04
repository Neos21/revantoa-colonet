import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';

import { adminApi } from './helpers/admin-api';
import { apiPaths } from '../../../shared/constants/api-paths';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { pagePaths } from '../../shared/constants/page-paths';
import { extractApiErrorMessage } from '../../shared/helpers/extract-api-error-message';

import type { AuditLog } from '../../../shared/types/audit-log';

export default function AdminAuditLogs(): ReactNode {
  const [auditLogs, setAuditLogs] = useState<Array<AuditLog> | null>(null);
  const [auditLog, setAuditLog] = useState<Partial<AuditLog>>({ created_at: '' });
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      await adminApi.post(apiPaths.admin.checkToken.route).json();
      
      await fetchAuditLogs();
    })();
  }, []);
  
  const fetchAuditLogs = async (): Promise<void> => {
    try {
      const response = await adminApi.get(apiPaths.admin.auditLogs.route).json<{ result: Array<AuditLog>; }>();
      setAuditLogs(response.result);
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
      await adminApi.delete(apiPaths.admin.auditLogs.route, { json: auditLog }).json();
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '削除に失敗しました');
      return setErrorMessage(errorMessage);
    }
    await fetchAuditLogs();
  };
  
  return (
    <>
      <h1 className="text-lg font-bold">Admin Audit Logs</h1>
      <div className="mt-6"><Link to={pagePaths.admin.dashboard.route} className="link-line">Dashboard</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.timelines.route} className="link-line">Timelines</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.users.route} className="link-line">Users</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.posts.route} className="link-line">Posts</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.votes.route} className="link-line">Votes</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.denyIpAddresses.route} className="link-line">Deny IP Addresses</Link>&nbsp;|&nbsp;Audit Logs&nbsp;|&nbsp;<Link to={pagePaths.admin.counters.route} className="link-line">Counters</Link>&nbsp;|&nbsp;<Link to={pagePaths.admin.anonymousPosts.route} className="link-line">Anonymous Posts</Link></div>
      
      {!isEmpty(errorMessage) && <div className="mt-6 text-error">{errorMessage}</div>}
      
      <h2 className="mt-6 font-bold">Remove</h2>
      <form onSubmit={onRemove} className="mt-2 space-y-2">
        <input type="text" className="w-full input" placeholder="Created At (JST)"
          value={auditLog.created_at} onChange={event => setAuditLog(prevAuditLog => ({ ...prevAuditLog, created_at: event.target.value }))} />
        <div className="text-right"><button type="submit" className="btn btn-primary">Remove</button></div>
      </form>
      
      <h2 className="mt-6 font-bold">List</h2>
      {auditLogs != null && auditLogs.length === 0 && <div className="mt-6">No Audit Logs</div>}
      {auditLogs != null && auditLogs.length > 0 && (
        <div className="mt-6 overflow-x-auto border rounded-box border-base-content">
          <table className="table table-sm [&_th,&_td]:border-base-content">
            <thead className="[&_th]:whitespace-nowrap [&_th]:text-base-content">
              <tr>
                <th>Created At</th>
                <th>Log</th>
              </tr>
            </thead>
            <tbody className="[&_td]:align-top">
              {auditLogs.map(auditLog => (
                <tr key={auditLog.id} title={String(auditLog.id)}>
                  <td className="whitespace-nowrap">{convertUtcToJst(auditLog.created_at)}</td>
                  <td                              >{auditLog.log}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
