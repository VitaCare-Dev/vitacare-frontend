import { fireEvent, screen } from "@testing-library/react-native";

import { HealthCard } from "@/components/HealthCard";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("HealthCard", () => {
  it("renders label, value and unit", () => {
    renderWithProviders(<HealthCard label="Glucosa" value="98" unit="mg/dL" icon="glucosa" />);
    expect(screen.getByText("Glucosa")).toBeTruthy();
    expect(screen.getByText("98")).toBeTruthy();
    expect(screen.getByText("mg/dL")).toBeTruthy();
  });

  it("renders the optional note when provided", () => {
    renderWithProviders(
      <HealthCard label="Peso" value="65" unit="kg" icon="peso" note="Sin datos recientes" />
    );
    expect(screen.getByText("Sin datos recientes")).toBeTruthy();
  });

  it("does not render a note when not provided", () => {
    renderWithProviders(<HealthCard label="Peso" value="65" unit="kg" icon="peso" />);
    expect(screen.queryByText("Sin datos recientes")).toBeNull();
  });

  it("calls onPress when tapped and onPress is provided", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <HealthCard label="Glucosa" value="98" unit="mg/dL" icon="glucosa" onPress={onPress} />
    );
    fireEvent.press(screen.getByText("Glucosa"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is not interactive when onPress is not provided", () => {
    const onPress = jest.fn();
    renderWithProviders(<HealthCard label="Glucosa" value="98" unit="mg/dL" icon="glucosa" />);
    fireEvent.press(screen.getByText("Glucosa"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
