import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Users, Stethoscope, GitPullRequest, Activity, Plus, CheckCircle, FileText, FlaskConical, Pill } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Consultation Modal State
  const [activePatient, setActivePatient] = useState<any>(null);
  const [chiefComplaint, setChiefComplaint] = useState('High grade fever with chills for 4 days');
  const [presentIllness, setPresentIllness] = useState('Patient reports sudden onset high fever, severe headache, and body aches.');
  const [diagnosis, setDiagnosis] = useState('Plasmodium Falciparum Malaria');
  const [diagnosisCode, setDiagnosisCode] = useState('B50.9');
  const [temp, setTemp] = useState('102.4');
  const [systolic, setSystolic] = useState('130');
  const [diastolic, setDiastolic] = useState('85');
  const [spo2, setSpo2] = useState('97');
  const [orderCbc, setOrderCbc] = useState(true);
  const [orderMalaria, setOrderMalaria] = useState(true);
  const [medicine, setMedicine] = useState('Artemether + Lumefantrine');
  const [dosage, setDosage] = useState('1 tablet twice daily for 3 days');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patRes, refRes] = await Promise.all([
        apiRequest('/patients'),
        apiRequest('/referrals'),
      ]);
      setPatients(patRes.data.patients || []);
      setReferrals(refRes.data.referrals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;
    setSubmitting(true);
    try {
      // 1. Create Encounter with Vitals
      await apiRequest('/encounters', {
        method: 'POST',
        body: JSON.stringify({
          patientId: activePatient.id,
          facilityId: activePatient.facilityId || 'phc-kesariya-id',
          chiefComplaint,
          presentIllness,
          diagnosis,
          diagnosisCode,
          vitals: { temperature: temp, systolic, diastolic, spo2 },
          diagnoses: [{ name: diagnosis, code: diagnosisCode }],
        }),
      });

      // 2. Order Diagnostics if checked
      if (orderCbc) {
        await apiRequest('/diagnostics/orders', {
          method: 'POST',
          body: JSON.stringify({
            patientId: activePatient.id,
            facilityId: activePatient.facilityId || 'phc-kesariya-id',
            testName: 'Complete Blood Count (CBC)',
            priority: 'urgent',
            reason: 'Rule out severe anemia and thrombocytopenia',
          }),
        });
      }

      if (orderMalaria) {
        await apiRequest('/diagnostics/orders', {
          method: 'POST',
          body: JSON.stringify({
            patientId: activePatient.id,
            facilityId: activePatient.facilityId || 'phc-kesariya-id',
            testName: 'Blood Smear for Malaria',
            priority: 'urgent',
            reason: 'Detect malaria parasites',
          }),
        });
      }

      // 3. Issue Prescription
      await apiRequest('/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: activePatient.id,
          notes: 'Full antimalarial course',
          items: [{ medicineName: medicine, dosage, frequency: 'Twice daily', duration: '3 days' }],
        }),
      });

      setSuccessMsg(`Clinical Consultation completed for ${activePatient.user?.firstName}! Encounter, Vitals, Lab Orders & Prescription saved.`);
      setActivePatient(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save encounter');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Stethoscope size={28} color="var(--primary-600)" />
          <span>Doctor Consultation Workbench (PHC Medical Officer)</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Operational Clinical Tool: Conduct Consultations, Record Vitals, Issue Lab Orders & E-Prescriptions
        </p>
      </div>

      {successMsg && (
        <div style={{ padding: '1rem', background: 'var(--routine-bg)', color: 'var(--routine-text)', border: '1px solid var(--routine-border)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} />
          <strong>{successMsg}</strong>
        </div>
      )}

      {/* Metrics Header */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Patients Waiting in Queue</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>{patients.length}</h3>
        </div>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Urgent Triage Flagged</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--emergency-badge)' }}>1 High Risk</h3>
        </div>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Referral Network</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>{referrals.length}</h3>
        </div>
      </div>

      {/* Patient Queue & Workbench */}
      <div className="grid-2">
        {/* Patient Queue */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Outpatient Consultation Queue</h3>
          {loading ? <p>Loading queue...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {patients.map((pat) => (
                <div key={pat.id} style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '1rem' }}>{pat.user?.firstName} {pat.user?.lastName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({pat.patientId})</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      📍 Village: {pat.village || 'Rampur'} | Sex: {pat.sex || 'Male'}
                    </p>
                  </div>

                  <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => { setActivePatient(pat); setSuccessMsg(''); }}>
                    <Stethoscope size={16} /> Start Consultation
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Working Consultation Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Clinical Encounter Form</h3>
          {activePatient ? (
            <form onSubmit={handleSaveEncounter}>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--primary-50)', border: '1px solid var(--primary-100)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--primary-800)' }}>
                  Patient: {activePatient.user?.firstName} {activePatient.user?.lastName} ({activePatient.patientId})
                </strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Village: {activePatient.village || 'Rampur'}</div>
              </div>

              {/* Vitals Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Record Patient Vitals</label>
                <div className="grid-2">
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Temp (°F)</label>
                    <input type="text" className="form-input" value={temp} onChange={(e) => setTemp(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BP (Systolic / Diastolic)</label>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <input type="text" className="form-input" value={systolic} onChange={(e) => setSystolic(e.target.value)} placeholder="120" />
                      <input type="text" className="form-input" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} placeholder="80" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Complaint & Diagnosis */}
              <div className="form-group">
                <label className="form-label">Chief Complaint</label>
                <input type="text" className="form-input" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Diagnosis</label>
                  <input type="text" className="form-input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">ICD-10 Code</label>
                  <input type="text" className="form-input" value={diagnosisCode} onChange={(e) => setDiagnosisCode(e.target.value)} />
                </div>
              </div>

              {/* Order Lab Tests Checkboxes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Order Laboratory Diagnostics</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={orderCbc} onChange={(e) => setOrderCbc(e.target.checked)} /> Complete Blood Count (CBC)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={orderMalaria} onChange={(e) => setOrderMalaria(e.target.checked)} /> Blood Smear for Malaria
                  </label>
                </div>
              </div>

              {/* E-Prescription */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Issue E-Prescription</label>
                <input type="text" className="form-input" value={medicine} onChange={(e) => setMedicine(e.target.value)} placeholder="Medicine Name" required style={{ marginBottom: '0.5rem' }} />
                <input type="text" className="form-input" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Dosage & Instructions" required />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActivePatient(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Saving Encounter...' : 'Complete Encounter & Issue Orders'}
                </button>
              </div>
            </form>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Select a patient from the consultation queue on the left to start their encounter.</p>
          )}
        </div>
      </div>
    </div>
  );
};
