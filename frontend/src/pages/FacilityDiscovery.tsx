import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Building2, MapPin, Phone, Bed, Stethoscope, Search, ShieldAlert } from 'lucide-react';

export const FacilityDiscovery: React.FC = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [hasEmergency, setHasEmergency] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacilities();
  }, [hasEmergency]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      let query = `/facilities?`;
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (hasEmergency) query += `hasEmergency=true&`;

      const res = await apiRequest(query);
      setFacilities(res.data.facilities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFacilities();
  };

  return (
    <div className="page-wrapper fade-in">
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Building2 size={28} color="var(--primary-600)" />
          <span>Rural Healthcare Facility Discovery</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Continuum Mapping: Sub-Centres → PHC → CHC → District Hospitals & Specialist Centers
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by facility name, village, or district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={hasEmergency}
              onChange={(e) => setHasEmergency(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span>24/7 Emergency Care Only</span>
          </label>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
            Filter Facilities
          </button>
        </form>
      </div>

      {/* Facility Grid */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading healthcare facilities...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {facilities.map((fac) => (
            <div key={fac.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-routine" style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                      Level {fac.level} • {fac.type.replace('_', ' ')}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>{fac.name}</h3>
                  </div>
                  {fac.emergencyAvailable && (
                    <span className="badge badge-emergency" style={{ fontSize: '0.65rem' }}>
                      <ShieldAlert size={12} /> 24/7 ER
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <MapPin size={14} color="var(--primary-600)" />
                  <span>{fac.address || `${fac.village}, ${fac.district}, ${fac.state}`}</span>
                </p>

                {fac.phone && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Phone size={14} color="var(--primary-600)" />
                    <span>{fac.phone}</span>
                  </p>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.85rem' }}>
                    <Bed size={16} color="var(--primary-600)" />
                    <span><strong>{fac.availableBeds}</strong> / {fac.totalBeds} Beds Free</span>
                  </div>
                </div>

                {/* Available Services */}
                {fac.services && fac.services.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Services:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
                      {fac.services.map((s: any) => (
                        <span key={s.id} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: '4px' }}>
                          {s.serviceName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lat: {fac.latitude?.toFixed(2)} | Lng: {fac.longitude?.toFixed(2)}</span>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => window.location.href = `/referrals`}>
                  Select for Referral
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
