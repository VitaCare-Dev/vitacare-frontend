export type DiseaseRecord = {
  diseaseId: number;
  name: string;
  description: string;
};

export type AddressRecord = {
  addressId: number;
  patientId: number;
  street: string;
  number: string;
  commune: string;
  region: string;
};

export type MedicalThresholdRecord = {
  thresholdId: number;
  patientId: number;
  glucoseMax: number;
  glucoseMin: number;
  systolicMax: number;
  diastolicMax: number;
  temperatureMax: number;
};

export type PatientMedicalProfileRecord = {
  patientId: number;
  userId: number;
  rut: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  birthDate: string;
  primaryPhone: string;
  secondaryPhone: string;
  address: AddressRecord;
  diseases: DiseaseRecord[];
  thresholds: MedicalThresholdRecord;
};

export type TreatmentMedicationRecord = {
  medicationId: number;
  patientId: number;
  medicationName: string;
  dose: string;
  frequencyHours: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
  takenToday?: string;
};

export const patientMedicalProfile: PatientMedicalProfileRecord = {
  patientId: 1,
  userId: 1,
  rut: "12.345.678-9",
  firstName: "María Carolina",
  lastNamePaternal: "Pérez",
  lastNameMaternal: "Soto",
  birthDate: "15/05/1985",
  primaryPhone: "+56 9 8765 4321",
  secondaryPhone: "+56 9 1234 5678",
  address: {
    addressId: 1,
    patientId: 1,
    street: "Av. Los Carrera",
    number: "1234, Depto. 56",
    commune: "Concepción",
    region: "Biobío",
  },
  diseases: [
    {
      diseaseId: 1,
      name: "Diabetes tipo 2",
      description: "Control glucémico diario y seguimiento nutricional.",
    },
    {
      diseaseId: 2,
      name: "Hipertensión arterial",
      description: "Seguimiento de presión arterial y adherencia terapéutica.",
    },
  ],
  thresholds: {
    thresholdId: 1,
    patientId: 1,
    glucoseMax: 140,
    glucoseMin: 80,
    systolicMax: 135,
    diastolicMax: 85,
    temperatureMax: 37.5,
  },
};

export const initialTreatmentMedications: TreatmentMedicationRecord[] = [
  {
    medicationId: 1,
    patientId: 1,
    medicationName: "Metformina",
    dose: "850 mg",
    frequencyHours: 12,
    startDate: "01/04/2026",
    endDate: null,
    active: true,
    takenToday: "1/2",
  },
  {
    medicationId: 2,
    patientId: 1,
    medicationName: "Losartán",
    dose: "50 mg",
    frequencyHours: 24,
    startDate: "10/03/2026",
    endDate: null,
    active: true,
    takenToday: "1/1",
  },
  {
    medicationId: 3,
    patientId: 1,
    medicationName: "Atorvastatina",
    dose: "20 mg",
    frequencyHours: 24,
    startDate: "18/02/2026",
    endDate: "20/06/2026",
    active: false,
    takenToday: "0/1",
  },
];
