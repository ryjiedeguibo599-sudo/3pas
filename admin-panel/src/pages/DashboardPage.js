import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Users, Briefcase, ShoppingCart, Car, Wrench, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import StatCard from '../components/StatCard';

export default function DashboardPage() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reports/summary');
      setStats(res.data);
    } catch (err) {
      const msg = err?.response?.data?.detail
        || err?.response?.data?.message
        || err?.message
        || 'Failed to fetch dashboard data.';
      setError(msg);
      console.error('Dashboard fetch error:', err?.response || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-100 min-h-screen p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Error loading data</p>
              <p className="mt-0.5 text-red-600">{error}</p>
              <p className="mt-1 text-xs text-red-500">Make sure the backend server is running and you are logged in.</p>
            </div>
          </div>
        )}

        {loading && !stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard label="Live Online Users"  value={stats?.active_users ?? 0} icon={Activity}     color="bg-emerald-500" />
            <StatCard label="Total Users"        value={stats?.users      ?? 0} icon={Users}         color="bg-blue-500"    />
            <StatCard label="Service Providers"  value={stats?.providers  ?? 0} icon={Briefcase}     color="bg-green-500"   />
            <StatCard label="Grocery Orders"     value={stats?.orders     ?? 0} icon={ShoppingCart}  color="bg-yellow-500"  />
            <StatCard label="Ride Bookings"      value={stats?.rides      ?? 0} icon={Car}           color="bg-purple-500"  />
            <StatCard label="Repair Requests"    value={stats?.repairs    ?? 0} icon={Wrench}        color="bg-red-500"     />
          </div>
        )}
      </main>
    </div>
  );
}