export type IconTone = "green" | "white";

export type Patient = {
  fullName: string;
  rut: string;
  birthDate: string;
  phonePrimary: string;
  phoneSecondary: string;
  address: string;
  diseases: string[];
};

export type VitalMeasurement = {
  label: string;
  value: string;
  unit: string;
  icon: "presion" | "glucosa" | "peso" | "corazon" | "temperatura";
};

export type Medication = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  startDate: string;
  endDate: string;
  active: boolean;
  takenToday?: string;
};

export type ControlHistoryItem = {
  id: string;
  date: string;
  time: string;
  bloodPressure: string;
  temperature: string;
  weight: string;
  glucose: string;
  notes: string;
};

export type IntakeHistoryItem = {
  id: string;
  medication: string;
  scheduledAt: string;
  takenAt: string;
  status: "Tomada" | "No tomada";
};

export type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  time: string;
};

export type AlertItem = {
  id: string;
  type: "alert" | "recommendation";
  title: string;
  date: string;
  detail: string;
  status: "Leída" | "No leída";
};

export type GlucosePeriod =
  | "En ayunas"
  | "Después de comer"
  | "Antes de dormir";

export type HealthControlOption = {
  key: "vitales" | "glucosa" | "tratamiento" | "lipidos";
  label: string;
  icon: "presion" | "glucosa" | "medicamento" | "registros";
  description: string;
};

export type Provider = {
  id: string;
  name: string;
  specialty: string;
  registration?: string;
  status: "Validado" | "No encontrado";
  region: string;
  commune: string;
};

