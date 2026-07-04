import { screen } from "@testing-library/react-native";

import { PasswordRequirementsChecklist } from "@/components/PasswordRequirementsChecklist";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("PasswordRequirementsChecklist", () => {
  it("renders all 5 requirement labels", () => {
    renderWithProviders(<PasswordRequirementsChecklist password="" />);
    expect(screen.getByText("Mínimo 8 caracteres")).toBeTruthy();
    expect(screen.getByText("Una letra mayúscula")).toBeTruthy();
    expect(screen.getByText("Una letra minúscula")).toBeTruthy();
    expect(screen.getByText("Un número")).toBeTruthy();
    expect(screen.getByText("Un carácter especial")).toBeTruthy();
  });

  it("shows a checkmark for a requirement that is met", () => {
    renderWithProviders(<PasswordRequirementsChecklist password="A" />);
    // Se cumple "una letra mayúscula": debe existir al menos un ✓.
    expect(screen.getAllByText("✓").length).toBeGreaterThan(0);
  });

  it("shows no checkmarks when the password is empty", () => {
    renderWithProviders(<PasswordRequirementsChecklist password="" />);
    expect(screen.queryByText("✓")).toBeNull();
  });

  it("shows a checkmark for every requirement when the password meets them all", () => {
    renderWithProviders(<PasswordRequirementsChecklist password="Abcdef1!" />);
    expect(screen.getAllByText("✓")).toHaveLength(5);
  });
});
