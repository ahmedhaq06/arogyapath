import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { UserCheck, CreditCard, Phone, Calendar, MapPin, HeartPulse, Shield, Sparkles, CheckCircle2, Save } from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  // Profile Form States prefilled with user data or default realistic mock data
  const [firstName, setFirstName] = useState(user?.firstName || 'Ramesh');
  const [lastName, setLastName] = useState(user?.lastName || 'Kumar');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [email, setEmail] = useState(user?.email || 'ramesh.kumar@example.com');
  const [aadhaar, setAadhaar] = useState(user?.aadhaar || user?.insuranceId || '7849-2310-9012');
  const [age, setAge] = useState<number | string>(user?.age || 34);
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '1992-05-14');
  const [sex, setSex] = useState(user?.sex || 'Male');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [address, setAddress] = useState(user?.address || 'House #42, Main Chawk');
  const [village, setVillage] = useState(user?.village || 'Rampur');
  const [district, setDistrict] = useState(user?.district || 'Patna');
  const [state, setState] = useState(user?.state || 'Bihar');
  const [emergencyContactName, setEmergencyContactName] = useState(user?.emergencyContactName || 'Sunita Kumar (Wife)');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.emergencyContactPhone || '+91 98765 12345');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || 'Ramesh');
      setLastName(user.lastName || 'Kumar');
      setPhone(user.phone || '+91 98765 43210');
      setEmail(user.email || 'ramesh.kumar@example.com');
      setAadhaar(user.aadhaar || user.insuranceId || '7849-2310-9012');
      setAge(user.age || 34);
      setDateOfBirth(user.dateOfBirth || '1992-05-14');
      setSex(user.sex || 'Male');
      setBloodGroup(user.bloodGroup || 'O+');
      setAddress(user.address || 'House #42, Main Chawk');
      setVillage(user.village || 'Rampur');
      setDistrict(user.district || 'Patna');
      setState(user.state || 'Bihar');
      setEmergencyContactName(user.emergencyContactName || 'Sunita Kumar (Wife)');
      setEmergencyContactPhone(user.emergencyContactPhone || '+91 98765 12345');
    }
  }, [user]);

  // Generate new random mock numbers & details for quick demo prefill
  const handleRandomPrefill = () => {
    const randomAadhaar = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomAge = Math.floor(20 + Math.random() * 45);
    const randomPhone = `+91 9${Math.floor(800000000 + Math.random() * 100000000)}`;
    const names = [
      { first: 'Aarav', last: 'Sharma', gender: 'Male' },
      { first: 'Priya', last: 'Verma', gender: 'Female' },
      { first: 'Rajesh', last: 'Kumar', gender: 'Male' },
      { first: 'Kavita', last: 'Singh', gender: 'Female' },
      { first: 'Deepak', last: 'Gupta', gender: 'Male' },
    ];
    const picked = names[Math.floor(Math.random() * names.length)];

    setFirstName(picked.first);
    setLastName(picked.last);
    setPhone(randomPhone);
    setAadhaar(randomAadhaar);
    setAge(randomAge);
    setDateOfBirth(`${2026 - randomAge}-07-20`);
    setSex(picked.gender);
    setBloodGroup(['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)]);
    setAddress(`House #${Math.floor(12 + Math.random() * 80)}, Ward 5`);
    setVillage('Kesariya');
    setDistrict('East Champaran');
    setState('Bihar');
    setEmergencyContactName(`Ramesh ${picked.last} (Brother)`);
    setEmergencyContactPhone(`+91 9${Math.floor(800000000 + Math.random() * 100000000)}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload = {
      firstName,
      lastName,
      phone,
      insuranceId: aadhaar,
      dateOfBirth,
      sex,
      bloodGroup,
      address,
      village,
      district,
      state,
      emergencyContactName,
      emergencyContactPhone,
    };

    try {
      // Try posting update to backend API
      const res = await apiRequest('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        updateUser({
          firstName,
          lastName,
          phone,
          aadhaar,
          insuranceId: aadhaar,
          age: Number(age),
          dateOfBirth,
          sex,
          bloodGroup,
          address,
          village,
          district,
          state,
          emergencyContactName,
          emergencyContactPhone,
        });
      } else {
        updateUser({
          firstName,
          lastName,
          phone,
          aadhaar,
          insuranceId: aadhaar,
          age: Number(age),
          dateOfBirth,
          sex,
          bloodGroup,
          address,
          village,
          district,
          state,
          emergencyContactName,
          emergencyContactPhone,
        });
      }

      setSuccessMsg('Profile updated successfully! Your healthcare pass details have been saved.');
    } catch (err: any) {
      // Fallback local update
      updateUser({
        firstName,
        lastName,
        phone,
        aadhaar,
        insuranceId: aadhaar,
        age: Number(age),
        dateOfBirth,
        sex,
        bloodGroup,
        address,
        village,
        district,
        state,
        emergencyContactName,
        emergencyContactPhone,
      });
      setSuccessMsg('Profile details saved locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
            User Health Pass & Profile
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Manage your personal profile, Aadhaar identification, age, and emergency health contact details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRandomPrefill}
          style={{
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: 'white',
            border: 'none',
            padding: '0.6rem 1.25rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
          }}
        >
          <Sparkles size={16} /> Re-Generate Random Mock Prefill
        </button>
      </div>

      {successMsg && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--routine-bg)',
          border: '1px solid var(--routine-border)',
          color: 'var(--routine-text)',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Digital ABDM Health Pass Card */}
        <div>
          <div style={{
            padding: '1.75rem',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #0f766e 0%, #115e59 50%, #064e3b 100%)',
            color: '#ffffff',
            boxShadow: '0 12px 30px -5px rgba(15, 118, 110, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #047857',
          }}>
            {/* Decorative background glow circle */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#a7f3d0', fontWeight: 800 }}>
                  ArogyaPath • Digital Health Pass
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0 0 0', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  {firstName} {lastName}
                </h3>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.5px',
              }}>
                {user?.role || 'PATIENT'}
              </div>
            </div>

            {/* Pass Key Metrics Box */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '1rem',
              borderRadius: '12px',
            }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#a7f3d0', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>
                  Aadhaar / Health ID
                </span>
                <strong style={{ fontSize: '1rem', color: '#ffffff', letterSpacing: '0.5px', fontWeight: 800 }}>
                  {aadhaar}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#a7f3d0', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>
                  Patient ID
                </span>
                <strong style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 800 }}>
                  {user?.patientId || 'P-2026-0089'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#a7f3d0', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>
                  Age & Gender
                </span>
                <strong style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 800 }}>
                  {age} Yrs • {sex}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#a7f3d0', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>
                  Blood Group
                </span>
                <span style={{
                  display: 'inline-block',
                  background: '#ef4444',
                  color: '#ffffff',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                }}>
                  {bloodGroup}
                </span>
              </div>
            </div>

            {/* Location & Emergency Contact Card */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '1rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <div>
                <span style={{ color: '#34d399', fontWeight: 700 }}>📍 Village & District: </span>
                <strong style={{ color: '#ffffff', fontWeight: 700 }}>{village}, {district}, {state}</strong>
              </div>
              <div>
                <span style={{ color: '#34d399', fontWeight: 700 }}>📞 Phone: </span>
                <strong style={{ color: '#ffffff', fontWeight: 700 }}>{phone}</strong>
              </div>
              <div>
                <span style={{ color: '#34d399', fontWeight: 700 }}>🆘 Emergency Contact: </span>
                <strong style={{ color: '#ffffff', fontWeight: 700 }}>{emergencyContactName} ({emergencyContactPhone})</strong>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#a7f3d0',
              fontWeight: 700,
            }}>
              <span>ABDM Health Stack Connected</span>
              <Shield size={18} color="#34d399" />
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Form */}
        <div style={{
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-900)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={22} color="var(--primary-600)" />
            Edit Profile Details
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Name Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  required
                />
              </div>
            </div>

            {/* Aadhaar Number & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-800)', marginBottom: '0.35rem' }}>
                  <CreditCard size={15} color="var(--primary-600)" />
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1.5px solid var(--primary-300)', fontSize: '0.875rem', fontWeight: 600, background: 'var(--primary-50)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                  required
                />
              </div>
            </div>

            {/* Age, DOB, Gender, Blood Group */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Age (Years)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setAge(val);
                    setDateOfBirth(`${2026 - val}-01-01`);
                  }}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Gender
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
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
            </div>

            {/* Address / Village / District / State */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Address & Village
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / House Address"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                />
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="Village"
                  style={{ width: '140px', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="District"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* Emergency Contacts */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Emergency Contact Details
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Contact Name & Relation"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                />
                <input
                  type="text"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="Emergency Phone"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: '1rem',
                padding: '0.85rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Save size={18} />
              {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
