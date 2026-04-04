import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { ShoppingCart, Car, Wrench, Star, Users, Briefcase } from 'lucide-react';

const COLORS = {
  pasabuy:  '#3B82F6',
  pasakay:  '#10B981',
  parepair: '#F59E0B',
}

const STATUS_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value ?? '...'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  </div>
)

export default function ReportsPage() {
  const [summary, setSummary]       = useState(null)
  const [ordersPerDay, setOrdersPerDay] = useState([])
  const [ratings, setRatings]       = useState([])
  const [topProviders, setTopProviders] = useState([])
  const [breakdown, setBreakdown]   = useState({ orders: [], rides: [], repairs: [] })
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [sum, opd, rat, top, brk] = await Promise.all([
        api.get('/admin/reports/summary'),
        api.get('/admin/reports/orders-per-day'),
        api.get('/admin/reports/ratings'),
        api.get('/admin/reports/top-providers'),
        api.get('/admin/reports/status-breakdown'),
      ])
      setSummary(sum.data)
      // Merge orders per day into one chart dataset
      const allDates = [...new Set([
        ...opd.data.orders.map(d => d.date),
        ...opd.data.rides.map(d => d.date),
        ...opd.data.repairs.map(d => d.date),
      ])].sort()
      const merged = allDates.map(date => ({
        date: new Date(date).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric' }),
        PasaBUY:  parseInt(opd.data.orders.find(d => d.date === date)?.count  || 0),
        Pasakay:  parseInt(opd.data.rides.find(d => d.date === date)?.count   || 0),
        PaRepair: parseInt(opd.data.repairs.find(d => d.date === date)?.count || 0),
      }))
      setOrdersPerDay(merged)
      setRatings(rat.data.ratings.map(r => ({
        name: r.service_type === 'pasabuy' ? 'PasaBUY' :
              r.service_type === 'pasakay' ? 'Pasakay' : 'PaRepair',
        avg_rating: parseFloat(r.avg_rating),
        total_reviews: parseInt(r.total_reviews),
      })))
      setTopProviders(top.data.providers)
      setBreakdown(brk.data)
    } catch (err) {
      console.error('Reports error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-100 min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading reports...</p>
      </main>
    </div>
  )

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-100 min-h-screen p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Reports & Analytics</h1>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Residents"    value={summary?.users}      icon={Users}        color="bg-blue-500" />
          <StatCard label="Service Providers"  value={summary?.providers}  icon={Briefcase}    color="bg-green-500" />
          <StatCard label="Grocery Orders"     value={summary?.orders}     icon={ShoppingCart} color="bg-yellow-500" />
          <StatCard label="Ride Bookings"      value={summary?.rides}      icon={Car}          color="bg-purple-500" />
          <StatCard label="Repair Requests"    value={summary?.repairs}    icon={Wrench}       color="bg-red-500" />
          <StatCard label="Overall Avg Rating" value={`⭐ ${summary?.avg_rating}`} icon={Star} color="bg-orange-400" sub="Across all services" />
        </div>

        {/* ORDERS PER DAY CHART */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">📈 Orders Per Day (Last 7 Days)</h2>
          {ordersPerDay.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Walang data sa last 7 days.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ordersPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="PasaBUY"  stroke="#3B82F6" strokeWidth={2} dot />
                <Line type="monotone" dataKey="Pasakay"  stroke="#10B981" strokeWidth={2} dot />
                <Line type="monotone" dataKey="PaRepair" stroke="#F59E0B" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* RATINGS PER SERVICE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">⭐ Average Rating per Service</h2>
            {ratings.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Walang reviews pa.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ratings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="avg_rating" name="Avg Rating" radius={[6,6,0,0]}>
                    {ratings.map((_, i) => (
                      <Cell key={i} fill={Object.values(COLORS)[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {/* Rating Summary */}
            <div className="mt-4 space-y-2">
              {ratings.map((r, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{r.name}</span>
                  <span className="font-bold text-yellow-500">⭐ {r.avg_rating} <span className="text-gray-400 font-normal">({r.total_reviews} reviews)</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* STATUS BREAKDOWN */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">📦 Status Breakdown</h2>
            <div className="space-y-4">
              {[
                { label: '🛒 PasaBUY Orders', data: breakdown.orders },
                { label: '🛵 Pasakay Rides',  data: breakdown.rides },
                { label: '🔧 PaRepair',       data: breakdown.repairs },
              ].map(({ label, data }) => (
                <div key={label}>
                  <p className="text-sm font-semibold text-gray-600 mb-2">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {data.map((s, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-white text-xs font-bold"
                        style={{ backgroundColor: STATUS_COLORS[i] }}>
                        {s.status}: {s.count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOP PROVIDERS */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">🏆 Top Rated Providers</h2>
          {topProviders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Walang provider ratings pa.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3">#</th>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Avg Rating</th>
                  <th className="pb-3">Total Reviews</th>
                </tr>
              </thead>
              <tbody>
                {topProviders.map((p, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-bold text-gray-400">{i + 1}</td>
                    <td className="py-3 font-semibold text-gray-800">{p.full_name}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: COLORS[p.service_type] || '#999' }}>
                        {p.service_type}
                      </span>
                    </td>
                    <td className="py-3 text-yellow-500 font-bold">⭐ {p.avg_rating}</td>
                    <td className="py-3 text-gray-500">{p.total_reviews} reviews</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  )
}