import { RefreshControl } from "react-native";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import { apiGet } from "@/services/apiClient";
import HomeScreen from "@/screens/HomeScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated" }),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiGet: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;

function mockApi(overrides: Record<string, unknown> = {}) {
  mockApiGet.mockImplementation((path: string) => {
    if (path === "/api/patients/me") return Promise.resolve(overrides.patient ?? { nombre: "María" });
    if (path === "/api/measurements/history") return Promise.resolve(overrides.history ?? []);
    if (path === "/api/measurements/glucose/latest")
      return "glucose" in overrides ? Promise.resolve(overrides.glucose) : Promise.reject(notFound());
    if (path === "/api/measurements/vitals/latest")
      return "vitals" in overrides ? Promise.resolve(overrides.vitals) : Promise.reject(notFound());
    if (path === "/api/measurements/lipids/latest")
      return "lipids" in overrides ? Promise.resolve(overrides.lipids) : Promise.reject(notFound());
    if (path === "/api/medications?active=true") return Promise.resolve(overrides.medications ?? []);
    if (path === "/api/alerts/unread") return Promise.resolve(overrides.alerts ?? []);
    return Promise.resolve([]);
  });
}

function notFound() {
  const { ApiError } = jest.requireActual("@/services/apiClient");
  return new ApiError(404, "not found");
}

describe("HomeScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockApiGet.mockReset();
  });

  it(
    "greets the patient by name",
    async () => {
      mockApi({ patient: { nombre: "María" } });
      renderWithProviders(<HomeScreen />);
      await waitFor(() => expect(screen.getByText("¡Hola, María!")).toBeTruthy());
    },
    10000
  );

  it("shows the 'first measurement' CTA when there is no history yet", async () => {
    mockApi({ history: [] });
    renderWithProviders(<HomeScreen />);
    await waitFor(() =>
      expect(screen.getByText("Aún no tienes mediciones registradas")).toBeTruthy()
    );

    fireEvent.press(screen.getByText("Registrar mi primera medición"));
    expect(mockPush).toHaveBeenCalledWith("/glucose");
  });

  it("renders summary cards for the latest measurements", async () => {
    mockApi({
      history: [{ idControl: 1, idPaciente: 1, fechaHora: "2026-06-01", notas: null }],
      glucose: { glucosa: 98 },
      vitals: { presionSistolica: 120, presionDiastolica: 80, temperatura: 36.6, peso: 65 },
    });
    renderWithProviders(<HomeScreen />);

    await waitFor(() => expect(screen.getByText("98")).toBeTruthy());
    expect(screen.getByText("120/80")).toBeTruthy();
    expect(screen.getByText("36.6")).toBeTruthy();
  });

  it("navigates to the trend screen when a summary card is pressed", async () => {
    mockApi({
      history: [{ idControl: 1, idPaciente: 1, fechaHora: "2026-06-01", notas: null }],
      glucose: { glucosa: 98 },
    });
    renderWithProviders(<HomeScreen />);

    await waitFor(() => expect(screen.getByText("98")).toBeTruthy());
    fireEvent.press(screen.getByText("Glucosa"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/measurement-trend",
      params: { metric: "glucosa" },
    });
  });

  it("shows a placeholder when there are no active medications", async () => {
    mockApi({ medications: [] });
    renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("No hay medicamentos activos")).toBeTruthy());
  });

  it("shows the single active medication without a carousel", async () => {
    mockApi({
      medications: [
        { idMedicamento: 1, nombreMedicamento: "Metformina", dosis: "850 mg", frecuenciaHoras: 12, activo: 1 },
      ],
    });
    renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("Metformina")).toBeTruthy());
    expect(screen.getByText("850 mg · Cada 12 horas")).toBeTruthy();
  });

  it("shows a carousel with dots when there are multiple active medications", async () => {
    mockApi({
      medications: [
        { idMedicamento: 1, nombreMedicamento: "Metformina", dosis: "850 mg", frecuenciaHoras: 12, activo: 1 },
        { idMedicamento: 2, nombreMedicamento: "Losartán", dosis: "50 mg", frecuenciaHoras: 24, activo: 1 },
      ],
    });
    renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("Metformina")).toBeTruthy());
    expect(screen.getByText("Losartán")).toBeTruthy();
  });

  it("shows the top unread alert when there is one", async () => {
    mockApi({
      alerts: [{ idAlertaIa: 1, motivoAlerta: "Presión elevada", recomendacionIa: "Consulta a tu médico" }],
    });
    renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("Presión elevada")).toBeTruthy());
  });

  it("shows the default 'no alerts' message when there are none", async () => {
    mockApi({ alerts: [] });
    renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("Sin alertas nuevas")).toBeTruthy());
  });

  it("navigates to the assistant and providers screens", async () => {
    mockApi();
    renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("Abrir VitaCare IA")).toBeTruthy());

    fireEvent.press(screen.getByText("Abrir VitaCare IA"));
    expect(mockPush).toHaveBeenCalledWith("/assistant");

    fireEvent.press(screen.getByText("Consultar prestadores"));
    expect(mockPush).toHaveBeenCalledWith("/providers");
  });

  it("refetches all data when the user pulls to refresh", async () => {
    mockApi({ patient: { nombre: "María" } });
    renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText("¡Hola, María!")).toBeTruthy());

    const callsBeforeRefresh = mockApiGet.mock.calls.length;
    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    await act(async () => refreshControl.props.onRefresh());

    expect(mockApiGet.mock.calls.length).toBeGreaterThan(callsBeforeRefresh);
  });
});
