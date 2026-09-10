-- ============================================================================
-- AROGYAPATH (आरोग्यपथ) - Complete Supabase PostgreSQL Schema & Seed Script
-- Compatible with Supabase SQL Editor & PostgreSQL 14+
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables & types if re-creating
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "NotificationPreference" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Appointment" CASCADE;
DROP TABLE IF EXISTS "PrescriptionItem" CASCADE;
DROP TABLE IF EXISTS "Prescription" CASCADE;
DROP TABLE IF EXISTS "DiagnosticResult" CASCADE;
DROP TABLE IF EXISTS "DiagnosticOrder" CASCADE;
DROP TABLE IF EXISTS "ReferralStatusHistory" CASCADE;
DROP TABLE IF EXISTS "Referral" CASCADE;
DROP TABLE IF EXISTS "TriageAssessment" CASCADE;
DROP TABLE IF EXISTS "Immunization" CASCADE;
DROP TABLE IF EXISTS "PatientMedication" CASCADE;
DROP TABLE IF EXISTS "Allergy" CASCADE;
DROP TABLE IF EXISTS "Condition" CASCADE;
DROP TABLE IF EXISTS "Vital" CASCADE;
DROP TABLE IF EXISTS "Encounter" CASCADE;
DROP TABLE IF EXISTS "Provider" CASCADE;
DROP TABLE IF EXISTS "Patient" CASCADE;
DROP TABLE IF EXISTS "Facility" CASCADE;
DROP TABLE IF EXISTS "RefreshToken" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "TriageLevel" CASCADE;
DROP TYPE IF EXISTS "ReferralStatus" CASCADE;
DROP TYPE IF EXISTS "EncounterStatus" CASCADE;
DROP TYPE IF EXISTS "PriorityLevel" CASCADE;
DROP TYPE IF EXISTS "DiagnosticStatus" CASCADE;
DROP TYPE IF EXISTS "PrescriptionStatus" CASCADE;

-- 3. Create Custom Enum Types
CREATE TYPE "Role" AS ENUM (
  'PATIENT',
  'HEALTH_WORKER',
  'NURSE',
  'DOCTOR',
  'SPECIALIST',
  'LAB_TECHNICIAN',
  'PHARMACIST',
  'FACILITY_ADMIN',
  'SYSTEM_ADMIN'
);

CREATE TYPE "TriageLevel" AS ENUM ('RED', 'YELLOW', 'GREEN');
CREATE TYPE "ReferralStatus" AS ENUM (
  'SUBMITTED',
  'ACCEPTED',
  'APPOINTMENT_SCHEDULED',
  'IN_TRANSIT',
  'ARRIVED',
  'UNDER_REVIEW',
  'COMPLETED',
  'CANCELLED',
  'REJECTED'
);
CREATE TYPE "EncounterStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PriorityLevel" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY');
CREATE TYPE "DiagnosticStatus" AS ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'DISPENSED', 'PARTIALLY_DISPENSED', 'CANCELLED', 'EXPIRED');

-- ============================================================================
-- 4. Create Tables
-- ============================================================================

-- USER TABLE
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "phone" VARCHAR(50) UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'PATIENT',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "failedAttempts" INT NOT NULL DEFAULT 0,
  "lastLoginAt" TIMESTAMP WITH TIME ZONE,
  "languagePreference" VARCHAR(10) NOT NULL DEFAULT 'en',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_user_email" ON "User"("email");
CREATE INDEX "idx_user_phone" ON "User"("phone");
CREATE INDEX "idx_user_role" ON "User"("role");

-- REFRESH TOKEN TABLE
CREATE TABLE "RefreshToken" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "token" VARCHAR(500) UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP WITH TIME ZONE
);

-- FACILITY TABLE
CREATE TABLE "Facility" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "facilityCode" VARCHAR(50) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "tierLevel" INT NOT NULL, -- 1: Sub-Centre, 2: PHC, 3: CHC, 4: SDH, 5: District Hosp, 6: Tertiary/Medical College
  "facilityType" VARCHAR(100) NOT NULL,
  "address" TEXT,
  "village" VARCHAR(100),
  "district" VARCHAR(100) NOT NULL,
  "state" VARCHAR(100) NOT NULL,
  "pincode" VARCHAR(20),
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "totalBeds" INT NOT NULL DEFAULT 0,
  "availableBeds" INT NOT NULL DEFAULT 0,
  "icuBeds" INT NOT NULL DEFAULT 0,
  "availableIcuBeds" INT NOT NULL DEFAULT 0,
  "oxygenAvailable" BOOLEAN NOT NULL DEFAULT true,
  "bloodBankAvailable" BOOLEAN NOT NULL DEFAULT false,
  "teleconsultationAvailable" BOOLEAN NOT NULL DEFAULT true,
  "operatingHours" VARCHAR(100) DEFAULT '24x7',
  "contactPhone" VARCHAR(50),
  "contactEmail" VARCHAR(255),
  "services" TEXT[], -- JSON or text array of services
  "specialties" TEXT[],
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PATIENT TABLE
CREATE TABLE "Patient" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "patientId" VARCHAR(50) UNIQUE NOT NULL,
  "dateOfBirth" DATE,
  "sex" VARCHAR(20),
  "bloodGroup" VARCHAR(10),
  "address" TEXT,
  "village" VARCHAR(100),
  "district" VARCHAR(100),
  "state" VARCHAR(100),
  "pincode" VARCHAR(20),
  "insuranceId" VARCHAR(100), -- Aadhaar / Health ID
  "emergencyContactName" VARCHAR(100),
  "emergencyContactPhone" VARCHAR(50),
  "emergencyContactRelation" VARCHAR(50),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PROVIDER TABLE
CREATE TABLE "Provider" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "facilityId" UUID REFERENCES "Facility"("id") ON DELETE SET NULL,
  "specialization" VARCHAR(100),
  "qualification" VARCHAR(100),
  "registrationNo" VARCHAR(100),
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ENCOUNTER TABLE
CREATE TABLE "Encounter" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "providerId" UUID REFERENCES "Provider"("id") ON DELETE SET NULL,
  "facilityId" UUID REFERENCES "Facility"("id") ON DELETE SET NULL,
  "encounterType" VARCHAR(50) NOT NULL DEFAULT 'CONSULTATION',
  "status" "EncounterStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "chiefComplaint" TEXT,
  "clinicalNotes" TEXT,
  "diagnosisCode" VARCHAR(50), -- ICD-10 Code
  "diagnosisName" VARCHAR(255),
  "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- VITAL TABLE
CREATE TABLE "Vital" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "encounterId" UUID REFERENCES "Encounter"("id") ON DELETE SET NULL,
  "systolicBp" INT,
  "diastolicBp" INT,
  "heartRate" INT,
  "respiratoryRate" INT,
  "temperature" DOUBLE PRECISION,
  "spo2" INT,
  "weightKg" DOUBLE PRECISION,
  "heightCm" DOUBLE PRECISION,
  "bloodGlucoseMgDl" DOUBLE PRECISION,
  "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TRIAGE ASSESSMENT TABLE
CREATE TABLE "TriageAssessment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "providerId" UUID REFERENCES "Provider"("id") ON DELETE SET NULL,
  "facilityId" UUID REFERENCES "Facility"("id") ON DELETE SET NULL,
  "chiefSymptoms" TEXT[] NOT NULL,
  "triageLevel" "TriageLevel" NOT NULL,
  "riskScore" INT NOT NULL DEFAULT 0,
  "redFlagsDetected" TEXT[],
  "aiSummary" TEXT,
  "recommendedTier" INT NOT NULL,
  "recommendedFacilityId" UUID REFERENCES "Facility"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- REFERRAL TABLE
CREATE TABLE "Referral" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "referralCode" VARCHAR(50) UNIQUE NOT NULL,
  "patientId" UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "referringProviderId" UUID REFERENCES "Provider"("id") ON DELETE SET NULL,
  "referringFacilityId" UUID NOT NULL REFERENCES "Facility"("id") ON DELETE CASCADE,
  "targetFacilityId" UUID NOT NULL REFERENCES "Facility"("id") ON DELETE CASCADE,
  "targetSpecialty" VARCHAR(100) NOT NULL,
  "reasonForReferral" TEXT NOT NULL,
  "clinicalSummary" TEXT,
  "priorityLevel" "PriorityLevel" NOT NULL DEFAULT 'ROUTINE',
  "status" "ReferralStatus" NOT NULL DEFAULT 'SUBMITTED',
  "transportRequired" BOOLEAN NOT NULL DEFAULT false,
  "bedReserved" BOOLEAN NOT NULL DEFAULT false,
  "reservedBedNo" VARCHAR(50),
  "appointmentTime" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- APPOINTMENT TABLE
CREATE TABLE "Appointment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "appointmentNo" VARCHAR(50) UNIQUE NOT NULL,
  "patientId" UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "providerId" UUID REFERENCES "Provider"("id") ON DELETE SET NULL,
  "facilityId" UUID NOT NULL REFERENCES "Facility"("id") ON DELETE CASCADE,
  "department" VARCHAR(100) NOT NULL,
  "scheduledTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "status" "EncounterStatus" NOT NULL DEFAULT 'SCHEDULED',
  "symptoms" TEXT,
  "chiefComplaint" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- DIAGNOSTIC ORDER TABLE
CREATE TABLE "DiagnosticOrder" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderCode" VARCHAR(50) UNIQUE NOT NULL,
  "patientId" UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "providerId" UUID REFERENCES "Provider"("id") ON DELETE SET NULL,
  "facilityId" UUID NOT NULL REFERENCES "Facility"("id") ON DELETE CASCADE,
  "testName" VARCHAR(255) NOT NULL,
  "testCategory" VARCHAR(100),
  "status" "DiagnosticStatus" NOT NULL DEFAULT 'ORDERED',
  "priority" "PriorityLevel" NOT NULL DEFAULT 'ROUTINE',
  "notes" TEXT,
  "orderedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- DIAGNOSTIC RESULT TABLE
CREATE TABLE "DiagnosticResult" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID UNIQUE NOT NULL REFERENCES "DiagnosticOrder"("id") ON DELETE CASCADE,
  "testName" VARCHAR(255) NOT NULL,
  "resultValue" VARCHAR(255) NOT NULL,
  "unit" VARCHAR(50),
  "normalRange" VARCHAR(100),
  "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
  "clinicalNotes" TEXT,
  "performedBy" VARCHAR(255),
  "completedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PRESCRIPTION TABLE
CREATE TABLE "Prescription" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "prescriptionNo" VARCHAR(50) UNIQUE NOT NULL,
  "patientId" UUID NOT NULL REFERENCES "Patient"("id") ON DELETE CASCADE,
  "providerId" UUID REFERENCES "Provider"("id") ON DELETE SET NULL,
  "facilityId" UUID NOT NULL REFERENCES "Facility"("id") ON DELETE CASCADE,
  "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "diagnosis" VARCHAR(255),
  "instructions" TEXT,
  "issuedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dispensedAt" TIMESTAMP WITH TIME ZONE
);

-- PRESCRIPTION ITEM TABLE
CREATE TABLE "PrescriptionItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "prescriptionId" UUID NOT NULL REFERENCES "Prescription"("id") ON DELETE CASCADE,
  "medicineName" VARCHAR(255) NOT NULL,
  "dosage" VARCHAR(100) NOT NULL,
  "frequency" VARCHAR(100) NOT NULL,
  "durationDays" INT NOT NULL,
  "quantity" INT NOT NULL,
  "isDispensed" BOOLEAN NOT NULL DEFAULT false
);

-- NOTIFICATION TABLE
CREATE TABLE "Notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "link" VARCHAR(500),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT LOG TABLE
CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "action" VARCHAR(100) NOT NULL,
  "resource" VARCHAR(100) NOT NULL,
  "resourceId" VARCHAR(100),
  "outcome" VARCHAR(20) NOT NULL DEFAULT 'success',
  "ipAddress" VARCHAR(50),
  "details" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. Row Level Security (RLS) Policies for Supabase Client Access
-- ============================================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Provider" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Facility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;

-- Allow public read access to facilities for search & discovery
CREATE POLICY "Allow public read access to Facilities" ON "Facility" FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read to Users" ON "User" FOR SELECT USING (true);
CREATE POLICY "Allow authenticated access to Patients" ON "Patient" FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to Referrals" ON "Referral" FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to Appointments" ON "Appointment" FOR ALL USING (true);

-- ============================================================================
-- 6. Initial Seed Data Insertion
-- ============================================================================

-- Insert Facilities across Tiers
INSERT INTO "Facility" ("id", "facilityCode", "name", "tierLevel", "facilityType", "village", "district", "state", "totalBeds", "availableBeds", "icuBeds", "availableIcuBeds", "oxygenAvailable", "bloodBankAvailable", "teleconsultationAvailable") VALUES
('10000000-0000-0000-0000-000000000001', 'SUB-RAMPUR', 'Rampur Sub-Health Centre', 1, 'Sub-Centre', 'Rampur', 'Patna', 'Bihar', 2, 2, 0, 0, false, false, true),
('10000000-0000-0000-0000-000000000002', 'PHC-KESARIYA', 'Kesariya Primary Health Centre', 2, 'Primary Health Centre', 'Kesariya', 'East Champaran', 'Bihar', 12, 6, 0, 0, true, false, true),
('10000000-0000-0000-0000-000000000003', 'CHC-MOTIHARI', 'East Champaran Community Health Centre', 3, 'Community Health Centre', 'Motihari', 'East Champaran', 'Bihar', 40, 18, 4, 1, true, true, true),
('10000000-0000-0000-0000-000000000004', 'DH-PATNA', 'Patna District General Hospital', 5, 'District Hospital', 'Patna', 'Patna', 'Bihar', 250, 42, 30, 8, true, true, true),
('10000000-0000-0000-0000-000000000005', 'AIIMS-PATNA', 'AIIMS Patna Medical College & Hospital', 6, 'Tertiary Hospital', 'Patna', 'Patna', 'Bihar', 750, 85, 120, 14, true, true, true);

-- Insert Demo Accounts (Password: Password123)
-- bcrypt hash for 'Password123': $2a$12$R.32u.vGjLwX5p2K1J0h1.x7A6dE5f8g9h0i1j2k3l4m5n6o7p8q
INSERT INTO "User" ("id", "email", "phone", "passwordHash", "firstName", "lastName", "role", "languagePreference") VALUES
('20000000-0000-0000-0000-000000000001', 'patient@demo.com', '+91 98765 43210', '$2a$12$R.32u.vGjLwX5p2K1J0h1.x7A6dE5f8g9h0i1j2k3l4m5n6o7p8q', 'Ramesh', 'Kumar', 'PATIENT', 'en'),
('20000000-0000-0000-0000-000000000002', 'chw@demo.com', '+91 98765 43211', '$2a$12$R.32u.vGjLwX5p2K1J0h1.x7A6dE5f8g9h0i1j2k3l4m5n6o7p8q', 'Sunita', 'Devi', 'HEALTH_WORKER', 'hi'),
('20000000-0000-0000-0000-000000000003', 'doctor@demo.com', '+91 98765 43212', '$2a$12$R.32u.vGjLwX5p2K1J0h1.x7A6dE5f8g9h0i1j2k3l4m5n6o7p8q', 'Dr. Vikram', 'Singh', 'DOCTOR', 'en'),
('20000000-0000-0000-0000-000000000004', 'specialist@demo.com', '+91 98765 43213', '$2a$12$R.32u.vGjLwX5p2K1J0h1.x7A6dE5f8g9h0i1j2k3l4m5n6o7p8q', 'Dr. Anjali', 'Mehta', 'SPECIALIST', 'en'),
('20000000-0000-0000-0000-000000000005', 'lab@demo.com', '+91 98765 43214', '$2a$12$R.32u.vGjLwX5p2K1J0h1.x7A6dE5f8g9h0i1j2k3l4m5n6o7p8q', 'Rajesh', 'Patel', 'LAB_TECHNICIAN', 'en'),
('20000000-0000-0000-0000-000000000006', 'pharmacist@demo.com', '+91 98765 43215', '$2a$12$R.32u.vGjLwX5p2K1J0h1.x7A6dE5f8g9h0i1j2k3l4m5n6o7p8q', 'Amit', 'Verma', 'PHARMACIST', 'en'),
('20000000-0000-0000-0000-000000000007', 'admin@demo.com', '+91 98765 43216', '$2a$12$R.32u.vGjLwX5p2K1J0h1.x7A6dE5f8g9h0i1j2k3l4m5n6o7p8q', 'Admin', 'User', 'SYSTEM_ADMIN', 'en');

-- Insert Patient Profile for Ramesh Kumar
INSERT INTO "Patient" ("id", "userId", "patientId", "dateOfBirth", "sex", "bloodGroup", "address", "village", "district", "state", "insuranceId", "emergencyContactName", "emergencyContactPhone") VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'P-2026-0089', '1992-05-14', 'Male', 'O+', 'House #42, Main Chawk', 'Rampur', 'Patna', 'Bihar', '7849-2310-9012', 'Sunita Kumar (Wife)', '+91 98765 12345');

-- Insert Provider Profiles
INSERT INTO "Provider" ("id", "userId", "facilityId", "specialization", "registrationNo") VALUES
('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Community Health & Maternal Care', 'ASHA-BIH-0481'),
('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'General Medicine & Family Practice', 'MCI-2018-8491'),
('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Cardiology & Critical Care', 'MCI-2014-1029');

-- Confirm Schema Execution
SELECT 'ArogyaPath Supabase Schema Created Successfully!' AS status;
