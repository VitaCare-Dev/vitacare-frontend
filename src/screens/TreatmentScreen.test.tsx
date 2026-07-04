import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert, RefreshControl } from "react-native";

import { apiDelete, apiGet, apiPatch } from "@/services/apiClient";
import * as notifications from "@/services/notifications";
import TreatmentScreen from "@/screens/TreatmentScreen";
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
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}));

jest.mock("@/services/notifications", () => ({
  notificationsAvailable: true,
  requestNotificationPermissions: jest.fn(),
  scheduleTestNotification: jest.fn(),
  syncMedicationReminders: jest.fn(),
  cancelMedicationReminder: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;
const mockApiPatch = apiPatch as jest.Mock;
const mockApiDelete = apiDelete as jest.Mock;
const mockRequestPermissions = notifications.requestNotificationPermissions as jest.Mock;
const mockSyncReminders = notifications.syncMedicationReminders as jest.Mock;
const mockScheduleTest = notifications.scheduleTestNotification as jest.Mock;

const activeMedication = {
  idMedicamento: 1,
  nombreMedicamento: "Metformina",
  dosis: "850 mg",
  frecuenciaHoras: 12,
  fechaInicio: "2026-01-01",
  fechaTermino: null,
  activo: 1,
};

describe("TreatmentScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockApiGet.mockReset();
    mockApiPatch.mockReset();
    mockApiDelete.mockReset();
    mockRequestPermissions.mockReset().mockResolvedValue(true);
    mockSyncReminders.mockReset().mockResolvedValue(undefined);
    mockScheduleTest.mockReset().mockResolvedValue(undefined);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "shows an empty state when there are no medications",
    async () => {
      mockApiGet.mockResolvedValue([]);
      renderWithProviders(<TreatmentScreen />);
      await waitFor(() =>
        expect(screen.getByText("No hay medicamentos registrados")).toBeTruthy()
      );
    },
    10000
  );

  it("renders a medication card for each registered medication", async () => {
    mockApiGet.mockResolvedValue([activeMedication]);
    renderWithProviders(<TreatmentScreen />);
    await waitFor(() => expect(screen.getByText("Metformina")).toBeTruthy());
  });

  it("syncs local reminders with active medications once permission is granted", async () => {
    mockApiGet.mockResolvedValue([activeMedication]);
    renderWithProviders(<TreatmentScreen />);
    await waitFor(() => expect(mockSyncReminders).toHaveBeenCalledWith([activeMedication]));
  });

  it("navigates to /add-medication via the header '+' icon", async () => {
    mockApiGet.mockResolvedValue([]);
    renderWithProviders(<TreatmentScreen />);
    await waitFor(() => expect(screen.getByLabelText("agregar")).toBeTruthy());
    fireEvent.press(screen.getByLabelText("agregar"));
    expect(mockPush).toHaveBeenCalledWith("/add-medication");
  });

  it("deactivates a medication and cancels its reminder", async () => {
    mockApiGet.mockResolvedValue([activeMedication]);
    mockApiPatch.mockResolvedValue({});
    renderWithProviders(<TreatmentScreen />);
    await waitFor(() => expect(screen.getByText("Desactivar")).toBeTruthy());

    fireEvent.press(screen.getByText("Desactivar"));
    await waitFor(() => expect(mockApiPatch).toHaveBeenCalledWith("/api/medications/1/deactivate"));
    expect(notifications.cancelMedicationReminder).toHaveBeenCalledWith(1);
  });

  it("asks for confirmation and deletes a medication", async () => {
    mockApiGet.mockResolvedValue([activeMedication]);
    mockApiDelete.mockResolvedValue({});
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<TreatmentScreen />);
    await waitFor(() => expect(screen.getByText("Eliminar")).toBeTruthy());

    fireEvent.press(screen.getByText("Eliminar"));
    await waitFor(() => expect(mockApiDelete).toHaveBeenCalledWith("/api/medications/1"));
  });

  it("sends a test notification when available and permission is granted", async () => {
    mockApiGet.mockResolvedValue([]);
    renderWithProviders(<TreatmentScreen />);
    await waitFor(() => expect(screen.getByText("Enviar notificación de prueba (10s)")).toBeTruthy());

    fireEvent.press(screen.getByText("Enviar notificación de prueba (10s)"));
    await waitFor(() => expect(mockScheduleTest).toHaveBeenCalled());
  });

  it("refetches medications when the user pulls to refresh", async () => {
    mockApiGet.mockResolvedValue([]);
    renderWithProviders(<TreatmentScreen />);
    await waitFor(() =>
      expect(screen.getByText("No hay medicamentos registrados")).toBeTruthy()
    );

    const callsBeforeRefresh = mockApiGet.mock.calls.length;
    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    await act(async () => refreshControl.props.onRefresh());

    expect(mockApiGet.mock.calls.length).toBeGreaterThan(callsBeforeRefresh);
  });
});
