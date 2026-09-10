import { PrismaClient, Role, FacilityType, ReferralStatus, DiagnosticStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.offlineSyncRecord.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.healthEducation.deleteMany();
  await prisma.diagnosticResult.deleteMany();
  await prisma.diagnosticOrder.deleteMany();
  await prisma.diagnosticTest.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.vital.deleteMany();
  await prisma.symptomRecord.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.referralStatusHistory.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.appointmentSlot.deleteMany();
  await prisma.triageAssessment.deleteMany();
  await prisma.triageRule.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.condition.deleteMany();
  await prisma.patientMedication.deleteMany();
  await prisma.immunization.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.facilityStaff.deleteMany();
  await prisma.facilityDiagnostic.deleteMany();
  await prisma.facilityEquipment.deleteMany();
  await prisma.facilityService.deleteMany();
  await prisma.department.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  // 1. Create Facilities
  const scRampur = await prisma.facility.create({
    data: {
      name: 'Sub-Centre Rampur',
      type: FacilityType.SUB_CENTRE,
      level: 1,
      address: 'Near Panchayat Bhawan, Rampur',
      village: 'Rampur',
      district: 'Sitapur',
      state: 'Uttar Pradesh',
      pincode: '261001',
      latitude: 27.5684,
      longitude: 80.6819,
      phone: '+91-9876543210',
      emergencyAvailable: false,
      totalBeds: 2,
      availableBeds: 2,
      services: {
        create: [
          { serviceName: 'Basic Triage & First Aid', isAvailable: true },
          { serviceName: 'Maternal & Child Immunization', isAvailable: true },
          { serviceName: 'Rapid Diagnostic Tests (Malaria/Dengue)', isAvailable: true },
        ],
      },
      diagnosticCapabilities: {
        create: [
          { testName: 'Rapid Malaria Antigen', isAvailable: true, turnaroundHours: 1 },
          { testName: 'Blood Glucose Test', isAvailable: true, turnaroundHours: 1 },
        ],
      },
    },
  });

  const phcKesariya = await prisma.facility.create({
    data: {
      name: 'Primary Health Centre (PHC) Kesariya',
      type: FacilityType.PHC,
      level: 2,
      address: 'Main Road, Kesariya Block',
      village: 'Kesariya',
      district: 'Sitapur',
      state: 'Uttar Pradesh',
      pincode: '261002',
      latitude: 27.5891,
      longitude: 80.6952,
      phone: '+91-9876543211',
      operatingHoursStart: '08:00',
      operatingHoursEnd: '18:00',
      emergencyAvailable: true,
      totalBeds: 6,
      availableBeds: 4,
      services: {
        create: [
          { serviceName: 'General Outpatient Consultation', isAvailable: true },
          { serviceName: 'Basic Laboratory Services', isAvailable: true },
          { serviceName: 'Minor Surgical Procedures', isAvailable: true },
          { serviceName: 'Antenatal Care', isAvailable: true },
        ],
      },
      diagnosticCapabilities: {
        create: [
          { testName: 'Complete Blood Count (CBC)', isAvailable: true, turnaroundHours: 4 },
          { testName: 'Blood Smear for Malaria', isAvailable: true, turnaroundHours: 2 },
          { testName: 'Urine Routine & Microscopy', isAvailable: true, turnaroundHours: 2 },
        ],
      },
    },
  });

  const dhSitapur = await prisma.facility.create({
    data: {
      name: 'Sitapur District Hospital',
      type: FacilityType.DISTRICT_HOSPITAL,
      level: 5,
      address: 'Civil Lines, District HQ',
      village: 'Sitapur HQ',
      district: 'Sitapur',
      state: 'Uttar Pradesh',
      pincode: '261001',
      latitude: 27.5750,
      longitude: 80.6650,
      phone: '+91-9876543212',
      operatingHoursStart: '00:00',
      operatingHoursEnd: '23:59',
      emergencyAvailable: true,
      totalBeds: 200,
      availableBeds: 45,
      services: {
        create: [
          { serviceName: '24/7 Emergency Care', isAvailable: true },
          { serviceName: 'Internal Medicine Specialty', isAvailable: true },
          { serviceName: 'Pediatrics & Neonatal Care', isAvailable: true },
          { serviceName: 'General Surgery', isAvailable: true },
          { serviceName: 'Advanced Diagnostic Center', isAvailable: true },
        ],
      },
      departments: {
        create: [
          { name: 'Emergency & Trauma' },
          { name: 'General Medicine' },
          { name: 'Pediatrics' },
          { name: 'Obstetrics & Gynecology' },
          { name: 'Pathology & Microbiology' },
          { name: 'Radiology' },
        ],
      },
      diagnosticCapabilities: {
        create: [
          { testName: 'Complete Blood Count (CBC)', isAvailable: true, turnaroundHours: 2 },
          { testName: 'Blood Smear for Malaria', isAvailable: true, turnaroundHours: 2 },
          { testName: 'Liver Function Test (LFT)', isAvailable: true, turnaroundHours: 4 },
          { testName: 'Kidney Function Test (KFT)', isAvailable: true, turnaroundHours: 4 },
          { testName: 'Chest X-Ray Digital', isAvailable: true, turnaroundHours: 1 },
          { testName: 'Abdominal Ultrasound', isAvailable: true, turnaroundHours: 2 },
        ],
      },
    },
  });

  // 2. Create Users & Profiles
  // Patients
  const patientUser = await prisma.user.create({
    data: {
      email: 'patient@demo.com',
      passwordHash,
      firstName: 'Ramesh',
      lastName: 'Kumar',
      phone: '+91-9988776655',
      role: Role.PATIENT,
      languagePreference: 'hi',
      patient: {
        create: {
          patientId: 'P-2026-0001',
          dateOfBirth: new Date('1985-06-15'),
          sex: 'male',
          bloodGroup: 'O+',
          village: 'Rampur',
          district: 'Sitapur',
          state: 'Uttar Pradesh',
          emergencyContactName: 'Kamla Devi',
          emergencyContactPhone: '+91-9988776656',
          emergencyContactRelation: 'Spouse',
        },
      },
    },
    include: { patient: true },
  });

  const patient2User = await prisma.user.create({
    data: {
      email: 'patient2@demo.com',
      passwordHash,
      firstName: 'Sita',
      lastName: 'Devi',
      phone: '+91-9988776677',
      role: Role.PATIENT,
      languagePreference: 'en',
      patient: {
        create: {
          patientId: 'P-2026-0002',
          dateOfBirth: new Date('1992-09-20'),
          sex: 'female',
          bloodGroup: 'A+',
          village: 'Kesariya',
          district: 'Sitapur',
          state: 'Uttar Pradesh',
        },
      },
    },
    include: { patient: true },
  });

  // Health Worker (CHW / ASHA)
  const chwUser = await prisma.user.create({
    data: {
      email: 'chw@demo.com',
      passwordHash,
      firstName: 'Sunita',
      lastName: 'Devi',
      phone: '+91-9876500001',
      role: Role.HEALTH_WORKER,
      provider: {
        create: {
          specialization: 'Community Health',
          qualification: 'ANM / ASHA Worker',
        },
      },
    },
    include: { provider: true },
  });

  // Nurse
  const nurseUser = await prisma.user.create({
    data: {
      email: 'nurse@demo.com',
      passwordHash,
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+91-9876500002',
      role: Role.NURSE,
      provider: {
        create: {
          specialization: 'General Nursing',
          qualification: 'B.Sc. Nursing',
        },
      },
    },
    include: { provider: true },
  });

  // Doctor (PHC Medical Officer)
  const doctorUser = await prisma.user.create({
    data: {
      email: 'doctor@demo.com',
      passwordHash,
      firstName: 'Dr. Vikram',
      lastName: 'Singh',
      phone: '+91-9876500003',
      role: Role.DOCTOR,
      provider: {
        create: {
          registrationNo: 'MCI-2018-8849',
          specialization: 'General Medicine',
          qualification: 'MBBS',
          experienceYears: 7,
        },
      },
    },
    include: { provider: true },
  });

  // Specialist (District Hospital Physician)
  const specialistUser = await prisma.user.create({
    data: {
      email: 'specialist@demo.com',
      passwordHash,
      firstName: 'Dr. Anjali',
      lastName: 'Mehta',
      phone: '+91-9876500004',
      role: Role.SPECIALIST,
      provider: {
        create: {
          registrationNo: 'MCI-2012-3321',
          specialization: 'Internal Medicine / Infectious Diseases',
          qualification: 'MBBS, MD Medicine',
          experienceYears: 14,
        },
      },
    },
    include: { provider: true },
  });

  // Lab Tech
  const labUser = await prisma.user.create({
    data: {
      email: 'lab@demo.com',
      passwordHash,
      firstName: 'Rajesh',
      lastName: 'Patel',
      phone: '+91-9876500005',
      role: Role.LAB_TECHNICIAN,
      provider: {
        create: {
          specialization: 'Pathology Diagnostics',
          qualification: 'DMLT',
        },
      },
    },
    include: { provider: true },
  });

  // Pharmacist
  const pharmacistUser = await prisma.user.create({
    data: {
      email: 'pharmacist@demo.com',
      passwordHash,
      firstName: 'Amit',
      lastName: 'Verma',
      phone: '+91-9876500006',
      role: Role.PHARMACIST,
      provider: {
        create: {
          specialization: 'Pharmacy',
          qualification: 'B.Pharm',
        },
      },
    },
    include: { provider: true },
  });

  // Facility Admin
  await prisma.user.create({
    data: {
      email: 'facilityadmin@demo.com',
      passwordHash,
      firstName: 'Sanjay',
      lastName: 'Gupta',
      phone: '+91-9876500007',
      role: Role.FACILITY_ADMIN,
    },
  });

  // System Admin
  await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+91-9876500008',
      role: Role.SYSTEM_ADMIN,
    },
  });

  // Link Staff to Facilities
  if (doctorUser.provider) {
    await prisma.facilityStaff.create({
      data: { facilityId: phcKesariya.id, providerId: doctorUser.provider.id, role: 'Medical Officer' },
    });
  }
  if (specialistUser.provider) {
    await prisma.facilityStaff.create({
      data: { facilityId: dhSitapur.id, providerId: specialistUser.provider.id, role: 'Senior Consultant' },
    });
  }

  // 3. Create Demo Patient Journey Data
  const patientId = patientUser.patient!.id;

  // Initial Vitals
  await prisma.vital.create({
    data: {
      patientId,
      temperature: 102.4,
      systolicBP: 130,
      diastolicBP: 85,
      heartRate: 110,
      respiratoryRate: 22,
      oxygenSaturation: 97.0,
      recordedBy: chwUser.id,
    },
  });

  // Initial Triage
  const triage = await prisma.triageAssessment.create({
    data: {
      patientId,
      conductedBy: chwUser.id,
      category: 'URGENT',
      riskScore: 72,
      redFlagsDetected: JSON.stringify(['High Grade Fever (>102°F)', 'Tachycardia (HR > 100)']),
      aiSummary: 'Patient exhibits high fever and tachycardia. Suspect acute infection or vector-borne illness (malaria/dengue). Immediate PHC referral advised for diagnostic testing.',
      recommendedFacilityId: phcKesariya.id,
      recommendedCareLevel: 'PHC',
    },
  });

  // Initial PHC Encounter
  const encounter = await prisma.encounter.create({
    data: {
      patientId,
      providerId: doctorUser.provider!.id,
      facilityId: phcKesariya.id,
      chiefComplaint: 'High grade fever with chills and rigors for 4 days',
      presentIllness: 'Patient reports intermittent high fever, severe headache, and body aches starting 4 days ago.',
      assessment: 'Suspected Complicated Malaria',
      diagnosis: 'Plasmodium Falciparum Infection Suspected',
      diagnosisCode: 'B50.9',
      treatmentPlan: 'Order CBC and Malaria Smear immediately. Initiate supportive therapy.',
      status: 'completed',
    },
  });

  // Diagnostic Test Definition & Order
  const cbcTest = await prisma.diagnosticTest.create({
    data: { name: 'Complete Blood Count (CBC)', category: 'Hematology', normalRange: 'Hb: 13-17 g/dL, WBC: 4000-11000/uL, Platelets: 1.5-4.5 Lakh/uL' },
  });

  const diagOrder = await prisma.diagnosticOrder.create({
    data: {
      orderId: 'LAB-2026-00001',
      patientId,
      encounterId: encounter.id,
      testId: cbcTest.id,
      orderingProviderId: doctorUser.provider!.id,
      facilityId: phcKesariya.id,
      priority: 'urgent',
      reason: 'Rule out severe anemia and thrombocytopenia in high fever',
      status: DiagnosticStatus.RELEASED,
      resultReadyAt: new Date(),
      releasedAt: new Date(),
    },
  });

  await prisma.diagnosticResult.createMany({
    data: [
      { orderId: diagOrder.id, parameterName: 'Hemoglobin', value: '9.2', unit: 'g/dL', referenceRange: '13-17', isAbnormal: true, enteredBy: labUser.id },
      { orderId: diagOrder.id, parameterName: 'Platelet Count', value: '75,000', unit: '/uL', referenceRange: '150,000-450,000', isAbnormal: true, enteredBy: labUser.id },
      { orderId: diagOrder.id, parameterName: 'WBC Count', value: '12,400', unit: '/uL', referenceRange: '4,000-11,000', isAbnormal: true, enteredBy: labUser.id },
    ],
  });

  // Referral to District Hospital
  const referral = await prisma.referral.create({
    data: {
      referralId: 'REF-2026-00001',
      patientId,
      encounterId: encounter.id,
      referringFacilityId: phcKesariya.id,
      receivingFacilityId: dhSitapur.id,
      referringProviderId: doctorUser.provider!.id,
      receivingProviderId: specialistUser.provider!.id,
      reason: 'Thrombocytopenia (Platelets 75k) with high fever — requires specialist infectious disease review and inpatient monitoring',
      urgency: 'urgent',
      clinicalSummary: '38y male presenting with 4-day high fever, Hb 9.2, Platelets 75k. Suspected complicated P. falciparum malaria.',
      status: ReferralStatus.ACCEPTED,
    },
  });

  await prisma.referralStatusHistory.createMany({
    data: [
      { referralId: referral.id, status: ReferralStatus.SUBMITTED, changedBy: doctorUser.id, notes: 'Referral generated from PHC Kesariya.' },
      { referralId: referral.id, status: ReferralStatus.ACCEPTED, changedBy: specialistUser.id, notes: 'Accepted by Dr. Anjali Mehta at District Hospital Sitapur.' },
    ],
  });

  // Appointment at District Hospital
  await prisma.appointment.create({
    data: {
      appointmentId: 'APT-2026-00001',
      patientId,
      facilityId: dhSitapur.id,
      department: 'General Medicine',
      providerName: 'Dr. Anjali Mehta',
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      timeSlot: '10:00 - 10:30 AM',
      type: 'referral',
      priority: 'urgent',
      reason: 'Specialist Evaluation for Suspected Complicated Malaria',
      status: 'CONFIRMED',
    },
  });

  // Prescription
  const rx = await prisma.prescription.create({
    data: {
      prescriptionId: 'RX-2026-00001',
      patientId,
      encounterId: encounter.id,
      providerId: doctorUser.provider!.id,
      notes: 'Take medications after food. Drink plenty of fluids.',
      status: 'active',
      dispensingStatus: 'dispensed',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      { prescriptionId: rx.id, medicineName: 'Paracetamol 650mg', dosage: '1 tablet', frequency: 'Three times daily', route: 'oral', duration: '5 days', quantity: 15, instructions: 'For fever control' },
      { prescriptionId: rx.id, medicineName: 'Artemether + Lumefantrine (Coartem)', dosage: '4 tablets', frequency: 'Twice daily', route: 'oral', duration: '3 days', quantity: 24, instructions: 'Complete full antimalarial course' },
      { prescriptionId: rx.id, medicineName: 'ORS Sachet', dosage: '1 sachet in 1L water', frequency: 'As needed', route: 'oral', duration: '5 days', quantity: 5, instructions: 'Maintain hydration' },
    ],
  });

  // 4. Health Education Materials
  await prisma.healthEducation.createMany({
    data: [
      {
        titleEn: 'Malaria Prevention and Early Warning Signs',
        titleHi: 'मलेरिया से बचाव और शुरुआती लक्षण',
        titleUr: 'ملیریا سے بچاؤ اور ابتدائی علامات',
        contentEn: 'Use bed nets treated with insecticide. Cover water containers. Seek medical help immediately if high fever occurs with chills.',
        contentHi: 'मच्छरदानी का प्रयोग करें। पानी जमा न होने दें। यदि ठंड लगकर तेज़ बुखार आए तो तुरंत निकटतम स्वास्थ्य केंद्र जाएं।',
        contentUr: 'مچھر دانی کا استعمال کریں۔ پانی جمع نہ ہونے دیں۔ اگر تیز بخار آئے تو فوری طور پر قریبی مرکز صحت کا دورہ کریں۔',
        category: 'preventive_care',
        icon: 'bug',
        isPublished: true,
      },
      {
        titleEn: 'Maternal Nutrition During Pregnancy',
        titleHi: 'गर्भावस्था के दौरान गर्भवती महिला का पोषण',
        titleUr: 'حمل کے دوران ماں کی غذائیت',
        contentEn: 'Consume iron-rich foods, leafy vegetables, and take Iron Folic Acid tablets as advised by ASHA / ANM worker.',
        contentHi: 'हरी पत्तेदार सब्जियां, दालें और फल खाएं। आशा / एएनएम दीदी की सलाह पर आयरन फोलिक एसिड गोली अवश्य लें।',
        contentUr: 'سبز پتے دار سبزیاں اور پھل کھائیں۔ آشا دی دی کے مشورے پر آئرن کی گولیاں لازمی لیں۔',
        category: 'maternal_health',
        icon: 'heart',
        isPublished: true,
      },
    ],
  });

  console.log('✅ Seed complete! Created demo facilities, users, patient records, triage, referrals, and diagnostic tests.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
