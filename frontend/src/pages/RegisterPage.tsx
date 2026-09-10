import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, CreditCard, Calendar, Phone, Mail, Lock, MapPin, HeartPulse, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Registration Type: 'PATIENT' (User/Resident) or 'STAFF' (Provider)
  const [regType, setRegType] = useState<'PATIENT' | 'STAFF'>('PATIENT');

  // Provider Role if STAFF selected
  const [providerRole, setProviderRole] = useState('DOCTOR');

  // Common Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // User / Patient Specific Essentials
  const [aadhaar, setAadhaar] = useState('');
  const [age, setAge] = useState<number | string>(30);
  const [dateOfBirth, setDateOfBirth] = useState('1996-06-15');
  const [sex, setSex] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('Rampur');
  const [district, setDistrict] = useState('Patna');
  const [state, setState] = useState('Bihar');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Staff Specific
  const [specialization, setSpecialization] = useState('General Medicine');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function: One-Click Quick Fill with Realistic Mock Indian Citizen Data
  const autofillRandomUserData = () => {
    const randomAadhaar = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomAge = Math.floor(22 + Math.random() * 40);
    const birthYear = 2026 - randomAge;
    const names = [
      { first: 'Aarav', last: 'Sharma', gender: 'Male' },
      { first: 'Priya', last: 'Verma', gender: 'Female' },
      { first: 'Rajesh', last: 'Kumar', gender: 'Male' },
      { first: 'Ananya', last: 'Singh', gender: 'Female' },
      { first: 'Deepak', last: 'Yadav', gender: 'Male' },
    ];
    const picked = names[Math.floor(Math.random() * names.length)];
    const randomPhone = `+91 9${Math.floor(800000000 + Math.random() * 100000000)}`;

    setFirstName(picked.first);
    setLastName(picked.last);
    setEmail(`${picked.first.toLowerCase()}.${picked.last.toLowerCase()}${Math.floor(Math.random() * 900)}@example.com`);
    setPassword('Password123');
    setPhone(randomPhone);
    setAadhaar(randomAadhaar);
    setAge(randomAge);
    setDateOfBirth(`${birthYear}-04-12`);
    setSex(picked.gender);
    setBloodGroup(['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)]);
    setAddress(`House #${Math.floor(10 + Math.random() * 90)}, Ward 4`);
    setVillage('Rampur');
    setDistrict('Patna');
    setState('Bihar');
    setEmergencyContactName(`Sunita ${picked.last} (Spouse)`);
    setEmergencyContactPhone(`+91 9${Math.floor(800000000 + Math.random() * 100000000)}`);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all mandatory fields (Name, Email, Password).');
      return;
    }

    if (regType === 'PATIENT' && !aadhaar) {
      setError('Aadhaar Number is required for User / Resident registration.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        firstName,
        lastName,
        email,
        password,
        phone,
        role: regType === 'PATIENT' ? 'PATIENT' : providerRole,
      };

      if (regType === 'PATIENT') {
        payload.dateOfBirth = dateOfBirth;
        payload.sex = sex;
        payload.village = village;
        payload.district = district;
        payload.state = state;
        payload.bloodGroup = bloodGroup;
        payload.address = address;
        payload.insuranceId = aadhaar; // Storing Aadhaar as insuranceId / Health ID
        payload.emergencyContactName = emergencyContactName;
        payload.emergencyContactPhone = emergencyContactPhone;
      }

      const registeredUser = await register(payload);

      // Redirect based on registered user role
      if (registeredUser.role === 'PATIENT') {
        navigate('/patient');
      } else if (['HEALTH_WORKER', 'NURSE'].includes(registeredUser.role)) {
        navigate('/health-worker');
      } else if (registeredUser.role === 'SPECIALIST') {
        navigate('/specialist');
      } else if (registeredUser.role === 'LAB_TECHNICIAN') {
        navigate('/diagnostics');
      } else if (registeredUser.role === 'PHARMACIST') {
        navigate('/prescriptions');
      } else if (['FACILITY_ADMIN', 'SYSTEM_ADMIN'].includes(registeredUser.role)) {
        navigate('/analytics');
      } else {
        navigate('/doctor');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email or Phone may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)',
      padding: '2.5rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bg-app) 0%, var(--primary-50) 100%)',
    }}>
      <div className="glass-card fade-in" style={{
        width: '100%',
        maxWidth: '820px',
        padding: '2.5rem',
        borderRadius: 'var(--radius-xl)',
        background: 'white',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-color)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
              Create Your Account
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Join ArogyaPath (आरोग्यपथ) to access personalized healthcare services & record management.
            </p>
          </div>

          {/* Quick Fill Button */}
          {regType === 'PATIENT' && (
            <button
              type="button"
              onClick={autofillRandomUserData}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Sparkles size={14} /> Auto-Fill Random User Details
            </button>
          )}
        </div>

        {/* Step 1: Select Registration Type */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Select Type of Registration:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* User / Resident Card */}
            <div
              onClick={() => setRegType('PATIENT')}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${regType === 'PATIENT' ? 'var(--primary-600)' : 'var(--border-color)'}`,
                background: regType === 'PATIENT' ? 'var(--primary-50)' : 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: regType === 'PATIENT' ? 'var(--primary-600)' : 'var(--primary-100)',
                  color: regType === 'PATIENT' ? 'white' : 'var(--primary-700)',
                }}>
                  <User size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                    User / Patient Registration
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>For Citizens & Community Residents</span>
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Requires Aadhaar ID, age, gender & essentials for personal health pass & consultation booking.
              </p>
            </div>

            {/* Doctor / Healthcare Staff Card */}
            <div
              onClick={() => setRegType('STAFF')}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${regType === 'STAFF' ? 'var(--primary-600)' : 'var(--border-color)'}`,
                background: regType === 'STAFF' ? 'var(--primary-50)' : 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: regType === 'STAFF' ? 'var(--primary-600)' : 'var(--primary-100)',
                  color: regType === 'STAFF' ? 'white' : 'var(--primary-700)',
                }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                    Healthcare Provider / Staff
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctors, ASHA, Specialists & Technicians</span>
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Access clinical workbench, referral queue, diagnostic labs, or pharmacy inventory.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {/* STAFF Role Selector if STAFF */}
          {regType === 'STAFF' && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--primary-50)', borderRadius: '8px', border: '1px solid var(--primary-200)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-900)', marginBottom: '0.35rem' }}>
                Select Healthcare Staff Role:
              </label>
              <select
                value={providerRole}
                onChange={(e) => setProviderRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                <option value="DOCTOR">Doctor (PHC / CHC)</option>
                <option value="HEALTH_WORKER">ASHA / Community Health Worker</option>
                <option value="SPECIALIST">District Hospital Specialist</option>
                <option value="LAB_TECHNICIAN">Lab Technician</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="FACILITY_ADMIN">Facility Admin / Director</option>
              </select>
            </div>
          )}

          {/* Registration Form Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* First Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Ramesh"
                style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Kumar"
                style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@example.com"
                style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
              />
            </div>

            {/* PATIENT-SPECIFIC ESSENTIALS */}
            {regType === 'PATIENT' && (
              <>
                {/* Aadhaar Number */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-800)', marginBottom: '0.35rem' }}>
                    <CreditCard size={15} color="var(--primary-600)" />
                    Aadhaar Number (12 Digits) *
                  </label>
                  <input
                    type="text"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    placeholder="e.g. 7849-2310-9012"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '6px',
                      border: '1.5px solid var(--primary-300)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      background: 'var(--primary-50)',
                    }}
                    required
                  />
                </div>

                {/* Age & Date of Birth */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Age (Years) & Date of Birth
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setAge(val);
                        setDateOfBirth(`${2026 - val}-01-01`);
                      }}
                      placeholder="Age"
                      style={{ width: '80px', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        if (e.target.value) {
                          const yr = parseInt(e.target.value.split('-')[0]);
                          setAge(2026 - yr);
                        }
                      }}
                      style={{ flex: 1, padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Gender
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="O-">O-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                {/* Village / Town */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Village / Town
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Rampur"
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  />
                </div>

                {/* District & State */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    District & State
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="District"
                      style={{ width: '50%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      style={{ width: '50%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Emergency Contact (Name & Phone)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Contact Person Name & Relation"
                      style={{ flex: 1, minWidth: '180px', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                    <input
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="Emergency Phone Number"
                      style={{ flex: 1, minWidth: '180px', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: 'var(--primary-700)', fontWeight: 700, textDecoration: 'none' }}>
                Sign In Instead
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.85rem 2rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {loading ? 'Creating Account...' : 'Complete Registration'} <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
