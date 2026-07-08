import { screen, waitFor } from "@testing-library/react-native";

import { apiGet } from "@/services/apiClient";
import MeasurementTrendScreen from "@/screens/MeasurementTrendScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

let mockMetric = "glucosa";
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ metric: mockMetric }),
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated" }),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiGet: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;

describe("MeasurementTrendScreen", () => {
  beforeEach(() => {
    mockMetric = "glucosa";
    mockApiGet.mockReset();
  });

  it(
    "shows an empty state with fewer than 2 glucose readings",
    async () => {
      mockApiGet.mockResolvedValue({ content: [{ fechaHora: "2026-06-01", glucosa: 98 }] });
      renderWithProviders(<MeasurementTrendScreen />);
      await waitFor(() =>
        expect(screen.getByText("Aún no hay suficientes datos")).toBeTruthy()
      );
    },
    10000
  );

  it("renders a glucose trend chart with 2+ readings", async () => {
    mockApiGet.mockResolvedValue({
      content: [
        { fechaHora: "2026-06-01", glucosa: 98 },
        { fechaHora: "2026-06-02", glucosa: 105 },
      ],
    });
    renderWithProviders(<MeasurementTrendScreen />);
    await waitFor(() => expect(screen.getByText("98")).toBeTruthy());
    expect(screen.getByText("105")).toBeTruthy();
  });

  it("renders the weight trend using the vitals endpoint", async () => {
    mockMetric = "peso";
    mockApiGet.mockResolvedValue({
      content: [
        { fechaHora: "2026-06-01", peso: 65, temperatura: 36.5, presionSistolica: null, presionDiastolica: null },
        { fechaHora: "2026-06-02", peso: 66, temperatura: 36.6, presionSistolica: null, presionDiastolica: null },
      ],
    });
    renderWithProviders(<MeasurementTrendScreen />);
    await waitFor(() => expect(screen.getByText("65")).toBeTruthy());
  });

  it("renders both systolic and diastolic series for blood pressure", async () => {
    mockMetric = "presion";
    mockApiGet.mockResolvedValue({
      content: [
        { fechaHora: "2026-06-01", peso: 65, temperatura: 36.5, presionSistolica: 120, presionDiastolica: 80 },
        { fechaHora: "2026-06-02", peso: 66, temperatura: 36.6, presionSistolica: 118, presionDiastolica: 78 },
      ],
    });
    renderWithProviders(<MeasurementTrendScreen />);
    await waitFor(() => expect(screen.getByText("Sistólica")).toBeTruthy());
    expect(screen.getByText("Diastólica")).toBeTruthy();
  });

  it("falls back to the fixed systolic range when there aren't enough diastolic readings", async () => {
    mockMetric = "presion";
    mockApiGet.mockResolvedValue({
      content: [
        { fechaHora: "2026-06-01", peso: 65, temperatura: 36.5, presionSistolica: 120, presionDiastolica: null },
        { fechaHora: "2026-06-02", peso: 66, temperatura: 36.6, presionSistolica: 118, presionDiastolica: null },
      ],
    });
    renderWithProviders(<MeasurementTrendScreen />);
    await waitFor(() => expect(screen.getByText("120")).toBeTruthy());
    expect(screen.queryByText("Sistólica")).toBeNull();
  });

  it("defaults to glucosa for an unknown metric param", async () => {
    mockMetric = "not-a-real-metric";
    mockApiGet.mockResolvedValue({ content: [] });
    renderWithProviders(<MeasurementTrendScreen />);
    await waitFor(() => expect(screen.getAllByText("Glucosa").length).toBeGreaterThan(0));
  });
});
