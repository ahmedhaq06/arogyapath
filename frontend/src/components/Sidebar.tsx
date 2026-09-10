import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/useLanguage';
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  GitPullRequest,
  Calendar,
  FlaskConical,
  Pill,
  FileText,
  BarChart3,
  UserCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  // Role-specific navigation links
  const getRoleLinks = () => {
    const profileLink = { to: '/profile', label: 'My Profile & Pass', icon: UserCheck };

    switch (user.role) {
      case 'PATIENT':
        return [
          { to: '/patient', label: 'My Health Portal', icon: LayoutDashboard },
          { to: '/triage', label: 'Self Symptom Triage', icon: Stethoscope },
          { to: '/facilities', label: 'Facility Search', icon: Building2 },
          { to: '/prescriptions', label: 'My Prescriptions', icon: Pill },
          profileLink,
        ];
      case 'HEALTH_WORKER':
      case 'NURSE':
        return [
          { to: '/health-worker', label: 'Village Screening', icon: LayoutDashboard },
          { to: '/triage', label: 'Symptom Triage Intake', icon: Stethoscope },
          { to: '/facilities', label: 'Find Health Centre', icon: Building2 },
          { to: '/referrals', label: 'Refer Patient', icon: GitPullRequest },
          profileLink,
        ];
      case 'DOCTOR':
        return [
          { to: '/doctor', label: 'Consultation Queue', icon: LayoutDashboard },
          { to: '/triage', label: 'Triage Assessment', icon: Stethoscope },
          { to: '/referrals', label: 'Inter-Facility Referrals', icon: GitPullRequest },
          { to: '/diagnostics', label: 'Order Lab Tests', icon: FlaskConical },
          { to: '/prescriptions', label: 'E-Prescriptions', icon: Pill },
          profileLink,
        ];
      case 'SPECIALIST':
        return [
          { to: '/specialist', label: 'District Referral Inbox', icon: LayoutDashboard },
          { to: '/referrals', label: 'Referral Lifecycle', icon: GitPullRequest },
          { to: '/facilities', label: 'Hospital Beds & Units', icon: Building2 },
          profileLink,
        ];
      case 'LAB_TECHNICIAN':
        return [
          { to: '/diagnostics', label: 'Lab Worklist & Results', icon: FlaskConical },
          profileLink,
        ];
      case 'PHARMACIST':
        return [
          { to: '/prescriptions', label: 'Pharmacy Dispensing', icon: Pill },
          profileLink,
        ];
      case 'FACILITY_ADMIN':
      case 'SYSTEM_ADMIN':
      default:
        return [
          { to: '/analytics', label: 'System Analytics', icon: BarChart3 },
          { to: '/facilities', label: 'Manage Facilities', icon: Building2 },
          { to: '/referrals', label: 'Referral Monitor', icon: GitPullRequest },
          profileLink,
        ];
    }
  };

  const links = getRoleLinks();

  return (
    <aside style={{
      width: '240px',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      padding: '1.25rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {user.role.replace('_', ' ')} WORKSPACE
        </span>
      </div>

      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: isActive ? 'var(--primary-600)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
              textDecoration: 'none',
              transition: 'var(--transition-fast)',
            })}
          >
            <Icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
};
