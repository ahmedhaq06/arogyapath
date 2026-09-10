import { useState, useEffect, FormEvent } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { GitPullRequest, Plus, CheckCircle, Clock, FileText } from 'lucide-react';

export const ReferralWizard = () => {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);

  // Form State
  const [patientId, setPatientId] = useState('');
  const [referringFacilityId, setReferringFacilityId] = useState('');
  const [receivingFacilityId, setReceivingFacilityId] = useState('');
  const [urgency, setUrgency] = useState('urgent');
  const [reason, setReason] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [facilitiesList, setFacilitiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReferrals();
    fetchFormOptions();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await apiRequest('/referrals');
      setReferrals(res.data.referrals || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [patRes, facRes] = await Promise.all([
        apiRequest('/patients'),
        apiRequest('/facilities'),
      ]);
      setPatientsList(patRes.data.patients || []);
      setFacilitiesList(facRes.data.facilities || []);

      if (patRes.data.patients?.length > 0) setPatientId(patRes.data.patients[0].id);
      if (facRes.data.facilities?.length > 0) setReferringFacilityId(facRes.data.facilities[0].id);
      if (facRes.data.facilities?.length > 1) setReceivingFacilityId(facRes.data.facilities[1].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReferral = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('/referrals', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          referringFacilityId,
          receivingFacilityId,
          urgency,
          reason,
          clinicalSummary,
        }),
      });
      alert('Referral created and submitted successfully!');
      setView('list');
      fetchReferrals();
    } catch (err: any) {
      alert(err.message || 'Failed to create referral');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedReferral) return;
    try {
      const res = await apiRequest(`/referrals/${selectedReferral.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, notes: `Status transitioned to ${newStatus}` }),
      });
      setSelectedReferral({ ...selectedReferral, status: res.data.status });
      fetchReferrals();
    } catch (err: any) {
      alert(err.message || 'Failed status update');
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GitPullRequest size={28} color="var(--primary-600)" />
            <span>Referral Lifecycle Manager & Continuum Tracker</span>
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Full Referral Chain: Community → Sub-Centre → PHC → CHC → District Hospital
          </p>
        </div>

        {view === 'list' && (
          <button className="btn btn-primary" onClick={() => setView('create')}>
            <Plus size={18} />
            <span>New Referral</span>
          </button>
        )}

        {view !== 'list' && (
          <button className="btn btn-secondary" onClick={() => setView('list')}>
            Back to List
          </button>
        )}
      </div>

      {/* CREATE REFERRAL VIEW */}
      {view === 'create' && (
        <div className="glass-card fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create Inter-Facility Referral</h3>

          <form onSubmit={handleCreateReferral}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select className="form-select" value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user?.firstName} {p.user?.lastName} ({p.patientId || p.village})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Urgency Level</label>
                <select className="form-select" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                  <option value="emergency">🚨 EMERGENCY (Immediate)</option>
                  <option value="urgent">⚡ URGENT (Within 24 Hours)</option>
                  <option value="routine">📋 ROUTINE (Standard Specialist Consultation)</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Referring Facility (Origin)</label>
                <select className="form-select" value={referringFacilityId} onChange={(e) => setReferringFacilityId(e.target.value)} required>
                  {facilitiesList.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} (Level {f.level})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Receiving Facility (Destination)</label>
                <select className="form-select" value={receivingFacilityId} onChange={(e) => setReceivingFacilityId(e.target.value)} required>
                  {facilitiesList.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} (Level {f.level})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Referral</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Persistent high fever, platelets dropped to 75k, requiring specialist infectious disease evaluation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Summary & Initial Treatment Provided</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Vitals recorded: Temp 102.4°F, BP 130/85. Paracetamol given, blood smear drawn..."
                value={clinicalSummary}
                onChange={(e) => setClinicalSummary(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Referral'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REFERRAL LIST VIEW */}
      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {referrals.map((ref) => (
            <div key={ref.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-700)' }}>
                    {ref.referralId}
                  </span>
                  <StatusBadge status={ref.status} />
                  <span className="badge badge-urgent" style={{ fontSize: '0.65rem' }}>{ref.urgency}</span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Patient: {ref.patient?.user?.firstName} {ref.patient?.user?.lastName}
                </h3>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  🏢 <strong>{ref.referringFacility?.name}</strong> ➔ 🏥 <strong>{ref.receivingFacility?.name}</strong>
                </p>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.375rem' }}>
                  <strong>Reason:</strong> {ref.reason}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => { setSelectedReferral(ref); setView('detail'); }}>
                  <FileText size={16} />
                  <span>Timeline & Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REFERRAL DETAIL & TIMELINE VIEW */}
      {view === 'detail' && selectedReferral && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="fade-in">
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Referral ID: {selectedReferral.referralId}</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  Patient: {selectedReferral.patient?.user?.firstName} {selectedReferral.patient?.user?.lastName}
                </h3>
              </div>
              <StatusBadge status={selectedReferral.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat( auto-fit, minmax(220px, 1fr) )', gap: '1rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Referring Origin</span>
                <div style={{ fontWeight: 700 }}>{selectedReferral.referringFacility?.name}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receiving Destination</span>
                <div style={{ fontWeight: 700 }}>{selectedReferral.receivingFacility?.name}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created At</span>
                <div style={{ fontWeight: 600 }}>{new Date(selectedReferral.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Reason for Referral</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{selectedReferral.reason}</p>
            </div>

            {/* Lifecycle Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>Update Status:</span>
              {['SUBMITTED', 'ACCEPTED', 'APPOINTMENT_SCHEDULED', 'IN_TRANSIT', 'ARRIVED', 'UNDER_REVIEW', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  className={`btn ${selectedReferral.status === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
