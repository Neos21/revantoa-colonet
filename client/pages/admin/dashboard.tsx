import { useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { adminApi } from './helpers/admin-api';
import { removeJwt } from './helpers/auth';
import { apiPaths } from '../../../shared/constants/api-paths';
import { pagePaths } from '../../shared/constants/page-paths';

export default function AdminDashboard(): ReactNode {
  const navigate = useNavigate();
  
  useEffect(() => {
    (async () => {
      // トークンがなければリダイレクトし、トークンがあれば有効期限チェックして NG ならリダイレクトする
      await adminApi.post(apiPaths.admin.checkToken.route).json();
    })();
  }, []);
  
  const onLogout = (): void => {
    removeJwt();
    navigate(pagePaths.admin.route);
  };
  
  return (
    <>
      <h1 className="text-lg font-bold">Admin Dashboard</h1>
      <ul className="pl-5 mt-6 list-disc">
        <li><Link to={pagePaths.admin.timelines.route} className="link-line font-bold">Admin Timelines</Link></li>
        <li><Link to={pagePaths.admin.users.route} className="link-line">Admin Users</Link></li>
        <li><Link to={pagePaths.admin.posts.route} className="link-line">Admin Posts</Link></li>
        <li><Link to={pagePaths.admin.votes.route} className="link-line">Admin Votes</Link></li>
        <li><Link to={pagePaths.admin.denyIpAddresses.route} className="link-line">Admin Deny IP Addresses</Link></li>
        <li><Link to={pagePaths.admin.auditLogs.route} className="link-line">Admin Audit Logs</Link></li>
        <li><Link to={pagePaths.admin.counters.route} className="link-line">Admin Counters</Link></li>
        <li><Link to={pagePaths.admin.anonymousPosts.route} className="link-line">Admin Anonymous Posts</Link></li>
      </ul>
      <div className="mt-6 text-right"><span className="link-line cursor-pointer" onClick={onLogout}>Logout</span></div>
      <div className="mt-6 text-right"><Link to={pagePaths.route} className="link-line">Go To Index</Link></div>
    </>
  );
}
