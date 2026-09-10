import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { HeartPulse, Stethoscope, Wifi, Plus, Users, AlertTriangle, UserPlus, CheckCircle } from 'lucide-react';
import { getOfflineQueue, queueOfflineAction } from '../services/offline';

export const HealthWorkerDashboard: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [offlineCount, setOfflineCount] = useState(0);

  // New Patient Form State
  const [showRegModal, setShowRegModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [sex, setSex] = useState('female');
  const [village, setVillage] = useState('Rampur');
  const [district, setDistrict] = useState('Sitapur');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchPatients();
    setOfflineCount(getOfflineQueue().length);
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await apiRequest('/patients');
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (navigator.onLine) {
        await apiRequest('/patients', {
          method: 'POST',
          body: JSON.stringify({ firstName, lastName, phone, sex, village, district }),
        });
        setStatusMsg(`Successfully registered new resident ${firstName} ${lastName}!`);
      } else {
        queueOfflineAction('vitals', 'CREATE', { firstName, lastName, phone, sex, village, district });
        setStatusMsg(`Offline mode: Saved resident ${firstName} ${lastName} to local queue.`);
      }

      setShowRegModal(false);
      setFirstName('');
      setLastName('');
      setPhone('');
      fetchPatients();
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HeartPulse size={28} color="var(--primary-600)" />
            <span>Community Health Worker (ASHA / ANM) Field Workbench</span>
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Operational Field Portal: Village Registration, Door-to-Door Screening, Offline Data Sync
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowRegModal(true)}>
          <UserPlus size={18} />
          <span>Register New Resident</span>
        </button>
      </div>

      {statusMsg && (
        <div style={{ padding: '1rem', background: 'var(--routine-bg)', color: 'var(--routine-text)', border: '1px solid var(--routine-border)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} />
          <strong>{statusMsg}</strong>
        </div>
      )}

      {/* Register Resident Modal */}
      {showRegModal && (
        <div className="glass-card fade-in" style={{ marginBottom: '2rem', borderLeft: '6px solid var(--primary-500)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Register Village Resident (Door-to-Door Intake)</h3>
          <form onSubmit={handleRegisterPatient}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="e.g. Kamla" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="e.g. Devi" />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-98765..." />
              </div>
              <div className="form-group">
                <label className="form-label">Sex</label>
                <select className="form-select" value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Village</label>
                <input type="text" className="form-input" value={village} onChange={(e) => setVillage(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowRegModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Registering...' : 'Save Resident Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Residents</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{patients.length} Residents</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--urgent-bg)', color: 'var(--urgent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wifi size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Offline Sync Queue</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{offlineCount} Queue Items</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--emergency-bg)', color: 'var(--emergency-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Flagged High Risk</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>1 Patient</h3>
          </div>
        </div>
      </div>

      {/* Registered Patients List */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Rampur Village Household Registry</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {patients.map((pat) => (
            <div key={pat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>{pat.user?.firstName} {pat.user?.lastName}</strong> ({pat.patientId})
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Village: {pat.village || 'Rampur'} | Sex: {pat.sex || 'Female'}</div>
              </div>
              <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem' }} onClick={() => window.location.href = '/triage'}>
                <Stethoscope size={14} /> Screen Symptoms
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
