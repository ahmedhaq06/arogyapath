import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  languagePreference?: string;
  patientId?: string;
  providerId?: string;
  // Detailed Patient / Resident fields
  aadhaar?: string;
  insuranceId?: string;
  age?: number;
  dateOfBirth?: string;
  sex?: string;
  bloodGroup?: string;
  address?: string;
  village?: string;
  district?: string;
  state?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export const DEMO_USERS: Record<string, { role: string; label: string; email: string; name: string }> = {
  PATIENT: { role: 'PATIENT', label: 'User / Patient', email: 'patient@demo.com', name: 'Ramesh Kumar' },
  DOCTOR: { role: 'DOCTOR', label: 'Doctor (PHC / CHC)', email: 'doctor@demo.com', name: 'Dr. Vikram Singh' },
  HEALTH_WORKER: { role: 'HEALTH_WORKER', label: 'ASHA / Health Worker', email: 'chw@demo.com', name: 'Sunita Devi' },
  SPECIALIST: { role: 'SPECIALIST', label: 'District Specialist', email: 'specialist@demo.com', name: 'Dr. Anjali Mehta' },
  LAB_TECHNICIAN: { role: 'LAB_TECHNICIAN', label: 'Lab Technician', email: 'lab@demo.com', name: 'Rajesh Patel' },
  PHARMACIST: { role: 'PHARMACIST', label: 'Pharmacist', email: 'pharmacist@demo.com', name: 'Amit Verma' },
  SYSTEM_ADMIN: { role: 'SYSTEM_ADMIN', label: 'System Admin', email: 'admin@demo.com', name: 'Admin User' },
};

// Default fallback mock user for Ramesh Kumar (User / Patient)
const MOCK_DEFAULT_PATIENT: User = {
  id: 'patient-user-id',
  email: 'ramesh.kumar@example.com',
  firstName: 'Ramesh',
  lastName: 'Kumar',
  phone: '+91 98765 43210',
  role: 'PATIENT',
  patientId: 'P-2026-0089',
  aadhaar: '7849-2310-9012',
  insuranceId: '7849-2310-9012',
  age: 34,
  dateOfBirth: '1992-05-14',
  sex: 'Male',
  bloodGroup: 'O+',
  address: 'House #42, Main Chawk',
  village: 'Rampur',
  district: 'Patna',
  state: 'Bihar',
  emergencyContactName: 'Sunita Kumar (Wife)',
  emergencyContactPhone: '+91 98765 12345',
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  loginAsDemo: (roleKey: string) => Promise<User>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('arogya_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return MOCK_DEFAULT_PATIENT;
      }
    }
    return MOCK_DEFAULT_PATIENT;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('arogya_token') || 'demo-jwt-token';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('arogya_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('arogya_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('arogya_token', token);
    } else {
      localStorage.removeItem('arogya_token');
    }
  }, [token]);

  const saveAuthSession = (userData: any, accessToken: string) => {
    // Map backend patient details if present
    const patientInfo = userData.patient || {};
    const formattedUser: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || '+91 98765 43210',
      role: userData.role,
      languagePreference: userData.languagePreference || 'en',
      patientId: userData.patientId || patientInfo.id || patientInfo.patientId || 'P-2026-0089',
      providerId: userData.providerId,
      aadhaar: patientInfo.insuranceId || '7849-2310-9012',
      insuranceId: patientInfo.insuranceId || '7849-2310-9012',
      dateOfBirth: patientInfo.dateOfBirth ? String(patientInfo.dateOfBirth).split('T')[0] : '1992-05-14',
      age: 34,
      sex: patientInfo.sex || 'Male',
      bloodGroup: patientInfo.bloodGroup || 'O+',
      address: patientInfo.address || 'House #42, Main Chawk',
      village: patientInfo.village || 'Rampur',
      district: patientInfo.district || 'Patna',
      state: patientInfo.state || 'Bihar',
      emergencyContactName: patientInfo.emergencyContactName || 'Sunita Kumar (Wife)',
      emergencyContactPhone: patientInfo.emergencyContactPhone || '+91 98765 12345',
    };

    setUser(formattedUser);
    setToken(accessToken);
    return formattedUser;
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!res.success) {
      throw new Error(res.error?.message || 'Login failed');
    }

    return saveAuthSession(res.data.user, res.data.accessToken);
  };

  const register = async (data: any): Promise<User> => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!res.success) {
      throw new Error(res.error?.message || 'Registration failed');
    }

    return saveAuthSession(res.data.user, res.data.accessToken);
  };

  const loginAsDemo = async (roleKey: string): Promise<User> => {
    try {
      const res = await apiRequest('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role: roleKey }),
      });
      if (res.success && res.data) {
        return saveAuthSession(res.data.user, res.data.accessToken);
      }
    } catch {
      // Fallback local demo account if backend offline
    }

    const demoInfo = DEMO_USERS[roleKey] || DEMO_USERS['PATIENT'];
    const fallbackUser: User = {
      ...MOCK_DEFAULT_PATIENT,
      id: `${roleKey.toLowerCase()}-demo-id`,
      email: demoInfo.email,
      firstName: demoInfo.name.split(' ')[0],
      lastName: demoInfo.name.split(' ').slice(1).join(' ') || 'User',
      role: demoInfo.role,
    };
    setUser(fallbackUser);
    setToken('demo-token-' + roleKey);
    return fallbackUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('arogya_user');
    localStorage.removeItem('arogya_token');
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        register,
        loginAsDemo,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
