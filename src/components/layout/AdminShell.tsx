import { useState } from 'react';
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/preparation/gate', label: 'GATE Preparation' },
  { to: '/preparation/aptitude', label: 'Aptitude Preparation' },
  { to: '/preparation/interview', label: 'Interview Preparation' },
  { to: '/preparation/technical', label: 'Technical Preparation' },
  { to: '/mock-tests', label: 'Mock Tests' },
  { to: '/daily-challenge', label: 'Daily Challenge' },
  { to: '/important-notifications', label: 'Important Notifications' },
  { to: '/users', label: 'Users' },
  { to: '/settings', label: 'Settings' },
];

export function AdminShell() {
  const token = window.localStorage.getItem('prepnest_token');
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('prepnest_token');
    localStorage.removeItem('prepnest_user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 md:px-6">
        <aside className="hidden w-64 shrink-0 rounded-[16px] border border-slate-200 bg-white p-4 shadow-soft md:flex md:flex-col">
          <div className="mb-6">
            <div className="text-lg font-semibold">PrepNest Admin</div>
            <div className="text-sm text-slate-500">CMS control center</div>
          </div>
          <nav className="flex-1 space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button onClick={() => setShowLogout(true)}
            className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition">
            <LogOut size={16} /> Logout
          </button>
        </aside>
        <main className="min-w-0 flex-1 rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft">
          <Outlet />
        </main>
      </div>
      <ConfirmDialog open={showLogout} title="Logout" message="Are you sure you want to logout from PrepNest Admin?" confirmLabel="Logout" onConfirm={() => { setShowLogout(false); handleLogout(); }} onCancel={() => setShowLogout(false)} />
    </div>
  );
}
