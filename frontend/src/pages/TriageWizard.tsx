import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Stethoscope, AlertTriangle, CheckCircle2, ArrowRight, Activity, MapPin, Sparkles } from 'lucide-react';
import { queueOfflineAction } from '../services/offline';

export const TriageWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState<number>(38);
  const [selectedBodyPart, setSelectedBodyPart] = useState('General');
  const [symptomsList, setSymptomsList] = useState<Array<{ symptom: string; severity: string; duration: string }>>([
    { symptom: 'High Fever with Chills', severity: 'severe', duration: '4 days' },
  ]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [hasChestPain, setHasChestPain] = useState(false);
  const [hasBreathingDifficulty, setHasBreathingDifficulty] = useState(false);
  const [hasUnconsciousness, setHasUnconsciousness] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [recommendedFacilities, setRecommendedFacilities] = useState<any[]>([]);

  const addSymptom = (name: string) => {
    if (!symptomsList.some(s => s.symptom === name)) {
      setSymptomsList([...symptomsList, { symptom: name, severity: 'moderate', duration: '1-3 days' }]);
    }
  };

  const removeSymptom = (index: number) => {
    setSymptomsList(symptomsList.filter((_, i) => i !== index));
  };

  const handleCustomAdd = () => {
    if (customSymptom.trim()) {
      addSymptom(customSymptom.trim());
      setCustomSymptom('');
    }
  };

  const submitTriage = async () => {
    setLoading(true);
    const symptoms = [...symptomsList];
    if (hasChestPain) symptoms.push({ symptom: 'Severe Chest Pain', severity: 'severe', duration: 'current' });
    if (hasBreathingDifficulty) symptoms.push({ symptom: 'Severe Breathing Difficulty', severity: 'severe', duration: 'current' });
    if (hasUnconsciousness) symptoms.push({ symptom: 'Unconsciousness / Fainting', severity: 'severe', duration: 'current' });

    const payload = {
      patientId: 'demo-patient-id',
      age,
      symptoms,
    };

    try {
      if (navigator.onLine) {
        const res = await apiRequest('/triage/assess', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setResult(res.data);

        // Fetch facility recommendations
        const facRes = await apiRequest(`/facilities/recommendations?emergencyRequired=${res.data.category === 'EMERGENCY'}`);
        setRecommendedFacilities(facRes.data || []);
      } else {
        // Offline handling
        const offlineResult = {
          category: (hasChestPain || hasBreathingDifficulty || hasUnconsciousness) ? 'EMERGENCY' : 'URGENT',
          riskScore: 75,
          redFlagsDetected: (hasChestPain || hasBreathingDifficulty || hasUnconsciousness) ? ['Life-threatening symptom detected'] : [],
          aiSummary: 'Offline Assessment: Patient requires prompt evaluation at the nearest PHC or Hospital.',
          disclaimer: 'Offline mode active. Data queued for synchronization.',
        };
        setResult(offlineResult);
        queueOfflineAction('triage', 'CREATE', payload);
      }
      setStep(3);
    } catch (err: any) {
      alert(err.message || 'Triage calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const commonSymptomsMap: Record<string, string[]> = {
    Head: ['Severe Headache', 'Dizziness', 'Vision Change', 'High Fever', 'Neck Stiffness'],
    Chest: ['Chest Pain', 'Shortness of Breath', 'Palpitations', 'Coughing Blood'],
    Abdomen: ['Severe Abdominal Pain', 'Persistent Vomiting', 'Diarrhea', 'Jaundice / Yellow Eyes'],
    Limbs: ['Swelling', 'Joint Pain', 'Inability to Walk', 'Numbness'],
    General: ['High Fever with Chills', 'Extreme Fatigue', 'Unexplained Weight Loss', 'Body Pain'],
  };

  return (
    <div className="page-wrapper fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Stethoscope size={28} color="var(--primary-600)" />
          <span>Clinical Triage & Risk Assessment Engine</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          3-Layer Intelligent Triage: Deterministic Red-Flag Rules → Risk Scoring → AI Clinical Guidance
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{
            flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
            background: step === s ? 'var(--primary-500)' : step > s ? 'var(--primary-100)' : 'var(--bg-card)',
            color: step === s ? 'white' : step > s ? 'var(--primary-800)' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.875rem', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span>Step {s}:</span>
            <span>{s === 1 ? 'Emergency Screening' : s === 2 ? 'Symptom Intake' : 'Assessment Result'}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Emergency Red Flag Screening */}
      {step === 1 && (
        <div className="glass-card fade-in">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--emergency-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={22} />
            <span>Layer 1: Immediate Red-Flag Screening</span>
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Does the patient present with any of the following life-threatening symptoms right now?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: hasChestPain ? 'var(--emergency-bg)' : 'var(--bg-card)', border: `1px solid ${hasChestPain ? 'var(--emergency-border)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
              <input type="checkbox" checked={hasChestPain} onChange={(e) => setHasChestPain(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)' }}>Severe, crushing chest pain or pressure</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Possible Acute Coronary Syndrome / Heart Attack</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: hasBreathingDifficulty ? 'var(--emergency-bg)' : 'var(--bg-card)', border: `1px solid ${hasBreathingDifficulty ? 'var(--emergency-border)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
              <input type="checkbox" checked={hasBreathingDifficulty} onChange={(e) => setHasBreathingDifficulty(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)' }}>Severe difficulty breathing / Gasping for air</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Possible Severe Respiratory Distress / Anaphylaxis</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: hasUnconsciousness ? 'var(--emergency-bg)' : 'var(--bg-card)', border: `1px solid ${hasUnconsciousness ? 'var(--emergency-border)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
              <input type="checkbox" checked={hasUnconsciousness} onChange={(e) => setHasUnconsciousness(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)' }}>Unconsciousness, confusion, or inability to respond</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Possible Stroke, Cerebral Malaria, or Shock</span>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              <span>Continue to Symptom Intake</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Guided Symptom Selection */}
      {step === 2 && (
        <div className="glass-card fade-in">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Layer 2: Detailed Symptom Assessment</h3>

          {/* Age Selector */}
          <div className="form-group" style={{ maxWidth: '250px' }}>
            <label className="form-label">Patient Age (Years)</label>
            <input type="number" className="form-input" value={age} onChange={(e) => setAge(parseInt(e.target.value) || 0)} min="0" max="120" />
          </div>

          {/* Body Part Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Select Body Area</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['Head', 'Chest', 'Abdomen', 'Limbs', 'General'].map((part) => (
                <button
                  key={part}
                  className={`btn ${selectedBodyPart === part ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedBodyPart(part)}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  {part}
                </button>
              ))}
            </div>
          </div>

          {/* Common Symptoms Chips */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Common Symptoms ({selectedBodyPart})</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {commonSymptomsMap[selectedBodyPart]?.map((sym) => (
                <button
                  key={sym}
                  onClick={() => addSymptom(sym)}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                    border: '1px solid var(--primary-500)', background: symptomsList.some(s => s.symptom === sym) ? 'var(--primary-500)' : 'var(--bg-card)',
                    color: symptomsList.some(s => s.symptom === sym) ? 'white' : 'var(--primary-700)', cursor: 'pointer',
                  }}
                >
                  + {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Symptoms List */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="form-label">Selected Symptoms for Evaluation</label>
            {symptomsList.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No symptoms added yet. Click above or type below.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {symptomsList.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{item.symptom}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <select className="form-select" value={item.severity} onChange={(e) => {
                        const copy = [...symptomsList];
                        copy[idx].severity = e.target.value;
                        setSymptomsList(copy);
                      }} style={{ width: '120px' }}>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                      <button onClick={() => removeSymptom(idx)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={submitTriage} disabled={loading}>
              {loading ? 'Evaluating Risk...' : 'Generate Triage & Facility Recommendation'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Triage Result & Facility Recommendations */}
      {step === 3 && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
          
          {/* Result Card */}
          <div className="glass-card" style={{ borderLeft: `6px solid ${result.category === 'EMERGENCY' ? '#ef4444' : '#f59e0b'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <StatusBadge status={result.category} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>
                  Risk Score: {result.riskScore} / 100
                </h3>
              </div>
              <Activity size={32} color={result.category === 'EMERGENCY' ? '#ef4444' : '#f59e0b'} />
            </div>

            {/* Red Flags Alert */}
            {result.redFlagsDetected && result.redFlagsDetected.length > 0 && (
              <div style={{ padding: '1rem', background: 'var(--emergency-bg)', border: '1px solid var(--emergency-border)', borderRadius: 'var(--radius-md)', color: 'var(--emergency-text)', marginBottom: '1.25rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>🚨 Red Flag Alert:</strong>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                  {result.redFlagsDetected.map((rf: string, idx: number) => <li key={idx}>{rf}</li>)}
                </ul>
              </div>
            )}

            {/* Layer 3: AI Summary */}
            {result.aiSummary && (
              <div style={{ padding: '1rem', background: 'var(--primary-50)', border: '1px solid var(--primary-100)', borderRadius: 'var(--radius-md)', color: 'var(--primary-800)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-700)', marginBottom: '0.375rem' }}>
                  <Sparkles size={16} />
                  <span>Clinical Decision Support Summary:</span>
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{result.aiSummary}</p>
              </div>
            )}

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', italic: 'true' }}>
              ⚠️ {result.disclaimer}
            </p>
          </div>

          {/* Recommended Facilities */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="var(--primary-600)" />
              <span>Recommended Healthcare Facilities (Continuum Ranking)</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat( auto-fit, minmax(320px, 1fr) )', gap: '1.25rem' }}>
              {recommendedFacilities.map((fac) => (
                <div key={fac.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{fac.name}</h4>
                      <span className="badge badge-routine" style={{ fontSize: '0.7rem' }}>Level {fac.level}</span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      📍 {fac.village}, {fac.district} {fac.distance ? `(${fac.distance.toFixed(1)} km away)` : ''}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
                      {fac.reasons?.map((r: string, idx: number) => (
                        <span key={idx} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: '4px' }}>
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => window.location.href = '/referrals'}>
                    Initiate Referral to {fac.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
