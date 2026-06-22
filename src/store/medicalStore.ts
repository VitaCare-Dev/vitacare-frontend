import { useSyncExternalStore } from "react";

import { initialTreatmentMedications, patientMedicalProfile, type TreatmentMedicationRecord } from "@/data/medicalModel";
import type { Medication } from "@/types";

type CreateTreatmentMedicationInput = {
  medicationName: string;
  dose: string;
  frequencyHours: number;
  startDate: string;
  endDate?: string;
  active: boolean;
};

let treatmentMedications = [...initialTreatmentMedications];

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getTreatmentMedicationSnapshot() {
  return treatmentMedications;
}

function formatFrequency(frequencyHours: number) {
  if (frequencyHours === 24) {
    return "Una vez al día";
  }

  if (frequencyHours === 12) {
    return "Cada 12 horas";
  }

  if (frequencyHours === 8) {
    return "Cada 8 horas";
  }

  return `Cada ${frequencyHours} horas`;
}

function toMedication(record: TreatmentMedicationRecord): Medication {
  return {
    id: String(record.medicationId),
    name: `${record.medicationName} ${record.dose}`,
    dose: record.dose,
    frequency: formatFrequency(record.frequencyHours),
    startDate: record.startDate,
    endDate: record.endDate ?? "Indefinido",
    active: record.active,
    takenToday: record.takenToday,
  };
}

export function useTreatmentMedicationRecords() {
  return useSyncExternalStore(
    subscribe,
    getTreatmentMedicationSnapshot,
    getTreatmentMedicationSnapshot,
  );
}

export function useTreatmentMedications() {
  return useTreatmentMedicationRecords().map(toMedication);
}

export function useNextTreatmentMedication() {
  const records = useTreatmentMedicationRecords();
  const nextRecord = records.find((record) => record.active) ?? records[0];
  return nextRecord ? toMedication(nextRecord) : null;
}

export function addTreatmentMedication(input: CreateTreatmentMedicationInput) {
  const nextMedicationId =
    treatmentMedications.reduce(
      (maxId, item) => Math.max(maxId, item.medicationId),
      0,
    ) + 1;

  const nextRecord: TreatmentMedicationRecord = {
    medicationId: nextMedicationId,
    patientId: patientMedicalProfile.patientId,
    medicationName: input.medicationName.trim(),
    dose: input.dose.trim(),
    frequencyHours: input.frequencyHours,
    startDate: input.startDate.trim(),
    endDate: input.endDate?.trim() ? input.endDate.trim() : null,
    active: input.active,
    takenToday: input.active ? "0/1" : undefined,
  };

  treatmentMedications = [nextRecord, ...treatmentMedications];
  emitChange();
}

export function getPatientMedicalProfile() {
  return patientMedicalProfile;
}
