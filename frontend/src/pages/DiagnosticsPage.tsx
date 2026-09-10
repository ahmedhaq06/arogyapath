import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Microscope, CheckCircle2, FileText } from 'lucide-react';

export const DiagnosticsPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [parameterName, setParameterName] = useState('Hemoglobin');
  const [value, setValue] = useState('9.2');
  const [unit, setUnit] = useState('g/dL');
  const [referenceRange, setReferenceRange] = useState('13-17');
  const [isAbnormal, setIsAbnormal] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await apiRequest('/diagnostics/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await apiRequest(`/diagnostics/orders/${selectedOrder.id}/results`, {
        method: 'POST',
        body: JSON.stringify({ parameterName, value, unit, referenceRange, isAbnormal }),
      });
      alert('Diagnostic test result submitted successfully!');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to submit result');
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Microscope size={28} color="var(--primary-600)" />
          <span>Diagnostic Laboratory & Test Result Entry</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Process lab orders, record parameter values, flag abnormal findings
        </p>
      </div>

      <div className="grid-2">
        {/* Lab Orders Queue */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Pending Lab Orders</h3>
          {loading ? <p>Loading orders...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {orders.map((ord) => (
                <div key={ord.id} style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--primary-700)' }}>{ord.orderId}</strong>
                    <StatusBadge status={ord.status} />
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{ord.test?.name || 'Complete Blood Count (CBC)'}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Patient: {ord.patient?.user?.firstName} {ord.patient?.user?.lastName} | Facility: {ord.facility?.name}
                  </p>

                  <button className="btn btn-primary" style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.8rem' }} onClick={() => setSelectedOrder(ord)}>
                    Record Test Result
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Result Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Enter Diagnostic Results</h3>
          {selectedOrder ? (
            <form onSubmit={handleResultSubmit}>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--primary-100)' }}>
                <strong>Order:</strong> {selectedOrder.orderId} — {selectedOrder.test?.name}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Patient: {selectedOrder.patient?.user?.firstName} {selectedOrder.patient?.user?.lastName}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Parameter Name</label>
                <input type="text" className="form-input" value={parameterName} onChange={(e) => setParameterName(e.target.value)} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Measured Value</label>
                  <input type="text" className="form-input" value={value} onChange={(e) => setValue(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input type="text" className="form-input" value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reference Range</label>
                <input type="text" className="form-input" value={referenceRange} onChange={(e) => setReferenceRange(e.target.value)} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                <input type="checkbox" checked={isAbnormal} onChange={(e) => setIsAbnormal(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                <span style={{ color: isAbnormal ? 'var(--emergency-badge)' : 'var(--text-main)' }}>Flag as Abnormal / Critical Finding</span>
              </label>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Submit & Release Result
              </button>
            </form>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Select an order from the queue on the left to enter lab results.</p>
          )}
        </div>
      </div>
    </div>
  );
};
