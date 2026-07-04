import { fireEvent, screen } from "@testing-library/react-native";

import HealthControlScreen from "@/screens/HealthControlScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("HealthControlScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders all 4 health control options", () => {
    renderWithProviders(<HealthControlScreen />);
    expect(screen.getByText("Signos vitales")).toBeTruthy();
    expect(screen.getByText("Glucosa")).toBeTruthy();
    expect(screen.getByText("Tratamiento")).toBeTruthy();
    expect(screen.getByText("Colesterol / lípidos")).toBeTruthy();
  });

  it("navigates to /vital-signs when 'Signos vitales' is pressed", () => {
    renderWithProviders(<HealthControlScreen />);
    fireEvent.press(screen.getByText("Signos vitales"));
    expect(mockPush).toHaveBeenCalledWith("/vital-signs");
  });

  it("navigates to /glucose when 'Glucosa' is pressed", () => {
    renderWithProviders(<HealthControlScreen />);
    fireEvent.press(screen.getByText("Glucosa"));
    expect(mockPush).toHaveBeenCalledWith("/glucose");
  });

  it("navigates to /treatment when 'Tratamiento' is pressed", () => {
    renderWithProviders(<HealthControlScreen />);
    fireEvent.press(screen.getByText("Tratamiento"));
    expect(mockPush).toHaveBeenCalledWith("/treatment");
  });

  it("navigates to /cholesterol when 'Colesterol / lípidos' is pressed", () => {
    renderWithProviders(<HealthControlScreen />);
    fireEvent.press(screen.getByText("Colesterol / lípidos"));
    expect(mockPush).toHaveBeenCalledWith("/cholesterol");
  });
});
