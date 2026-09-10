import { Router } from 'express';
import { prisma } from '../../index';
import { AppError } from '../../middleware/error.middleware';

export const triageRouter = Router();

export interface SymptomInput {
  symptom: string;
  severity: string; // mild, moderate, severe
  duration?: string;
  location?: string;
}

export interface TriageInput {
  symptoms: SymptomInput[];
  age?: number;
  sex?: string;
  hasComorbidities?: boolean;
  comorbidities?: string[];
  isPregnant?: boolean;
  vitals?: {
    systolic?: number;
    diastolic?: number;
    pulse?: number;
    temp?: number;
    spo2?: number;
  };
}

// Layer 1: Deterministic Red Flag Rules
function checkRedFlags(input: TriageInput): { isEmergency: boolean; flags: string[]; category?: string } {
  const flags: string[] = [];

  for (const s of input.symptoms) {
    const name = s.symptom.toLowerCase();
    if (name.includes('chest pain') || name.includes('heart attack')) {
      flags.push('Severe chest pain detected — potential cardiac event');
    }
    if (name.includes('breathing') || name.includes('shortness of breath') || name.includes('gasping')) {
      flags.push('Severe respiratory distress detected');
    }
    if (name.includes('unconscious') || name.includes('fainting') || name.includes('unresponsive')) {
      flags.push('Altered consciousness / coma detected');
    }
    if (name.includes('stroke') || name.includes('paralysis') || name.includes('speech')) {
      flags.push('Neurological deficit / stroke signs detected');
    }
  }

  if (input.vitals) {
    if (input.vitals.spo2 && input.vitals.spo2 < 90) {
      flags.push(`Severe hypoxia (SpO2: ${input.vitals.spo2}%)`);
    }
    if (input.vitals.systolic && input.vitals.systolic < 80) {
      flags.push(`Severe hypotension / Shock (BP: ${input.vitals.systolic}/${input.vitals.diastolic})`);
    }
  }

  if (flags.length > 0) {
    return { isEmergency: true, flags, category: 'EMERGENCY' };
  }

  return { isEmergency: false, flags: [] };
}

// Layer 2: Algorithmic Risk Scoring (0 - 100)
function calculateRiskScore(input: TriageInput): number {
  let score = 0;

  for (const s of input.symptoms) {
    if (s.severity === 'severe') score += 25;
    else if (s.severity === 'moderate') score += 15;
    else score += 5;

    const name = s.symptom.toLowerCase();
    if (name.includes('fever') || name.includes('chills')) score += 15;
    if (name.includes('headache') || name.includes('dizziness')) score += 10;
    if (name.includes('vomiting') || name.includes('diarrhea')) score += 15;
    if (name.includes('abdominal pain')) score += 15;
  }

  if (input.age !== undefined) {
    if (input.age < 5) score += 15; // Vulnerable pediatric
    else if (input.age > 60) score += 15; // Vulnerable geriatric
  }

  if (input.isPregnant) score += 15;
  if (input.hasComorbidities) score += 15;

  return Math.min(score, 100);
}

function determineCategory(score: number, redFlagCategory?: string): string {
  if (redFlagCategory === 'EMERGENCY') return 'EMERGENCY';
  if (score >= 60) return 'EMERGENCY';
  if (score >= 35) return 'URGENT';
  if (score >= 15) return 'ROUTINE';
  return 'SELF_CARE';
}

function getRecommendation(category: string): { careLevel: string; timeWindow: string; action: string } {
  switch (category) {
    case 'EMERGENCY':
      return {
        careLevel: 'CHC / District Hospital / ER',
        timeWindow: 'IMMEDIATE (0-1 hours)',
        action: 'Immediate transport to emergency facility. Activate 108 ambulance service.',
      };
    case 'URGENT':
      return {
        careLevel: 'PHC / CHC Doctor Consultation',
        timeWindow: 'Within 24 Hours',
        action: 'Schedule consultation at Primary Health Centre. Monitor vitals closely.',
      };
    case 'ROUTINE':
      return {
        careLevel: 'Sub-Centre / PHC Outpatient',
        timeWindow: 'Within 48-72 Hours',
        action: 'Visit nearest Sub-Centre or PHC for routine consultation and lab tests.',
      };
    case 'SELF_CARE':
    default:
      return {
        careLevel: 'Home Monitoring / Health Worker Check-in',
        timeWindow: 'As Needed',
        action: 'Provide supportive home care (hydration, rest). Contact ASHA worker if symptoms worsen.',
      };
  }
}

// Perform Triage Assessment Handler
const handleTriageAssessment = async (req: any, res: any, next: any) => {
  try {
    const { patientId, symptoms, age, sex, hasComorbidities, comorbidities, isPregnant, vitals } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'At least one symptom is required.');
    }

    const input: TriageInput = { symptoms, age, sex, hasComorbidities, comorbidities, isPregnant, vitals };

    // Layer 1: Red flag check
    const redFlagResult = checkRedFlags(input);

    // Layer 2: Risk scoring
    const riskScore = calculateRiskScore(input);

    // Determine category
    const category = determineCategory(riskScore, redFlagResult.category);
    const recommendation = getRecommendation(category);

    let aiSummary = `Layer 1 Red Flags: ${redFlagResult.flags.length > 0 ? redFlagResult.flags.join('; ') : 'None'}. Layer 2 Risk Score: ${riskScore}/100. Action: ${recommendation.action}`;

    // Resolve valid patient ID
    let validPatientId = null;
    if (patientId && typeof patientId === 'string') {
      const p = await prisma.patient.findUnique({ where: { id: patientId } });
      if (p) validPatientId = p.id;
    }
    if (!validPatientId) {
      const p = await prisma.patient.findFirst();
      if (p) validPatientId = p.id;
    }

    // Save assessment
    const assessment = await prisma.triageAssessment.create({
      data: {
        patientId: validPatientId!,
        conductedBy: req.user?.id || 'system',
        category,
        riskScore,
        redFlagsDetected: redFlagResult.flags.length > 0 ? JSON.stringify(redFlagResult.flags) : null,
        aiSummary,
        aiRecommendation: recommendation.action,
        recommendedCareLevel: recommendation.careLevel,
      },
    });

    res.json({
      success: true,
      data: {
        id: assessment.id,
        category,
        riskScore,
        redFlagsDetected: redFlagResult.flags,
        aiSummary,
        recommendation,
        disclaimer: 'This assessment is for decision support only and does not replace evaluation by a qualified healthcare professional.',
      },
    });
  } catch (err) {
    next(err);
  }
};

// Mount routes for both POST / and POST /assess
triageRouter.post('/', handleTriageAssessment);
triageRouter.post('/assess', handleTriageAssessment);
