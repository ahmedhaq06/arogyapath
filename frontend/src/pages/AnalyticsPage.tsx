import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { BarChart3, Users, Building2, GitPullRequest, Activity, ShieldCheck } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await apiRequest('/analytics/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart3 size={28} color="var(--primary-600)" />
          <span>System Analytics & Audit Dashboard</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          High-level oversight of healthcare continuum utilization, referral flows, and security compliance
        </p>
      </div>

      {loading ? <p>Loading analytics data...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Key Metric Cards */}
          <div className="grid-4">
            <div className="glass-card">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Patients Enrolled</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>{data?.metrics?.totalPatients || 0}</h3>
            </div>

            <div className="glass-card">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Facilities</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>{data?.metrics?.totalFacilities || 0}</h3>
            </div>

            <div className="glass-card">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inter-Facility Referrals</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>{data?.metrics?.totalReferrals || 0}</h3>
            </div>

            <div className="glass-card">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Triage Assessments</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>{data?.metrics?.totalTriageAssessments || 0}</h3>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid-2">
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Referrals Status Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(data?.breakdowns?.referralsByStatus || {}).map(([status, count]: [string, any]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <strong>{status.replace('_', ' ')}</strong>
                    <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Triage Risk Category Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(data?.breakdowns?.triageByCategory || {}).map(([cat, count]: [string, any]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <strong>{cat}</strong>
                    <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
