import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { apiDelete, apiGet } from "@/services/apiClient";
import MeasurementDetailScreen from "@/screens/MeasurementDetailScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

let mockIdControl: string | undefined = "1";
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ idControl: mockIdControl }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated" }),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiGet: jest.fn(),
  apiDelete: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;
const mockApiDelete = apiDelete as jest.Mock;

const glucoseRecord = {
  idControl: 1,
  fechaHora: "2026-06-01T10:00:00",
  notas: "En ayunas",
  glucosa: 98,
};
const vitalsRecord = {
  idControl: 1,
  fechaHora: "2026-06-01T10:00:00",
  notas: "En ayunas",
  presionSistolica: 120,
  presionDiastolica: 80,
  temperatura: 36.6,
  peso: 65,
};
const lipidsRecord = {
  idControl: 1,
  fechaHora: "2026-06-01T10:00:00",
  notas: null,
  colesterolTotal: 210,
  colesterolLDL: 130,
  colesterolHDL: 40,
  trigliceridos: 150,
};

function mockApi(overrides: Record<string, unknown> = {}) {
  mockApiGet.mockImplementation((path: string) => {
    if (path.startsWith("/api/measurements/glucose"))
      return Promise.resolve({ content: overrides.glucose ?? [] });
    if (path.startsWith("/api/measurements/lipids"))
      return Promise.resolve({ content: overrides.lipids ?? [] });
    if (path.startsWith("/api/measurements/vitals"))
      return Promise.resolve({ content: overrides.vitals ?? [] });
    return Promise.resolve({ content: [] });
  });
}

describe("MeasurementDetailScreen", () => {
  beforeEach(() => {
    mockIdControl = "1";
    mockBack.mockClear();
    mockApiGet.mockReset();
    mockApiDelete.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "shows a not-found message when no measurement matches the id",
    async () => {
      mockApi();
      renderWithProviders(<MeasurementDetailScreen />);
      await waitFor(() => expect(screen.getByText("No se encontró este control")).toBeTruthy());
    },
    10000
  );

  it("renders combined glucose and vitals sections plus notes", async () => {
    mockApi({ glucose: [glucoseRecord], vitals: [vitalsRecord] });
    renderWithProviders(<MeasurementDetailScreen />);

    await waitFor(() => expect(screen.getByText("98 mg/dL")).toBeTruthy());
    expect(screen.getByText("120/80 mmHg")).toBeTruthy();
    expect(screen.getByText("En ayunas")).toBeTruthy();
  });

  it("deletes glucose and navigates back when it was the only remaining section", async () => {
    mockApi({ glucose: [glucoseRecord] });
    mockApiDelete.mockResolvedValue({});
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MeasurementDetailScreen />);

    await waitFor(() => expect(screen.getByText("Eliminar")).toBeTruthy());
    fireEvent.press(screen.getByText("Eliminar"));

    await waitFor(() => expect(mockApiDelete).toHaveBeenCalledWith("/api/measurements/glucose/1"));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it("deletes glucose but stays on screen when vitals still remain", async () => {
    mockApi({ glucose: [glucoseRecord], vitals: [vitalsRecord] });
    mockApiDelete.mockResolvedValue({});
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MeasurementDetailScreen />);

    await waitFor(() => expect(screen.getByText("Glucosa")).toBeTruthy());
    fireEvent.press(screen.getAllByText("Eliminar")[1]);

    await waitFor(() => expect(mockApiDelete).toHaveBeenCalledWith("/api/measurements/glucose/1"));
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("deletes vitals and navigates back when it was the only remaining section", async () => {
    mockApi({ vitals: [vitalsRecord] });
    mockApiDelete.mockResolvedValue({});
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MeasurementDetailScreen />);

    await waitFor(() => expect(screen.getByText("Eliminar")).toBeTruthy());
    fireEvent.press(screen.getByText("Eliminar"));

    await waitFor(() => expect(mockApiDelete).toHaveBeenCalledWith("/api/measurements/vitals/1"));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it("deletes the lipids profile and navigates back when it was the only remaining section", async () => {
    mockApi({ lipids: [lipidsRecord] });
    mockApiDelete.mockResolvedValue({});
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MeasurementDetailScreen />);

    await waitFor(() => expect(screen.getByText("210 mg/dL")).toBeTruthy());
    fireEvent.press(screen.getByText("Eliminar"));

    await waitFor(() => expect(mockApiDelete).toHaveBeenCalledWith("/api/measurements/lipids/1"));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it("shows an error alert when deletion fails", async () => {
    mockApi({ glucose: [glucoseRecord] });
    mockApiDelete.mockRejectedValue(new Error("network down"));
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MeasurementDetailScreen />);

    await waitFor(() => expect(screen.getByText("Eliminar")).toBeTruthy());
    fireEvent.press(screen.getByText("Eliminar"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenLastCalledWith("Error", "No se pudo eliminar el registro.")
    );
  });
});
