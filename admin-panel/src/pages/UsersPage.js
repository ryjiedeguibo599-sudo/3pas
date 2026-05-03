import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Eye, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Error fetching users:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-100 min-h-screen p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Users</h1>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-500">Loading...</p>
          ) : users.length === 0 ? (
            <p className="p-6 text-gray-500">No users found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Joined</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4">{u.full_name}</td>
                    <td className="px-6 py-4">{u.email || '-'}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                          u.role === 'provider' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/users/${u.id}`)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
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