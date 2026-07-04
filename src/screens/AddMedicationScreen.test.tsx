import DateTimePicker from "@react-native-community/datetimepicker";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { apiPost } from "@/services/apiClient";
import * as notifications from "@/services/notifications";
import AddMedicationScreen from "@/screens/AddMedicationScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiPost: jest.fn(),
}));

jest.mock("@/services/notifications", () => ({
  requestNotificationPermissions: jest.fn(),
  scheduleMedicationReminder: jest.fn(),
}));

const mockApiPost = apiPost as jest.Mock;
const mockRequestPermissions = notifications.requestNotificationPermissions as jest.Mock;
const mockScheduleReminder = notifications.scheduleMedicationReminder as jest.Mock;

function pickStartDate(date: Date) {
  fireEvent.press(screen.getByText("Fecha de inicio"));
  const picker = screen.UNSAFE_getByType(DateTimePicker);
  act(() => picker.props.onValueChange({} as never, date));
}

describe("AddMedicationScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockApiPost.mockReset();
    mockRequestPermissions.mockReset().mockResolvedValue(true);
    mockScheduleReminder.mockReset().mockResolvedValue(undefined);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "shows validation errors when submitting an empty form",
    async () => {
      renderWithProviders(<AddMedicationScreen />);
      fireEvent.press(screen.getByText("Guardar medicamento"));
      await waitFor(() =>
        expect(screen.getByText("El nombre del medicamento es obligatorio.")).toBeTruthy()
      );
    },
    10000
  );

  it("lets the user pick a start date via the date picker", () => {
    renderWithProviders(<AddMedicationScreen />);
    pickStartDate(new Date(2026, 0, 15));
    expect(screen.getByDisplayValue("15/01/2026")).toBeTruthy();
  });

  it("submits a valid medication and schedules its reminder", async () => {
    mockApiPost.mockResolvedValue({ idMedicamento: 1, nombreMedicamento: "Metformina" });
    renderWithProviders(<AddMedicationScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Ej. Metformina"), "Metformina");
    fireEvent.changeText(screen.getByPlaceholderText("Ej. 850 mg"), "850 mg");
    fireEvent.changeText(screen.getByPlaceholderText("Ej. 12"), "12");
    pickStartDate(new Date(2026, 0, 15));

    fireEvent.press(screen.getByText("Guardar medicamento"));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith("/api/medications", {
        nombreMedicamento: "Metformina",
        dosis: "850 mg",
        frecuenciaHoras: 12,
        fechaInicio: "2026-01-15",
        fechaTermino: undefined,
      })
    );
    await waitFor(() => expect(mockScheduleReminder).toHaveBeenCalled());
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });

  it("does not schedule a reminder when notification permission is denied", async () => {
    mockRequestPermissions.mockResolvedValue(false);
    mockApiPost.mockResolvedValue({ idMedicamento: 1, nombreMedicamento: "Metformina" });
    renderWithProviders(<AddMedicationScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Ej. Metformina"), "Metformina");
    fireEvent.changeText(screen.getByPlaceholderText("Ej. 850 mg"), "850 mg");
    fireEvent.changeText(screen.getByPlaceholderText("Ej. 12"), "12");
    pickStartDate(new Date(2026, 0, 15));
    fireEvent.press(screen.getByText("Guardar medicamento"));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalled());
    expect(mockScheduleReminder).not.toHaveBeenCalled();
  });

  it("shows an error alert when saving fails", async () => {
    mockApiPost.mockRejectedValue(new Error("network down"));
    renderWithProviders(<AddMedicationScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("Ej. Metformina"), "Metformina");
    fireEvent.changeText(screen.getByPlaceholderText("Ej. 850 mg"), "850 mg");
    fireEvent.changeText(screen.getByPlaceholderText("Ej. 12"), "12");
    pickStartDate(new Date(2026, 0, 15));
    fireEvent.press(screen.getByText("Guardar medicamento"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith("Error", "No se pudo guardar el medicamento.")
    );
  });

  it("allows removing a chosen end date", () => {
    renderWithProviders(<AddMedicationScreen />);
    fireEvent.press(screen.getByText("Fecha de término"));
    const pickers = screen.UNSAFE_getAllByType(DateTimePicker);
    act(() => pickers[pickers.length - 1].props.onValueChange({} as never, new Date(2026, 5, 1)));

    expect(screen.getByText("Quitar fecha de término")).toBeTruthy();
    fireEvent.press(screen.getByText("Quitar fecha de término"));
    expect(screen.queryByText("Quitar fecha de término")).toBeNull();
  });
});
