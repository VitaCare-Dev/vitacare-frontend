import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { apiGet, apiPut } from "@/services/apiClient";
import AlertsRecommendationsScreen from "@/screens/AlertsRecommendationsScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated" }),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiGet: jest.fn(),
  apiPut: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;
const mockApiPut = apiPut as jest.Mock;

const alert = {
  idAlertaIa: 1,
  fechaDisparo: "2026-06-01T10:00:00",
  motivoAlerta: "Presión elevada 2 días seguidos",
  recomendacionIa: "Consulta a tu médico",
  leida: false,
};

const recommendation = {
  idRecomendacion: 1,
  titulo: "Reduce el sodio",
  contenido: "Evita alimentos procesados",
  fechaGeneracion: "2026-06-01T10:00:00",
  leida: true,
};

describe("AlertsRecommendationsScreen", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiPut.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it(
    "shows empty states when there are no alerts or recommendations",
    async () => {
      mockApiGet.mockResolvedValue([]);
      renderWithProviders(<AlertsRecommendationsScreen />);
      await waitFor(() =>
        expect(screen.getByText("No tienes alertas registradas.")).toBeTruthy()
      );
      expect(screen.getByText("Aún no tienes recomendaciones generadas.")).toBeTruthy();
    },
    10000
  );

  it("renders alerts and recommendations once loaded", async () => {
    mockApiGet.mockImplementation((path: string) =>
      Promise.resolve(path === "/api/alerts" ? [alert] : [recommendation])
    );
    renderWithProviders(<AlertsRecommendationsScreen />);

    await waitFor(() => expect(screen.getByText("Presión elevada 2 días seguidos")).toBeTruthy());
    expect(screen.getByText("Reduce el sodio")).toBeTruthy();
    expect(screen.getByText("No leída")).toBeTruthy();
    expect(screen.getByText("Leída")).toBeTruthy();
  });

  it("marks an unread alert as read when tapped", async () => {
    mockApiGet.mockImplementation((path: string) =>
      Promise.resolve(path === "/api/alerts" ? [alert] : [])
    );
    mockApiPut.mockResolvedValue({});
    renderWithProviders(<AlertsRecommendationsScreen />);

    await waitFor(() => expect(screen.getByText("Presión elevada 2 días seguidos")).toBeTruthy());
    fireEvent.press(screen.getByText("Presión elevada 2 días seguidos"));

    await waitFor(() => expect(mockApiPut).toHaveBeenCalledWith("/api/alerts/1/read"));
  });

  it("does not attempt to mark an already-read recommendation as read", async () => {
    mockApiGet.mockImplementation((path: string) =>
      Promise.resolve(path === "/api/alerts" ? [] : [recommendation])
    );
    renderWithProviders(<AlertsRecommendationsScreen />);

    await waitFor(() => expect(screen.getByText("Reduce el sodio")).toBeTruthy());
    fireEvent.press(screen.getByText("Reduce el sodio"));
    expect(mockApiPut).not.toHaveBeenCalled();
  });

  it("shows a generic error message (not the raw error) when alerts fail to load", async () => {
    mockApiGet.mockImplementation((path: string) =>
      path === "/api/alerts" ? Promise.reject(new Error("Error 500 al llamar /api/alerts")) : Promise.resolve([])
    );
    renderWithProviders(<AlertsRecommendationsScreen />);

    await waitFor(() =>
      expect(
        screen.getByText("No se pudieron cargar las alertas. Intenta de nuevo más tarde.")
      ).toBeTruthy()
    );
    expect(screen.queryByText(/Error 500/)).toBeNull();
  });
});
