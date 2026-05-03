import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Eye, Trash2 } from 'lucide-react';

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProviders = () => {
    api.get('/admin/providers')
      .then(res => setProviders(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this provider?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchProviders(); // refresh the list
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete provider');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-100 min-h-screen p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Service Providers</h1>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-500">Loading...</p>
          ) : providers.length === 0 ? (
            <p className="p-6 text-gray-500">No service providers found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Service Type</th>
                  <th className="px-6 py-3 text-left">Phone</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4">{p.full_name}</td>
                    <td className="px-6 py-4">{p.email || '-'}</td>
                    <td className="px-6 py-4 capitalize">{p.service_type}</td>
                    <td className="px-6 py-4">{p.phone_number || p.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${p.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/users/${p.id}`)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}