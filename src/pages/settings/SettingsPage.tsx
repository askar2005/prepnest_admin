import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/ToastHost';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Eye, EyeOff, Camera, Shield, LogOut, Info, Mail, Github, Globe, BookOpen, Server, Lock, FileText, HelpCircle, CheckCircle, XCircle, User } from 'lucide-react';

type AdminProfile = {
  id: string; fullName: string; email: string; role: string; isVerified: boolean;
  profileImage: string | null; displayName: string | null;
  lastLoginAt: string | null; lastPasswordChangeAt: string | null;
  createdAt: string; updatedAt: string;
};

type SessionInfo = { loginTime: string; browser: string; device: string; userAgent: string; sessionId: string };
type SystemInfo = Record<string, string | { name: string; version: string }>;

function SectionCard({ title, icon: Icon, id, children }: { title: string; icon: any; id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
        <Icon size={20} className="text-brand-600" />
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [editFullName, setEditFullName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  // Confirm dialogs
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);
  const [showSidebarLogout, setShowSidebarLogout] = useState(false);
  const [, setLoggingOut] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const [{ data: p }, { data: s }, { data: sys }] = await Promise.all([
        apiClient.get('/admin/profile'),
        apiClient.get('/admin/session'),
        apiClient.get('/admin/system-info'),
      ]);
      setProfile(p.admin);
      setSession(s);
      setSystemInfo(sys);
      setEditFullName(p.admin.fullName);
      setEditDisplayName(p.admin.displayName || '');
      setEditProfileImage(p.admin.profileImage);
    } catch { /* handled by interceptor */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { pushToast('Image must be under 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => setEditProfileImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) { pushToast('Name cannot be empty', 'error'); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { fullName: editFullName.trim() };
      if (editDisplayName !== (profile?.displayName || '')) body.displayName = editDisplayName.trim();
      if (editProfileImage !== profile?.profileImage) body.profileImage = editProfileImage;
      const { data } = await apiClient.put('/admin/profile', body);
      setProfile(data.admin);
      pushToast('Profile updated successfully', 'success');
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Failed to update profile', 'error');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!currentPassword) { setPwError('Current password is required'); return; }
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(newPassword)) { setPwError('Password must contain an uppercase letter'); return; }
    if (!/[a-z]/.test(newPassword)) { setPwError('Password must contain a lowercase letter'); return; }
    if (!/[0-9]/.test(newPassword)) { setPwError('Password must contain a number'); return; }
    if (!/[^A-Za-z0-9]/.test(newPassword)) { setPwError('Password must contain a special character'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    setChangingPw(true);
    try {
      await apiClient.put('/admin/change-password', { currentPassword, newPassword });
      pushToast('Password changed. Logging out...', 'success');
      setTimeout(() => {
        localStorage.removeItem('prepnest_token');
        localStorage.removeItem('prepnest_user');
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err: any) {
      setPwError(err?.response?.data?.message || 'Failed to change password');
    } finally { setChangingPw(false); }
  };

  const handleLogout = () => {
    setLoggingOut(true);
    localStorage.removeItem('prepnest_token');
    localStorage.removeItem('prepnest_user');
    navigate('/login', { replace: true });
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'about', label: 'About', icon: Info },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'privacy', label: 'Privacy', icon: FileText },
    { id: 'terms', label: 'Terms', icon: BookOpen },
    { id: 'system', label: 'System Info', icon: Server },
  ];

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <Button variant="danger" onClick={() => setShowSidebarLogout(true)} className="flex items-center gap-2">
          <LogOut size={16} /> Logout
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <nav className="space-y-1 rounded-[16px] border border-slate-200 bg-white p-2 shadow-soft">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.id ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}>
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
            <button onClick={() => setShowLogoutDialog(true)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition">
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          {activeTab === 'profile' && (
            <SectionCard title="My Profile" icon={User} id="profile">
              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-50">
                    {editProfileImage ? <img src={editProfileImage} alt="Profile" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-slate-400"><User size={36} /></div>}
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition hover:bg-black/30">
                      <Camera size={20} className="text-white opacity-0 transition hover:opacity-100" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <span className="text-xs text-slate-400">Click to change photo</span>
                </div>
                <div className="flex-1 space-y-4">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Full Name</span>
                    <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Display Name</span>
                    <Input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} placeholder="Optional display name" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Email</span>
                    <Input value={profile?.email || ''} readOnly className="bg-slate-50 text-slate-500" />
                  </label>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoRow label="Admin Role" value={profile?.role || '-'} />
                <InfoRow label="Account Status" value={
                  profile?.isVerified ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={14} /> Verified</span>
                    : <span className="flex items-center gap-1 text-red-600"><XCircle size={14} /> Unverified</span>
                } />
                <InfoRow label="Created" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'} />
                <InfoRow label="Last Login" value={profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Never'} />
              </div>
              <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
                <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                <Button variant="secondary" onClick={() => { setEditFullName(profile?.fullName || ''); setEditDisplayName(profile?.displayName || ''); setEditProfileImage(profile?.profileImage ?? null); }}>
                  Cancel
                </Button>
              </div>
            </SectionCard>
          )}

          {activeTab === 'password' && (
            <SectionCard title="Change Password" icon={Lock} id="password">
              <div className="space-y-4 max-w-md">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700">Current Password</span>
                  <div className="relative">
                    <Input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type={showPw.current ? 'text' : 'password'} placeholder="Enter current password" className="pr-10" />
                    <button type="button" onClick={() => setShowPw({ ...showPw, current: !showPw.current })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700">New Password</span>
                  <div className="relative">
                    <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type={showPw.new ? 'text' : 'password'} placeholder="Min 8 chars, uppercase, lowercase, number, special" className="pr-10" />
                    <button type="button" onClick={() => setShowPw({ ...showPw, new: !showPw.new })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700">Confirm Password</span>
                  <div className="relative">
                    <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type={showPw.confirm ? 'text' : 'password'} placeholder="Re-enter new password" className="pr-10" />
                    <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                <div className="text-xs text-slate-400 space-y-0.5">
                  <p className={newPassword.length >= 8 ? 'text-emerald-600' : ''}>✓ At least 8 characters</p>
                  <p className={/[A-Z]/.test(newPassword) ? 'text-emerald-600' : ''}>✓ One uppercase letter</p>
                  <p className={/[a-z]/.test(newPassword) ? 'text-emerald-600' : ''}>✓ One lowercase letter</p>
                  <p className={/[0-9]/.test(newPassword) ? 'text-emerald-600' : ''}>✓ One number</p>
                  <p className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600' : ''}>✓ One special character</p>
                </div>
                {pwError ? <p className="text-sm text-red-600">{pwError}</p> : null}
                <Button onClick={handleChangePassword} disabled={changingPw}>{changingPw ? 'Changing...' : 'Change Password'}</Button>
              </div>
            </SectionCard>
          )}

          {activeTab === 'security' && (
            <SectionCard title="Security" icon={Shield} id="security">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Current Session</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label="Login Time" value={session?.loginTime ? new Date(session.loginTime).toLocaleString() : '-'} />
                  <InfoRow label="Browser" value={session?.browser || '-'} />
                  <InfoRow label="Device" value={session?.device || '-'} />
                  <InfoRow label="Session" value={session?.sessionId || 'Current'} />
                </div>
                <div className="flex gap-3 border-t border-slate-100 pt-4">
                  <Button variant="danger" onClick={() => setShowLogoutDialog(true)} className="flex items-center gap-2">
                    <LogOut size={16} /> Logout Current Device
                  </Button>
                  <Button variant="danger" onClick={() => setShowLogoutAllDialog(true)} className="flex items-center gap-2">
                    <LogOut size={16} /> Logout All Devices
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'about' && (
            <SectionCard title="About PrepNest" icon={Info} id="about">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                    <BookOpen size={24} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">PrepNest Admin CMS</p>
                    <p className="text-xs text-slate-400">Version 1.0.0</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  PrepNest is a learning management platform that allows administrators to manage Notes, PDFs, MCQs,
                  Mock Tests, Daily Challenges, Interview Preparation, Technical Preparation, Aptitude Preparation
                  and Notifications.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label="Version" value="1.0.0" />
                  <InfoRow label="Build" value="1.0.0" />
                  <InfoRow label="Developer" value="PrepNest Team" />
                  <InfoRow label="License" value="MIT" />
                  <InfoRow label="Copyright" value="© 2026 PrepNest. All rights reserved." />
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'contact' && (
            <SectionCard title="Contact & Support" icon={Mail} id="contact">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label="Support Email" value={<a href="mailto:support@prepnest.com" className="text-brand-600 hover:underline">support@prepnest.com</a>} />
                  <InfoRow label="Developer Email" value={<a href="mailto:admin@prepnest.com" className="text-brand-600 hover:underline">admin@prepnest.com</a>} />
                  <InfoRow label="GitHub" value={<a href="#" className="flex items-center gap-1 text-brand-600 hover:underline"><Github size={14} /> prepnest</a>} />
                  <InfoRow label="Website" value={<a href="#" className="flex items-center gap-1 text-brand-600 hover:underline"><Globe size={14} /> prepnest.com</a>} />
                  <InfoRow label="Support Hours" value="Mon-Fri, 9:00 AM - 6:00 PM IST" />
                </div>
                <div className="flex gap-3 border-t border-slate-100 pt-4">
                  <Button onClick={() => window.location.href = 'mailto:support@prepnest.com'} className="flex items-center gap-2">
                    <Mail size={16} /> Contact Support
                  </Button>
                  <Button variant="secondary" onClick={() => window.location.href = 'mailto:admin@prepnest.com?subject=Bug Report'} className="flex items-center gap-2">
                    <HelpCircle size={16} /> Report Bug
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'privacy' && (
            <SectionCard title="Privacy Policy" icon={FileText} id="privacy">
              <div className="prose prose-sm max-w-none space-y-4 text-slate-600">
                <Section><h3 className="text-sm font-semibold text-slate-900">Data Collection</h3><p>We collect only the minimum data necessary to operate the platform: name, email, and profile information provided voluntarily by administrators and users. No sensitive personal data is collected without explicit consent.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">User Privacy</h3><p>User data is never shared with third parties. All data is stored securely and accessed only by authorized administrators for platform management purposes.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Cookies</h3><p>We use essential cookies for authentication (JWT tokens) and session management. No tracking or analytics cookies are used without consent.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Authentication</h3><p>All authentication is handled securely using bcrypt password hashing and JWT tokens. Email OTP verification via Brevo ensures only verified accounts can access the platform.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Data Security</h3><p>Data is encrypted in transit via HTTPS and at rest in the database. Passwords are hashed using bcrypt with 12 salt rounds. API keys and secrets are stored as environment variables.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Account Deletion</h3><p>Administrators can request account deletion by contacting support. Upon deletion, all associated data is permanently removed from the database within 30 days.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Contact Information</h3><p>For privacy-related inquiries, contact us at <a href="mailto:support@prepnest.com" className="text-brand-600 hover:underline">support@prepnest.com</a>.</p></Section>
              </div>
            </SectionCard>
          )}

          {activeTab === 'terms' && (
            <SectionCard title="Terms & Conditions" icon={BookOpen} id="terms">
              <div className="prose prose-sm max-w-none space-y-4 text-slate-600">
                <Section><h3 className="text-sm font-semibold text-slate-900">Acceptable Use</h3><p>Administrators must use PrepNest solely for educational content management. Misuse of admin privileges, unauthorized access, or any activity that disrupts platform operations is strictly prohibited.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Administrator Responsibilities</h3><p>Admins are responsible for maintaining the confidentiality of their login credentials, ensuring content accuracy, and managing user data in compliance with applicable privacy laws.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Content Management</h3><p>All content uploaded to PrepNest must be appropriate for educational purposes. Administrators must not upload copyrighted material without authorization or any content that violates laws or regulations.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Intellectual Property</h3><p>PrepNest and its original content, features, and functionality are owned by the development team. The platform name, logo, and design cannot be used without permission.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Security</h3><p>Administrators must report any security vulnerabilities immediately. Attempting to breach platform security, access other users' data, or perform unauthorized actions will result in immediate account suspension.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Account Suspension</h3><p>PrepNest reserves the right to suspend or terminate admin accounts for violation of these terms, unauthorized access, or any activity deemed harmful to the platform or its users.</p></Section>
                <Section><h3 className="text-sm font-semibold text-slate-900">Legal Disclaimer</h3><p>PrepNest is provided "as is" without warranty of any kind. The development team is not liable for any damages arising from the use of this platform. Users assume all responsibility for their use of the service.</p></Section>
              </div>
            </SectionCard>
          )}

          {activeTab === 'system' && (
            <SectionCard title="System Information" icon={Server} id="system">
              <div className="grid gap-3 sm:grid-cols-2">
                {systemInfo && Object.entries(systemInfo).map(([key, value]) => (
                  <InfoRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    value={typeof value === 'object' ? `${value.name} (${value.version})` : String(value)} />
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <ConfirmDialog open={showLogoutDialog} title="Logout" message="Are you sure you want to logout from PrepNest Admin?" confirmLabel="Logout" onConfirm={() => { setShowLogoutDialog(false); handleLogout(); }} onCancel={() => setShowLogoutDialog(false)} />
      <ConfirmDialog open={showLogoutAllDialog} title="Logout All Devices" message="This will logout all active sessions. You will need to login again on every device." confirmLabel="Logout All" onConfirm={async () => { setShowLogoutAllDialog(false); try { await apiClient.post('/admin/logout-all'); } catch { /* intentionally ignored */ } handleLogout(); }} onCancel={() => setShowLogoutAllDialog(false)} />
      <ConfirmDialog open={showSidebarLogout} title="Logout" message="Are you sure you want to logout from PrepNest Admin?" confirmLabel="Logout" onConfirm={() => { setShowSidebarLogout(false); handleLogout(); }} onCancel={() => setShowSidebarLogout(false)} />
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}