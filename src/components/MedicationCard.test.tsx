import { fireEvent, screen } from "@testing-library/react-native";

import { MedicationCard, type MedicationRecord } from "@/components/MedicationCard";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const baseMedication: MedicationRecord = {
  idMedicamento: 1,
  nombreMedicamento: "Metformina",
  dosis: "850 mg",
  frecuenciaHoras: 12,
  fechaInicio: "2026-01-01",
  fechaTermino: null,
  activo: 1,
};

describe("MedicationCard", () => {
  it("renders the medication name and dose", () => {
    renderWithProviders(<MedicationCard medication={baseMedication} />);
    expect(screen.getByText("Metformina")).toBeTruthy();
    expect(screen.getByText("850 mg")).toBeTruthy();
  });

  it.each([
    [24, "Una vez al día"],
    [12, "Cada 12 horas"],
    [8, "Cada 8 horas"],
    [6, "Cada 6 horas"],
  ])("formats a frequency of %i hours as '%s'", (frecuenciaHoras, expected) => {
    renderWithProviders(
      <MedicationCard medication={{ ...baseMedication, frecuenciaHoras }} />
    );
    expect(screen.getByText(expected)).toBeTruthy();
  });

  it("shows 'Activo' badge for an active medication", () => {
    renderWithProviders(<MedicationCard medication={baseMedication} />);
    expect(screen.getByText("Activo")).toBeTruthy();
  });

  it("shows 'Inactivo' badge for an inactive medication", () => {
    renderWithProviders(<MedicationCard medication={{ ...baseMedication, activo: 0 }} />);
    expect(screen.getByText("Inactivo")).toBeTruthy();
  });

  it("shows 'Indefinido' when there is no end date", () => {
    renderWithProviders(<MedicationCard medication={baseMedication} />);
    expect(screen.getByText("Término: Indefinido")).toBeTruthy();
  });

  it("shows the end date when it exists", () => {
    renderWithProviders(
      <MedicationCard medication={{ ...baseMedication, fechaTermino: "2026-06-01" }} />
    );
    expect(screen.getByText("Término: 2026-06-01")).toBeTruthy();
  });

  it("does not render action buttons when no callbacks are given", () => {
    renderWithProviders(<MedicationCard medication={baseMedication} />);
    expect(screen.queryByText("Desactivar")).toBeNull();
    expect(screen.queryByText("Eliminar")).toBeNull();
  });

  it("calls onDeactivate when 'Desactivar' is pressed on an active medication", () => {
    const onDeactivate = jest.fn();
    renderWithProviders(
      <MedicationCard medication={baseMedication} onDeactivate={onDeactivate} />
    );
    fireEvent.press(screen.getByText("Desactivar"));
    expect(onDeactivate).toHaveBeenCalledTimes(1);
  });

  it("does not show 'Desactivar' for an already inactive medication", () => {
    renderWithProviders(
      <MedicationCard medication={{ ...baseMedication, activo: 0 }} onDeactivate={jest.fn()} />
    );
    expect(screen.queryByText("Desactivar")).toBeNull();
  });

  it("calls onDelete when 'Eliminar' is pressed", () => {
    const onDelete = jest.fn();
    renderWithProviders(<MedicationCard medication={baseMedication} onDelete={onDelete} />);
    fireEvent.press(screen.getByText("Eliminar"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
