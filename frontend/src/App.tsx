import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './i18n/useLanguage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserProfilePage } from './pages/UserProfilePage';

import { DoctorDashboard } from './pages/DoctorDashboard';
import { HealthWorkerDashboard } from './pages/HealthWorkerDashboard';
import { SpecialistDashboard } from './pages/SpecialistDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { TriageWizard } from './pages/TriageWizard';
import { FacilityDiscovery } from './pages/FacilityDiscovery';
import { ReferralWizard } from './pages/ReferralWizard';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

import './styles/tokens.css';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <main style={{ flex: 1, backgroundColor: 'var(--bg-app)', minHeight: 'calc(100vh - 65px)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<UserProfilePage />} />

              <Route path="/dashboard" element={<RoleDashboardSwitcher />} />
              <Route path="/patient" element={<PatientDashboard />} />
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/health-worker" element={<HealthWorkerDashboard />} />
              <Route path="/specialist" element={<SpecialistDashboard />} />
              
              <Route path="/triage" element={<TriageWizard />} />
              <Route path="/facilities" element={<FacilityDiscovery />} />
              <Route path="/referrals" element={<ReferralWizard />} />
              <Route path="/appointments" element={<DoctorDashboard />} />
              <Route path="/diagnostics" element={<DiagnosticsPage />} />
              <Route path="/prescriptions" element={<PrescriptionsPage />} />
              <Route path="/records" element={<PatientDashboard />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

const RoleDashboardSwitcher: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'PATIENT':
      return <PatientDashboard />;
    case 'HEALTH_WORKER':
    case 'NURSE':
      return <HealthWorkerDashboard />;
    case 'SPECIALIST':
      return <SpecialistDashboard />;
    case 'LAB_TECHNICIAN':
      return <DiagnosticsPage />;
    case 'PHARMACIST':
      return <PrescriptionsPage />;
    case 'FACILITY_ADMIN':
    case 'SYSTEM_ADMIN':
      return <AnalyticsPage />;
    case 'DOCTOR':
    default:
      return <DoctorDashboard />;
  }
};

export default App;
