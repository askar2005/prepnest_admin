import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/common/ToastHost';
import { AdminShell } from '../components/layout/AdminShell';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { VerifyResetOtpPage } from '../pages/auth/VerifyResetOtpPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { CmsPage } from '../pages/cms/CmsPage';
import { UsersPage } from '../pages/users/UsersPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import PreparationModulePage from '../pages/preparation/PreparationModulePage';
import TopicWorkspacePage from '../pages/preparation/TopicWorkspacePage';
import MockTestsPage from '../pages/modules/mock-tests';
import DailyChallengeManagementPage from '../pages/daily-challenge/DailyChallengeManagementPage';
import ImportantNotificationsPage from '../pages/modules/important-notifications';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<AdminShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/preparation/:category" element={<PreparationModulePage />} />
          <Route path="/preparation/:category/topics/:topicId" element={<TopicWorkspacePage />} />
          <Route path="/mock-tests" element={<MockTestsPage />} />
          <Route path="/daily-challenge" element={<DailyChallengeManagementPage />} />
          <Route path="/important-notifications" element={<ImportantNotificationsPage />} />
          <Route path="/cms/:resource" element={<CmsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
