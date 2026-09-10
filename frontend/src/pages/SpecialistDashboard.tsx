import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Stethoscope, GitPullRequest, Building2, CheckCircle2, Bed } from 'lucide-react';

export const SpecialistDashboard: React.FC = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await apiRequest('/referrals');
      setReferrals(res.data.referrals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await apiRequest(`/referrals/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACCEPTED', notes: 'Accepted by Specialist Dr. Anjali Mehta' }),
      });
      alert('Referral accepted!');
      fetchReferrals();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Stethoscope size={28} color="var(--primary-600)" />
          <span>District Hospital Specialist Dashboard (Dr. Anjali Mehta)</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Tertiary Care Review: Specialist Consultation, Secondary/Tertiary Referral Review, Bed Admissions
        </p>
      </div>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Incoming Specialist Referrals</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>{referrals.length}</h3>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hospital Bed Capacity</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>45 / 200 Free</h3>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Urgent Inpatient Reviews</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--emergency-badge)' }}>1 Critical</h3>
        </div>
      </div>

      {/* Referral Queue */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Referrals Awaiting Specialist Review</h3>
        {loading ? <p>Loading referrals...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {referrals.map((ref) => (
              <div key={ref.id} style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-700)' }}>{ref.referralId}</span>
                  <StatusBadge status={ref.status} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Patient: {ref.patient?.user?.firstName} {ref.patient?.user?.lastName}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Referred From: <strong>{ref.referringFacility?.name}</strong> ➔ Destination: <strong>{ref.receivingFacility?.name}</strong>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-app)', borderRadius: '6px' }}>
                  <strong>Clinical Reason:</strong> {ref.reason}
                </p>

                {ref.status !== 'ACCEPTED' && (
                  <button className="btn btn-primary" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }} onClick={() => handleAccept(ref.id)}>
                    <CheckCircle2 size={16} /> Accept Referral & Reserve Bed
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
