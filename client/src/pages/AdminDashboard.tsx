import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  ShieldAlert, 
  Users, 
  ShoppingBag, 
  BarChart3, 
  Trash2, 
  CheckCircle, 
  FileText,
  DollarSign
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, reportsRes] = await Promise.all([
        API.get('/reports/stats'),
        API.get('/reports'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (reportsRes.data.success) {
        setReports(reportsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch administration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDismissReport = async (reportId: string) => {
    setActionLoadingId(reportId);
    try {
      const res = await API.delete(`/reports/${reportId}`);
      if (res.data.success) {
        setReports((prev) => prev.filter((r) => r._id !== reportId));
        setStats((prev: any) => ({
          ...prev,
          totalReports: Math.max(0, prev.totalReports - 1)
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to dismiss report');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBlockUser = async (userId: string, reportId: string) => {
    setActionLoadingId(reportId);
    try {
      // Simulate/Trigger blocking user or deleting items. 
      // We will make a toast and remove report as resolved.
      alert(`User ID ${userId} has been suspended (simulated).`);
      await API.delete(`/reports/${reportId}`);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      setStats((prev: any) => ({
        ...prev,
        totalReports: Math.max(0, prev.totalReports - 1)
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to execute ban');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-t-primary-500 border-slate-200 dark:border-slate-800 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading admin metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 fade-in">
      
      {/* Title */}
      <div className="flex items-center space-x-2.5">
        <div className="p-2.5 bg-red-150 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans">
            Administration Control Panel
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-450">
            Monitor platform metrics and manage user reports.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-650 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-2xl">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Volume */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-500 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Volume</p>
              <h3 className="text-xl font-extrabold text-slate-850 dark:text-white">{formatPrice(stats.totalVolume)}</h3>
            </div>
          </div>

          {/* Active Users */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
              <h3 className="text-xl font-extrabold text-slate-850 dark:text-white">{stats.totalUsers}</h3>
            </div>
          </div>

          {/* Total Orders */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-950/20 text-primary-550 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transactions</p>
              <h3 className="text-xl font-extrabold text-slate-850 dark:text-white">{stats.totalOrders}</h3>
            </div>
          </div>

          {/* Active Listings */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-550 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Listings</p>
              <h3 className="text-xl font-extrabold text-slate-850 dark:text-white">{stats.activeProductsCount}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Reports Listing Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-slate-400" />
            <span>Active Student Reports ({reports.length})</span>
          </h3>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center text-slate-450 dark:text-slate-500">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 dark:text-white">All Clear!</h4>
            <p className="text-sm max-w-xs mx-auto mt-1">
              There are no pending student reports. All transactions running safely.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-250 dark:border-slate-800">
                  <th className="p-4">Reported User</th>
                  <th className="p-4">Reporter</th>
                  <th className="p-4">Reason / Logs</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                    {/* Reported User */}
                    <td className="p-4">
                      {report.reportedUserId ? (
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {report.reportedUserId.name}
                          <div className="text-xs text-slate-450 font-normal">{report.reportedUserId.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Deleted User</span>
                      )}
                    </td>

                    {/* Reporter */}
                    <td className="p-4">
                      {report.reporterId ? (
                        <div className="font-semibold text-slate-700 dark:text-slate-350">
                          {report.reporterId.name}
                          <div className="text-xs text-slate-450 font-normal">{report.reporterId.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Deleted User</span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="p-4 max-w-xs">
                      <p className="text-slate-650 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans text-xs">
                        {report.reason}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      {new Date(report.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Dismiss */}
                        <button
                          onClick={() => handleDismissReport(report._id)}
                          disabled={actionLoadingId === report._id}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          <span>Dismiss</span>
                        </button>

                        {/* Ban */}
                        {report.reportedUserId && (
                          <button
                            onClick={() => handleBlockUser(report.reportedUserId._id, report._id)}
                            disabled={actionLoadingId === report._id}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-650/10 hover:bg-red-650/20 text-xs font-semibold text-red-600 dark:text-red-400 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Ban User</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
