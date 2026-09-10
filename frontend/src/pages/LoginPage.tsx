import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Activity, Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loggedUser = await login(email, password);
      redirectToDashboard(loggedUser.role);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (roleKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const demoUser = await loginAsDemo(roleKey);
      redirectToDashboard(demoUser.role);
    } catch (err: any) {
      setError('Demo login failed. Switching locally...');
    } finally {
      setLoading(false);
    }
  };

  const redirectToDashboard = (role: string) => {
    switch (role) {
      case 'PATIENT':
        navigate('/patient');
        break;
      case 'HEALTH_WORKER':
      case 'NURSE':
        navigate('/health-worker');
        break;
      case 'SPECIALIST':
        navigate('/specialist');
        break;
      case 'LAB_TECHNICIAN':
        navigate('/diagnostics');
        break;
      case 'PHARMACIST':
        navigate('/prescriptions');
        break;
      case 'FACILITY_ADMIN':
      case 'SYSTEM_ADMIN':
        navigate('/analytics');
        break;
      case 'DOCTOR':
      default:
        navigate('/doctor');
        break;
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--bg-app) 50%, var(--primary-100) 100%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '960px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '2rem',
        alignItems: 'stretch',
      }}>
        {/* Left Column: Brand & Portal Info */}
        <div className="glass-card" style={{
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,253,250,0.95))',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--primary-200)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
              }}>
                <Activity size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-800)', lineHeight: 1.1 }}>
                  ArogyaPath
                </h2>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-600)' }}>
                  आरोग्यपथ Healthcare Network
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              Unified Rural Health & Emergency Continuum
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Access patient records, instant symptom triage, tele-consultation queues, inter-facility referrals, and pharmacy inventory across India's healthcare tiers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {[
                'Instant Aadhaar-linked Patient Self-Service Portal',
                '3-Layer Clinical Triage & Risk Stratification',
                'Seamless Inter-Facility Bed Reservation & Referral Track',
                'Integrated E-Prescriptions & Diagnostic Lab Worklist',
              ].map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--primary-900)', fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="var(--primary-600)" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-100)',
            border: '1px solid var(--primary-200)',
            fontSize: '0.8rem',
            color: 'var(--primary-900)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              <ShieldCheck size={16} color="var(--primary-700)" />
              ABDM Compliant Healthcare Platform
            </div>
            <p style={{ margin: 0, opacity: 0.85, fontSize: '0.75rem' }}>
              End-to-end encrypted session auth & role-based privacy access control.
            </p>
          </div>
        </div>

        {/* Right Column: Login Form & Quick Role Access */}
        <div className="glass-card fade-in" style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          background: 'white',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Sign In to Your Account
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Enter your credentials to access your dedicated role workbench.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@demo.com or doctor@demo.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-700)', fontWeight: 700, textDecoration: 'none' }}>
              Register Here
            </Link>
          </div>

          <div style={{ margin: '1.5rem 0', position: 'relative', textAlign: 'center' }}>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />
            <span style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              padding: '0 0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}>
              OR QUICK DEMO ACCESS
            </span>
          </div>

          {/* Quick Demo Role Logins Grid */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-800)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={14} color="var(--primary-600)" />
              Select Role for 1-Click Evaluation Login:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {Object.keys(DEMO_USERS).map((roleKey) => (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => handleDemoClick(roleKey)}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--primary-200)',
                    background: 'var(--primary-50)',
                    color: 'var(--primary-800)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary-600)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--primary-50)';
                    e.currentTarget.style.color = 'var(--primary-800)';
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {DEMO_USERS[roleKey].label}
                  </span>
                  <User size={12} style={{ opacity: 0.7 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
