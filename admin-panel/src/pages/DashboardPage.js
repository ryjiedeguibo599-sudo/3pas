import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Users, Briefcase, ShoppingCart, Car, Wrench } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value ?? '...'}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, providers, orders, rides, repairs] = await Promise.all([
          api.get('/admin/stats/users'),
          api.get('/admin/stats/providers'),
          api.get('/admin/stats/orders'),
          api.get('/admin/stats/rides'),
          api.get('/admin/stats/repairs'),
        ]);
        setStats({
          users: users.data.count,
          providers: providers.data.count,
          orders: orders.data.count,
          rides: rides.data.count,
          repairs: repairs.data.count,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-100 min-h-screen p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard label="Total Users" value={stats.users} icon={Users} color="bg-blue-500" />
          <StatCard label="Service Providers" value={stats.providers} icon={Briefcase} color="bg-green-500" />
          <StatCard label="Grocery Orders" value={stats.orders} icon={ShoppingCart} color="bg-yellow-500" />
          <StatCard label="Ride Bookings" value={stats.rides} icon={Car} color="bg-purple-500" />
          <StatCard label="Repair Requests" value={stats.repairs} icon={Wrench} color="bg-red-500" />
        </div>
      </main>
    </div>
  );
}