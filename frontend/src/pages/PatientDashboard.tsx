import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  User, Activity, Calendar, Pill, GitPullRequest, Plus, CheckCircle, Clock, MapPin,
  Building2, Stethoscope, Sparkles, Heart, Thermometer, Droplet, Shield, Printer,
  FileText, ArrowRight, CheckCircle2, ChevronRight, X
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [patientData, setPatientData] = useState<any>(null);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'book' | 'records'>('overview');

  // Print Health Pass Modal State
  const [showPrintPassModal, setShowPrintPassModal] = useState(false);

  // Book Appointment Form State
  const [facilityId, setFacilityId] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('09:30 - 10:00 AM');
  const [reason, setReason] = useState('');
  const [detectedDeptMsg, setDetectedDeptMsg] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');

  useEffect(() => {
    fetchPatientProfile();
    fetchFacilities();
    fetchAppointments();
  }, []);

  const fetchPatientProfile = async () => {
    try {
      const res = await apiRequest('/auth/me');
      const patId = res.data?.patient?.id;
      if (patId) {
        const recordsRes = await apiRequest(`/patients/${patId}/records`);
        setPatientData({ user: res.data, records: recordsRes.data });
      } else {
        setPatientData({ user: res.data, records: null });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await apiRequest('/facilities');
      setFacilities(res.data.facilities || []);
      if (res.data.facilities?.length > 0) setFacilityId(res.data.facilities[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await apiRequest('/appointments');
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Real-time Symptom-based Department Auto Detection
  const handleReasonChange = (text: string) => {
    setReason(text);
    const lower = text.toLowerCase();

    if (lower.includes('joint') || lower.includes('bone') || lower.includes('fracture') || lower.includes('knee') || lower.includes('back pain')) {
      setDepartment('Orthopedics & Rheumatology');
      setDetectedDeptMsg('Auto-Detected Specialty: Orthopedics & Rheumatology');
    } else if (lower.includes('child') || lower.includes('baby') || lower.includes('pediatric') || lower.includes('infant') || lower.includes('growth')) {
      setDepartment('Pediatrics');
      setDetectedDeptMsg('Auto-Detected Specialty: Pediatrics & Child Health');
    } else if (lower.includes('pregnant') || lower.includes('pregnancy') || lower.includes('period') || lower.includes('maternal') || lower.includes('mother')) {
      setDepartment('Obstetrics & Gynecology');
      setDetectedDeptMsg('Auto-Detected Specialty: Obstetrics & Gynecology');
    } else if (lower.includes('eye') || lower.includes('vision') || lower.includes('cataract') || lower.includes('blind')) {
      setDepartment('Ophthalmology');
      setDetectedDeptMsg('Auto-Detected Specialty: Ophthalmology (Eye Care)');
    } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('itching') || lower.includes('fungal')) {
      setDepartment('Dermatology');
      setDetectedDeptMsg('Auto-Detected Specialty: Dermatology (Skin Care)');
    } else if (lower.includes('tooth') || lower.includes('teeth') || lower.includes('gum') || lower.includes('dental')) {
      setDepartment('Dental Surgery');
      setDetectedDeptMsg('Auto-Detected Specialty: Dental Care');
    } else {
      setDepartment('General Medicine');
      setDetectedDeptMsg('');
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingSuccess('');

    try {
      const payload = {
        facilityId,
        department,
        appointmentDate,
        timeSlot,
        reason,
      };

      const res = await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setBookingSuccess(`Appointment #${res.data.appointmentId} confirmed successfully!`);
        fetchAppointments();
        setReason('');
        setActiveTab('overview');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to confirm appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading patient portal data...
      </div>
    );
  }

  const patient = patientData?.user?.patient || {};
  const userObj = patientData?.user || {};

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
            Patient Portal & Health Pass
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Welcome back, <strong>{userObj.firstName || 'Ramesh'} {userObj.lastName || 'Kumar'}</strong>. Access your consultations, vitals, & prescriptions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn"
            onClick={() => setShowPrintPassModal(true)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            <Printer size={16} color="var(--primary-600)" />
            <span>Print / Export Health Pass</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setActiveTab(activeTab === 'book' ? 'overview' : 'book')}
          >
            <Calendar size={18} />
            <span>{activeTab === 'book' ? 'Back to Overview' : 'Book New Appointment'}</span>
          </button>
        </div>
      </div>

      {bookingSuccess && (
        <div style={{ padding: '1rem', background: 'var(--routine-bg)', color: 'var(--routine-text)', border: '1px solid var(--routine-border)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} />
          <strong>{bookingSuccess}</strong>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
          style={{ fontSize: '0.85rem' }}
        >
          Portal Overview & Appointments
        </button>
        <button
          className={`btn ${activeTab === 'book' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('book')}
          style={{ fontSize: '0.85rem' }}
        >
          Book Outpatient Slot
        </button>
        <button
          className={`btn ${activeTab === 'records' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('records')}
          style={{ fontSize: '0.85rem' }}
        >
          My Health Story & EHR
        </button>
      </div>

      {/* TAB 1: OVERVIEW & APPOINTMENTS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Profile Quick Card */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', fontWeight: 800 }}>
                {userObj.firstName ? userObj.firstName[0] : 'R'}{userObj.lastName ? userObj.lastName[0] : 'K'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  {userObj.firstName || 'Ramesh'} {userObj.lastName || 'Kumar'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Patient ID: <strong>{patient.patientId || 'P-2026-0089'}</strong> | Aadhaar: <strong>{patient.insuranceId || '7849-2310-9012'}</strong> | Blood Group: <strong style={{ color: '#dc2626' }}>{patient.bloodGroup || 'O+'}</strong> | Village: <strong>{patient.village || 'Rampur'}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => window.location.href = '/triage'}>
                <Stethoscope size={16} /> Self-Symptom Screening
              </button>
            </div>
          </div>

          <div className="grid-2">
            {/* Upcoming Appointments */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} color="var(--primary-600)" />
                  <span>Confirmed Appointments</span>
                </h3>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setActiveTab('book')}>
                  + Book Slot
                </button>
              </div>

              {appointments.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No upcoming appointments booked.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {appointments.map((apt) => (
                    <div key={apt.id} style={{ padding: '0.85rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--primary-700)' }}>Apt #{apt.appointmentId || apt.id.slice(0, 8)}</strong>
                        <StatusBadge status={apt.status || 'SCHEDULED'} />
                      </div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.25rem 0' }}>🏥 {apt.facility?.name || 'Rampur Sub-Health Centre'}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        📅 Date: {new Date(apt.appointmentDate || Date.now()).toLocaleDateString()} | ⏰ {apt.timeSlot || '09:30 AM'} | Dept: <strong>{apt.department || 'General Medicine'}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Prescriptions */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill size={20} color="var(--primary-600)" />
                <span>My Active E-Prescriptions</span>
              </h3>
              {patientData?.records?.prescriptions?.length === 0 ? (
                <div style={{ padding: '1rem', background: 'var(--primary-50)', borderRadius: '8px', border: '1px solid var(--primary-200)', fontSize: '0.85rem', color: 'var(--primary-900)' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Rx #RX-2026-9812 (Active)</div>
                  <div>• Paracetamol 500mg — 1 Tablet after meals (3 Days)</div>
                  <div>• Cetirizine 10mg — 1 Tablet before sleep (3 Days)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Issued by Dr. Vikram Singh • Kesariya PHC</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {patientData?.records?.prescriptions?.map((rx: any) => (
                    <div key={rx.id} style={{ padding: '0.85rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '0.85rem' }}>Rx #{rx.prescriptionId}</strong>
                        <StatusBadge status={rx.dispensingStatus || 'dispensed'} />
                      </div>
                      {rx.items?.map((item: any) => (
                        <div key={item.id} style={{ fontSize: '0.85rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                          • {item.medicineName} ({item.dosage}) — {item.frequency}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOK CONSULTATION FORM */}
      {activeTab === 'book' && (
        <div className="glass-card fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={22} color="var(--primary-600)" />
            <span>Book Outpatient Consultation Slot</span>
          </h3>

          <form onSubmit={handleBookAppointment}>
            {/* Symptoms Input First for Auto-Detection */}
            <div className="form-group">
              <label className="form-label">Reason for Visit / Symptoms (Auto-Detects Specialty)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Type your symptoms (e.g. Joint pain, High fever, Child cough, Pregnancy checkup)..."
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                required
              />
              {detectedDeptMsg && (
                <div style={{ marginTop: '0.375rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Sparkles size={14} /> {detectedDeptMsg}
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Select Healthcare Facility</label>
                <select className="form-select" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} required>
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>{fac.name} (Level {fac.level} - {fac.village})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department / Service (Auto-Selected)</label>
                <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Orthopedics & Rheumatology">Orthopedics & Rheumatology</option>
                  <option value="Pediatrics">Pediatrics & Child Health</option>
                  <option value="Obstetrics & Gynecology">Obstetrics & Gynecology (Maternal Care)</option>
                  <option value="Ophthalmology">Ophthalmology (Eye Care)</option>
                  <option value="Dermatology">Dermatology (Skin Care)</option>
                  <option value="Dental Surgery">Dental Care</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Preferred Date</label>
                <input type="date" className="form-input" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot</label>
                <select className="form-select" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                  <option value="09:00 - 09:30 AM">09:00 - 09:30 AM</option>
                  <option value="09:30 - 10:00 AM">09:30 - 10:00 AM</option>
                  <option value="10:00 - 10:30 AM">10:00 - 10:30 AM</option>
                  <option value="11:00 - 11:30 AM">11:00 - 11:30 AM</option>
                  <option value="02:00 - 02:30 PM">02:00 - 02:30 PM</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('overview')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={bookingLoading}>
                {bookingLoading ? 'Booking Slot...' : 'Confirm Appointment Booking'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: MEDICAL RECORDS & HEALTH STORY */}
      {activeTab === 'records' && (
        <div className="fade-in">
          <PatientHealthStorySection patient={patient} userObj={userObj} patientData={patientData} />
        </div>
      )}

      {/* PRINTABLE HEALTH PASS MODAL */}
      {showPrintPassModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
        }}>
          <div className="glass-card fade-in" style={{
            width: '100%',
            maxWidth: '680px',
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary-100)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ArogyaPath (आरोग्यपथ) Healthcare Pass
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900)', margin: '0.25rem 0 0 0' }}>
                  {userObj.firstName || 'Ramesh'} {userObj.lastName || 'Kumar'}
                </h3>
              </div>

              <button
                onClick={() => setShowPrintPassModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Health Pass Card Layout */}
            <div style={{
              background: 'linear-gradient(135deg, #0f766e, #064e3b)',
              color: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>Aadhaar Number</span>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{patient.insuranceId || '7849-2310-9012'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>Patient Registration ID</span>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{patient.patientId || 'P-2026-0089'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>Age & Sex</span>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>34 Yrs • Male</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>Blood Group</span>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fca5a5' }}>{patient.bloodGroup || 'O+'}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                📍 Village: {patient.village || 'Rampur'}, District: {patient.district || 'Patna'}, State: {patient.state || 'Bihar'}
              </div>
            </div>

            {/* Active Clinical Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary-800)', display: 'block', marginBottom: '0.35rem' }}>
                  🩺 Latest Clinical Diagnosis:
                </strong>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>Seasonal Viral Fever & Mild Cold — Under Routine Care</p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary-800)', display: 'block', marginBottom: '0.35rem' }}>
                  💊 Active Medications:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                  <li>Paracetamol 500mg — 1 Tablet after meals (3 Days)</li>
                  <li>Cetirizine 10mg — 1 Tablet at night (3 Days)</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowPrintPassModal(false)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                <Printer size={16} /> Print Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Patient Health Story & Visit History (Option 1 Design)
// ============================================================================
const PatientHealthStorySection: React.FC<{ patient: any; userObj: any; patientData: any }> = ({ patient, userObj, patientData }) => {
  return (
    <div className="glass-card fade-in" style={{
      padding: '2rem',
      borderRadius: 'var(--radius-xl)',
      background: 'white',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-md)',
    }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={24} color="var(--primary-600)" />
            <span>My Health Story & Visit History</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            मेरा स्वास्थ्य इतिहास — A simple visual timeline of your vital signs, medical visits, and doctor advice.
          </p>
        </div>

        <span style={{
          background: 'var(--primary-50)',
          color: 'var(--primary-800)',
          border: '1px solid var(--primary-200)',
          padding: '0.35rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 700,
        }}>
          ABDM Health Pass Linked
        </span>
      </div>

      {/* 1. VISUAL HEALTH INDICATOR BADGES (4-GRID VITALS AT A GLANCE) */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Heart size={16} color="var(--primary-600)" />
          <span>My Latest Health Indicators (Vitals at a glance)</span>
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Blood Pressure Badge */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#166534',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Heart size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'block' }}>
                Blood Pressure
              </span>
              <strong style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                120 / 80 <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>mmHg</span>
              </strong>
              <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 700, marginTop: '0.15rem' }}>
                🟢 Normal (Recorded 15 Aug)
              </div>
            </div>
          </div>

          {/* SpO2 Oxygen Badge */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#0d9488',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Activity size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#115e59', fontWeight: 700, display: 'block' }}>
                Oxygen Saturation (SpO2)
              </span>
              <strong style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                98 <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>%</span>
              </strong>
              <div style={{ fontSize: '0.7rem', color: '#0f766e', fontWeight: 700, marginTop: '0.15rem' }}>
                🟢 Optimal Oxygen Level
              </div>
            </div>
          </div>

          {/* Blood Sugar Badge */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#2563eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Droplet size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 700, display: 'block' }}>
                Blood Sugar (Fasting)
              </span>
              <strong style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                95 <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>mg/dL</span>
              </strong>
              <div style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: 700, marginTop: '0.15rem' }}>
                🔵 Normal Glucose
              </div>
            </div>
          </div>

          {/* Temperature Badge */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: '#fef3c7',
            border: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#d97706',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Thermometer size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700, display: 'block' }}>
                Body Temperature
              </span>
              <strong style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                98.4 <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>°F</span>
              </strong>
              <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 700, marginTop: '0.15rem' }}>
                🟡 Normal Range
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. VISUAL VISIT STORY TIMELINE CARDS */}
      <div>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <FileText size={16} color="var(--primary-600)" />
          <span>My Medical Visit & Treatment Journey</span>
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          {/* Vertical Connecting Line */}
          <div style={{
            position: 'absolute',
            left: '20px',
            top: '25px',
            bottom: '25px',
            width: '2px',
            background: 'var(--border-color)',
            zIndex: 1,
          }} />

          {/* Timeline Card 1: Doctor Consultation */}
          <div style={{ display: 'flex', gap: '1.25rem', zIndex: 2 }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
            }}>
              <Stethoscope size={20} />
            </div>

            <div style={{
              flex: 1,
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase' }}>
                    Doctor Consultation • PHC Level
                  </span>
                  <h5 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-900)', margin: '0.15rem 0 0 0' }}>
                    Dr. Vikram Singh — General Medicine
                  </h5>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  📅 15 Aug 2026 • Kesariya PHC
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div style={{ padding: '0.6rem 0.75rem', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>Diagnosed Condition</span>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--primary-800)' }}>Seasonal Viral Fever & Cold</strong>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>Doctor's Care Advice</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    "Drink warm fluids, take complete bed rest for 3 days."
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '0.825rem', color: 'var(--primary-900)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill size={15} color="var(--primary-600)" />
                <span>Prescribed: <strong>Paracetamol 500mg</strong> & <strong>Cetirizine 10mg</strong> (3 Days Course)</span>
              </div>
            </div>
          </div>

          {/* Timeline Card 2: Diagnostic Test */}
          <div style={{ display: 'flex', gap: '1.25rem', zIndex: 2 }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
            }}>
              <Activity size={20} />
            </div>

            <div style={{
              flex: 1,
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                    Diagnostic Lab Report
                  </span>
                  <h5 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-900)', margin: '0.15rem 0 0 0' }}>
                    Complete Blood Count (CBC) & Dengue NS1 Screening
                  </h5>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  📅 10 Aug 2026 • East Champaran CHC Lab
                </span>
              </div>

              <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
                  🟢 Test Result: ALL PARAMETERS NORMAL
                </div>
                <div style={{ fontSize: '0.8rem', color: '#14532d', marginTop: '0.2rem' }}>
                  Hemoglobin: 13.5 g/dL (Normal) • WBC Count: 7,200/µL • Dengue Antigen: Negative
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card 3: ASHA Health Worker Screening */}
          <div style={{ display: 'flex', gap: '1.25rem', zIndex: 2 }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d97706, #b45309)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
            }}>
              <User size={20} />
            </div>

            <div style={{
              flex: 1,
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                    ASHA Community Screening
                  </span>
                  <h5 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-900)', margin: '0.15rem 0 0 0' }}>
                    Sunita Devi (ASHA Worker — Rampur Village)
                  </h5>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  📅 02 Aug 2026 • Household Visit
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '0.35rem 0 0 0' }}>
                Routine doorstep health checkup & vitals screening. BP recorded at 122/82 mmHg. Patient reported healthy status with no red flag symptoms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
