import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Pill, Check } from 'lucide-react';

export const PrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await apiRequest('/prescriptions');
      setPrescriptions(res.data.prescriptions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (id: string) => {
    try {
      await apiRequest(`/prescriptions/${id}/dispense`, { method: 'PATCH' });
      alert('Medication dispensed!');
      fetchPrescriptions();
    } catch (err: any) {
      alert(err.message || 'Dispense failed');
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Pill size={28} color="var(--primary-600)" />
          <span>Pharmacy & Prescription Dispensing</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage e-prescriptions, dosage instructions, and dispensing status
        </p>
      </div>

      {loading ? <p>Loading prescriptions...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {prescriptions.map((rx) => (
            <div key={rx.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-700)' }}>{rx.prescriptionId}</span>
                  <StatusBadge status={rx.dispensingStatus || 'dispensed'} />
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Patient: {rx.patient?.user?.firstName} {rx.patient?.user?.lastName}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Prescribed by: {rx.provider?.user?.firstName} {rx.provider?.user?.lastName}
                </p>

                <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Medications:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.375rem' }}>
                    {rx.items?.map((item: any) => (
                      <div key={item.id} style={{ fontSize: '0.85rem' }}>
                        <strong style={{ color: 'var(--primary-700)' }}>{item.medicineName}</strong> — {item.dosage} ({item.frequency}, {item.duration})
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {rx.dispensingStatus !== 'dispensed' && (
                <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => handleDispense(rx.id)}>
                  <Check size={16} /> Mark as Dispensed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
