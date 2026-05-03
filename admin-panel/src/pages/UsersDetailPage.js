import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function UsersDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      // No token -> redirect to login
      navigate('/login');
      return;
    }
    api.get(`/admin/users/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } })
      .then(res => setUser(res.data))
      .catch(err => {
        const msg = err?.response?.data?.message || 'Failed to fetch user';
        setError(msg);
        console.error(err);
        if (err?.response?.status === 401) navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-gray-100 min-h-screen p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          user && (
            <div className="bg-white rounded-xl shadow p-6">
              <h1 className="text-2xl font-bold mb-4">{user.full_name}</h1>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="font-medium text-gray-600">Email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Phone</dt>
                  <dd>{user.phone ?? '-'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Role</dt>
                  <dd>{user.role}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Joined</dt>
                  <dd>{new Date(user.created_at).toLocaleString()}</dd>
                </div>
                {user.barangay && (
                  <div>
                    <dt className="font-medium text-gray-600">Barangay</dt>
                    <dd>{user.barangay}</dd>
                  </div>
                )}
                {user.service_type && (
                  <div>
                    <dt className="font-medium text-gray-600">Service Type</dt>
                    <dd>{user.service_type}</dd>
                  </div>
                )}
              </dl>
            </div>
          )
        )}
      </main>
    </div>
  );
}
