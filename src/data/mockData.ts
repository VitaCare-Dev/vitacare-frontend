import type {
    AlertItem,
    GlucosePeriod,
    HealthControlOption,
    IntakeHistoryItem,
    Patient,
    Provider,
    VitalMeasurement,
} from "@/types";

export const patient: Patient = {
  fullName: "María Carolina Pérez",
  rut: "12.345.678-9",
  birthDate: "15/05/1985",
  phonePrimary: "+56 9 8765 4321",
  phoneSecondary: "+56 9 1234 5678",
  address: "Av. Los Carrera 1234, Depto. 56, Concepción, Biobío",
  diseases: ["Diabetes tipo 2", "Hipertensión arterial"],
};

export const summaryMeasurements: VitalMeasurement[] = [
  { label: "Presión arterial", value: "120/80", unit: "mmHg", icon: "presion" },
  { label: "Temperatura", value: "36.6", unit: "°C", icon: "temperatura" },
  { label: "Peso", value: "65.2", unit: "kg", icon: "peso" },
  { label: "Glucosa", value: "98", unit: "mg/dL", icon: "glucosa" },
];

export const intakeHistory: IntakeHistoryItem[] = [
  {
    id: "i1",
    medication: "Metformina 850 mg",
    scheduledAt: "14/06/2026 08:00",
    takenAt: "14/06/2026 08:05",
    status: "Tomada",
  },
  {
    id: "i2",
    medication: "Metformina 850 mg",
    scheduledAt: "14/06/2026 20:00",
    takenAt: "14/06/2026 20:22",
    status: "Tomada",
  },
  {
    id: "i3",
    medication: "Atorvastatina 20 mg",
    scheduledAt: "14/06/2026 22:00",
    takenAt: "--",
    status: "No tomada",
  },
];

export const glucosePeriods: { period: GlucosePeriod; description: string }[] =
  [
    {
      period: "En ayunas",
      description: "Se mide antes del desayuno para revisar el control basal.",
    },
    {
      period: "Después de comer",
      description: "Se mide 1 a 2 horas después de una comida principal.",
    },
    {
      period: "Antes de dormir",
      description: "Ayuda a revisar la glicemia nocturna y ajustar el plan.",
    },
  ];

export const healthControlOptions: HealthControlOption[] = [
  {
    key: "vitales",
    label: "Signos vitales",
    icon: "presion",
    description: "Presión, temperatura y peso.",
  },
  {
    key: "glucosa",
    label: "Glucosa",
    icon: "glucosa",
    description: "Control de glicemia capilar.",
  },
  {
    key: "tratamiento",
    label: "Tratamiento",
    icon: "medicamento",
    description: "Listado y seguimiento de medicamentos.",
  },
  {
    key: "lipidos",
    label: "Colesterol / lípidos",
    icon: "registros",
    description: "Perfil lipídico y triglicéridos.",
  },
];

export const alerts: AlertItem[] = [
  {
    id: "a1",
    type: "alert",
    title: "Presión diastólica elevada",
    date: "14/06/2026",
    detail: "Se recomienda volver a medir y registrar el valor en reposo.",
    status: "No leída",
  },
  {
    id: "a2",
    type: "alert",
    title: "Control de glucosa",
    date: "14/06/2026",
    detail: "El valor se encuentra dentro de rango, mantener seguimiento.",
    status: "Leída",
  },
  {
    id: "r1",
    type: "recommendation",
    title: "Reducir sodio",
    date: "13/06/2026",
    detail:
      "Prioriza alimentos frescos, legumbres y preparaciones bajas en sal.",
    status: "Leída",
  },
  {
    id: "r2",
    type: "recommendation",
    title: "Agregar fibra al desayuno",
    date: "12/06/2026",
    detail: "Avena, fruta y frutos secos ayudan al control glucémico.",
    status: "No leída",
  },
];

export const providers: Provider[] = [
  {
    id: "p1",
    name: "Dra. Camila Rojas",
    specialty: "Medicina General",
    registration: "123456",
    status: "Validado",
    region: "Región Metropolitana",
    commune: "Maipú",
  },
  {
    id: "p2",
    name: "Dr. Felipe Araya",
    specialty: "Cardiología",
    registration: "789456",
    status: "Validado",
    region: "Región Metropolitana",
    commune: "Santiago",
  },
  {
    id: "p3",
    name: "Nutricionista Paula Medina",
    specialty: "Nutrición",
    registration: "456123",
    status: "Validado",
    region: "Biobío",
    commune: "Concepción",
  },
  {
    id: "p4",
    name: "Profesional no encontrado",
    specialty: "Sin especialidad",
    registration: undefined,
    status: "No encontrado",
    region: "-",
    commune: "-",
  },
];
