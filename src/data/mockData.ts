import type {
    AlertItem,
    ChatMessage,
    ControlHistoryItem,
    GlucosePeriod,
    HealthControlOption,
    IntakeHistoryItem,
    Medication,
    Patient,
    VitalMeasurement,
    Provider,
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

export const medications: Medication[] = [
  {
    id: "1",
    name: "Metformina 850 mg",
    dose: "850 mg",
    frequency: "Cada 12 horas",
    startDate: "01/04/2026",
    endDate: "Indefinido",
    active: true,
    takenToday: "1/2",
  },
  {
    id: "2",
    name: "Losartán 50 mg",
    dose: "50 mg",
    frequency: "Una vez al día",
    startDate: "10/03/2026",
    endDate: "Indefinido",
    active: true,
    takenToday: "1/1",
  },
  {
    id: "3",
    name: "Atorvastatina 20 mg",
    dose: "20 mg",
    frequency: "Una vez al día",
    startDate: "18/02/2026",
    endDate: "Indefinido",
    active: false,
    takenToday: "0/1",
  },
];

export const history: ControlHistoryItem[] = [
  {
    id: "h1",
    date: "14/06/2026",
    time: "08:15",
    bloodPressure: "140/65",
    temperature: "36.5",
    weight: "65.1",
    glucose: "110",
    notes: "Se registró presión elevada por la mañana.",
  },
  {
    id: "h2",
    date: "13/06/2026",
    time: "20:30",
    bloodPressure: "143/67",
    temperature: "36.0",
    weight: "65.3",
    glucose: "98",
    notes: "Paciente refiere buena adherencia a medicamentos.",
  },
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

export const messages: ChatMessage[] = [
  {
    id: "m1",
    sender: "assistant",
    text: "Hola María. Soy tu asistente virtual de salud. ¿Cómo puedo ayudarte hoy?",
    time: "08:30",
  },
  {
    id: "m2",
    sender: "user",
    text: "He tenido dolores de cabeza y mareos últimamente.",
    time: "08:31",
  },
  {
    id: "m3",
    sender: "assistant",
    text: "Entiendo. ¿Desde cuándo notas estos síntomas? También revisa tu presión y glucosa si puedes.",
    time: "08:32",
  },
  {
    id: "m4",
    sender: "user",
    text: "Mi presión fue de 140/65 en la mañana.",
    time: "08:33",
  },
  {
    id: "m5",
    sender: "assistant",
    text: "Gracias por el dato. Regístralo en tus controles y mantente atenta a nuevos síntomas.",
    time: "08:34",
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
