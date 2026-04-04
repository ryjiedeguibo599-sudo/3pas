import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, BarChart2, LogOut } from 'lucide-react';

const links = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users',    label: 'Users',     icon: Users },
  { to: '/providers',label: 'Providers', icon: Briefcase },
  { to: '/reports',  label: 'Reports',   icon: BarChart2 },  // ✅ BAGO
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-blue-900 text-white flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-blue-700">
        3PS Admin
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition
              ${pathname === to ? 'bg-blue-600' : 'hover:bg-blue-800'}`}>
            <Icon size={18} /> {label}
          </Link>
        ))}
      </nav>
      <button onClick={logout}
        className="flex items-center gap-3 px-8 py-4 hover:bg-blue-800 border-t border-blue-700">
        <LogOut size={18} /> Logout
      </button>
    </aside>
  );
}