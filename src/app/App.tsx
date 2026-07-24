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
import GatePreparationPage from '../pages/modules/gate-preparation';
import AptitudePreparationPage from '../pages/modules/aptitude-preparation';
import InterviewPreparationPage from '../pages/modules/interview-preparation';
import TechnicalPreparationPage from '../pages/modules/technical-preparation';
import MockTestsPage from '../pages/modules/mock-tests';
import DailyChallengePage from '../pages/modules/daily-challenge';
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
          <Route path="/gate-preparation" element={<GatePreparationPage />} />
          <Route path="/aptitude-preparation" element={<AptitudePreparationPage />} />
          <Route path="/interview-preparation" element={<InterviewPreparationPage />} />
          <Route path="/technical-preparation" element={<TechnicalPreparationPage />} />
          <Route path="/mock-tests" element={<MockTestsPage />} />
          <Route path="/daily-challenge" element={<DailyChallengePage />} />
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
