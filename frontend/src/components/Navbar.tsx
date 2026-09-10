import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/useLanguage';
import type { Language } from '../i18n/translations';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Globe, Wifi, WifiOff, Bell, User, LogOut, Shield, UserCheck } from 'lucide-react';
import { getOfflineQueue, syncOfflineQueue } from '../services/offline';
import { apiRequest } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue().then(() => setQueueCount(getOfflineQueue().length));
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setQueueCount(getOfflineQueue().length);
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000); // poll every 5s for new notifications

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [user?.role]);

  const fetchNotifications = async () => {
    try {
      const res = await apiRequest('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // Ignore background fetch errors
    }
  };

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      setUnreadCount(0);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const formatRoleLabel = (roleStr?: string) => {
    if (!roleStr) return 'User';
    switch (roleStr) {
      case 'PATIENT': return 'Patient / Resident';
      case 'HEALTH_WORKER': return 'ASHA / Health Worker';
      case 'SPECIALIST': return 'District Specialist';
      case 'LAB_TECHNICIAN': return 'Lab Tech';
      case 'PHARMACIST': return 'Pharmacist';
      case 'FACILITY_ADMIN': return 'Facility Admin';
      case 'SYSTEM_ADMIN': return 'System Admin';
      case 'DOCTOR': return 'PHC Doctor';
      default: return roleStr;
    }
  };

  return (
    <header style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.75rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      {/* Brand */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
        }}>
          <Activity size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)', lineHeight: 1, margin: 0 }}>
            {t('appName')}
          </h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>
            {t('tagline')}
          </p>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Offline Sync Indicator */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: isOnline ? 'var(--routine-bg)' : 'var(--urgent-bg)',
          color: isOnline ? 'var(--routine-text)' : 'var(--urgent-text)',
          border: `1px solid ${isOnline ? 'var(--routine-border)' : 'var(--urgent-border)'}`,
        }}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? t('online') : `${t('offline')} (${queueCount})`}</span>
        </div>

        {/* Notifications Bell Button & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            style={{
              position: 'relative',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.4rem 0.6rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 800,
                borderRadius: '999px',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifMenu && (
            <div className="glass-card fade-in" style={{
              position: 'absolute',
              right: 0,
              top: '45px',
              width: '340px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 2000,
              padding: '1rem',
              boxShadow: 'var(--shadow-xl)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--primary-800)' }}>Notifications</strong>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No notifications yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: n.isRead ? 'var(--bg-card)' : 'var(--primary-50)',
                      border: `1px solid ${n.isRead ? 'var(--border-color)' : 'var(--primary-100)'}`,
                    }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        {n.title}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                        {n.message}
                      </p>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Language Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--bg-card)', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Globe size={16} color="var(--text-muted)" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="ur">اردو (Urdu)</option>
          </select>
        </div>

        {/* Active Authenticated User Profile & Logout */}
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'var(--primary-50)',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid var(--primary-200)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              title="View & Edit My Profile"
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}>
                {user.firstName ? user.firstName[0] : 'U'}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                  {user.firstName} {user.lastName}
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--primary-700)' }}>
                  {formatRoleLabel(user.role)}
                </span>
              </div>
            </Link>

            <button
              onClick={handleLogoutClick}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.4rem 0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#dc2626',
              }}
              title="Sign Out"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              to="/login"
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
