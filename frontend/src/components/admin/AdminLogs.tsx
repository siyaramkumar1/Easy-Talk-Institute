import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const AdminLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Activity Logs</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Module</th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">IP Address</th>
                <th className="p-4 font-medium text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log, i) => (
                <tr key={log._id || i} className="hover:bg-slate-50">
                  <td className="p-4 text-slate-800 text-sm font-bold">
                    <div>{log.action}</div>
                    {log.description && (
                      <div className="text-xs text-slate-500 font-normal mt-0.5">{log.description}</div>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 text-sm">{log.module || '-'}</td>
                  <td className="p-4 text-slate-600 text-sm">{log.performedBy || 'Unknown'}</td>
                  <td className="p-4 text-slate-600 text-sm uppercase text-xs font-bold">{log.role || 'Unknown'}</td>
                  <td className="p-4 text-slate-500 text-sm">{log.ip || '-'}</td>
                  <td className="p-4 text-slate-500 text-sm text-right">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
