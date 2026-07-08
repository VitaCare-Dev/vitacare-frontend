import { RefreshControl } from "react-native";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import { apiGet } from "@/services/apiClient";
import HistoryScreen from "@/screens/HistoryScreen";
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

const glucoseRecord = {
  idControl: 1,
  fechaHora: "2026-06-01T10:00:00",
  notas: "En ayunas",
  glucosa: 98,
};

const vitalsRecord = {
  idControl: 1,
  fechaHora: "2026-06-01T10:00:00",
  notas: null,
  presionSistolica: 120,
  presionDiastolica: 80,
  temperatura: 36.6,
  peso: 65,
};

function emptyPage() {
  return { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 };
}

function page(content: unknown[], totalPages = 1) {
  return { content, page: 0, size: 10, totalElements: content.length, totalPages };
}

describe("HistoryScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockApiGet.mockReset();
  });

  it(
    "shows an empty state when there are no measurements",
    async () => {
      mockApiGet.mockResolvedValue(emptyPage());
      renderWithProviders(<HistoryScreen />);
      await waitFor(() =>
        expect(screen.getByText("Aún no tienes controles registrados")).toBeTruthy()
      );
    },
    10000
  );

  it("merges glucose and vitals sharing the same idControl into one card", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path.startsWith("/api/measurements/glucose")) return Promise.resolve(page([glucoseRecord]));
      if (path.startsWith("/api/measurements/vitals")) return Promise.resolve(page([vitalsRecord]));
      return Promise.resolve(emptyPage());
    });
    renderWithProviders(<HistoryScreen />);

    await waitFor(() => expect(screen.getByText("98 mg/dL")).toBeTruthy());
    expect(screen.getByText("120/80 mmHg")).toBeTruthy();
    expect(screen.getByText("36.6 °C")).toBeTruthy();
    expect(screen.getByText("En ayunas")).toBeTruthy();
  });

  it("navigates to the measurement detail screen when a card is pressed", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path.startsWith("/api/measurements/glucose")) return Promise.resolve(page([glucoseRecord]));
      return Promise.resolve(emptyPage());
    });
    renderWithProviders(<HistoryScreen />);

    await waitFor(() => expect(screen.getByText("98 mg/dL")).toBeTruthy());
    fireEvent.press(screen.getByText("98 mg/dL"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/measurement-detail",
      params: { idControl: "1" },
    });
  });

  it("sorts entries from most recent to oldest", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path.startsWith("/api/measurements/glucose")) {
        return Promise.resolve(
          page([
            { ...glucoseRecord, idControl: 1, fechaHora: "2026-05-01T10:00:00", glucosa: 90 },
            { ...glucoseRecord, idControl: 2, fechaHora: "2026-06-01T10:00:00", glucosa: 100 },
          ])
        );
      }
      return Promise.resolve(emptyPage());
    });
    renderWithProviders(<HistoryScreen />);

    await waitFor(() => expect(screen.getByText("100 mg/dL")).toBeTruthy());
    const values = screen.getAllByText(/mg\/dL/);
    expect(values[0].props.children[0]).toBe(100);
  });

  it("refetches all measurements when the user pulls to refresh", async () => {
    mockApiGet.mockResolvedValue(emptyPage());
    renderWithProviders(<HistoryScreen />);
    await waitFor(() =>
      expect(screen.getByText("Aún no tienes controles registrados")).toBeTruthy()
    );

    const callsBeforeRefresh = mockApiGet.mock.calls.length;
    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    await act(async () => refreshControl.props.onRefresh());

    expect(mockApiGet.mock.calls.length).toBeGreaterThan(callsBeforeRefresh);
  });

  it("filters by measurement type when a chip is selected", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path.startsWith("/api/measurements/glucose")) return Promise.resolve(page([glucoseRecord]));
      if (path.startsWith("/api/measurements/vitals")) return Promise.resolve(page([vitalsRecord]));
      return Promise.resolve(emptyPage());
    });
    renderWithProviders(<HistoryScreen />);
    await waitFor(() => expect(screen.getByText("98 mg/dL")).toBeTruthy());

    fireEvent.press(screen.getByText("Signos vitales"));

    await waitFor(() => expect(screen.getByText("120/80 mmHg")).toBeTruthy());
    expect(screen.queryByText("98 mg/dL")).toBeNull();
  });

  it("shows pagination controls and requests the next page for a single type", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path.startsWith("/api/measurements/glucose")) {
        return Promise.resolve(page([glucoseRecord], 2));
      }
      return Promise.resolve(emptyPage());
    });
    renderWithProviders(<HistoryScreen />);

    fireEvent.press(screen.getByText("Glucosa"));
    await waitFor(() => expect(screen.getByText("Página 1 de 2")).toBeTruthy());

    fireEvent.press(screen.getByText("Siguiente"));

    await waitFor(() =>
      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringMatching(/^\/api\/measurements\/glucose\?page=1&size=10/)
      )
    );
  });

  it("shows a generic error notice with retry when a measurement fails to load", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path.startsWith("/api/measurements/glucose")) return Promise.reject(new Error("network"));
      return Promise.resolve(emptyPage());
    });
    renderWithProviders(<HistoryScreen />);

    await waitFor(() =>
      expect(
        screen.getByText("No se pudo cargar el historial. Intenta de nuevo más tarde.")
      ).toBeTruthy()
    );
  });
});
