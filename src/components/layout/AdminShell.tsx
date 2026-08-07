import { useState } from 'react';
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { apiClient } from '../../api/client';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await apiClient.post('/admin/logout');
    } catch {
      // backend logout is best-effort; clear locally regardless
    }
    localStorage.removeItem('prepnest_token');
    localStorage.removeItem('prepnest_user');
    navigate('/login', { replace: true });
  };

  const sidebarContent = (
    <>
      <div className="mb-6">
        <div className="text-lg font-semibold">PrepNest Admin</div>
        <div className="text-sm text-slate-500">CMS control center</div>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={() => setSidebarOpen(false)}
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
    </>
  );

  return (
    <div className="min-h-screen bg-bg text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-0 md:gap-6 px-0 md:px-6 py-0 md:py-4">
        {/* Mobile header bar */}
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white border-b border-slate-200 px-4 h-14 md:hidden">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600">
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-slate-900">PrepNest Admin</span>
          </div>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Mobile drawer sidebar */}
        <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200 p-4 shadow-lg transform transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex justify-end mb-4">
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-col h-full pb-8">
            {sidebarContent}
          </div>
        </aside>

        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 rounded-[16px] border border-slate-200 bg-white p-4 shadow-soft md:flex md:flex-col">
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 rounded-none md:rounded-[16px] border-0 md:border border-slate-200 bg-white shadow-soft md:mt-0 mt-14 overflow-hidden">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <ConfirmDialog open={showLogout} title="Logout" message="Are you sure you want to logout from PrepNest Admin?" confirmLabel="Logout" onConfirm={() => { setShowLogout(false); handleLogout(); }} onCancel={() => setShowLogout(false)} />
    </div>
  );
}
