import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ProvidersPage from './pages/ProvidersPage';
import UsersDetailPage from './pages/UsersDetailPage';
import ReportsPage from './pages/ReportsPage';  // ✅ BAGO

function PrivateRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
        <Route path="/providers" element={<PrivateRoute><ProvidersPage /></PrivateRoute>} />
        <Route path="/users/:id" element={<PrivateRoute><UsersDetailPage /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />  {/* ✅ BAGO */}
      </Routes>
    </BrowserRouter>
  );
}