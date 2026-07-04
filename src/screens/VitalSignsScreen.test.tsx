import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { apiPost } from "@/services/apiClient";
import VitalSignsScreen from "@/screens/VitalSignsScreen";
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

const mockApiPost = apiPost as jest.Mock;

describe("VitalSignsScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockApiPost.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  function fillRequired() {
    fireEvent.changeText(screen.getByPlaceholderText("36.6"), "36.6");
    fireEvent.changeText(screen.getByPlaceholderText("65.2"), "65");
  }

  it(
    "shows validation errors for missing temperature and weight",
    async () => {
      renderWithProviders(<VitalSignsScreen />);
      fireEvent.press(screen.getByText("Guardar"));
      await waitFor(() =>
        expect(screen.getByText("La temperatura es obligatorio.")).toBeTruthy()
      );
    },
    10000
  );

  it("submits temperature and weight alone, without blood pressure", async () => {
    mockApiPost.mockResolvedValue({});
    renderWithProviders(<VitalSignsScreen />);
    fillRequired();
    fireEvent.press(screen.getByText("Guardar"));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith("/api/measurements/vitals", {
        presionSistolica: undefined,
        presionDiastolica: undefined,
        temperatura: 36.6,
        peso: 65,
        notas: undefined,
      })
    );
  });

  it("rejects blood pressure with only the systolic value filled in", async () => {
    renderWithProviders(<VitalSignsScreen />);
    fillRequired();
    fireEvent.changeText(screen.getByPlaceholderText("120"), "120");
    fireEvent.press(screen.getByText("Guardar"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Si registras presión arterial, completa tanto la sistólica como la diastólica."
        )
      ).toBeTruthy()
    );
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("submits full blood pressure alongside temperature and weight", async () => {
    mockApiPost.mockResolvedValue({});
    renderWithProviders(<VitalSignsScreen />);
    fillRequired();
    fireEvent.changeText(screen.getByPlaceholderText("120"), "120");
    fireEvent.changeText(screen.getByPlaceholderText("80"), "80");
    fireEvent.press(screen.getByText("Guardar"));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/measurements/vitals",
        expect.objectContaining({ presionSistolica: 120, presionDiastolica: 80 })
      )
    );
  });

  it("shows an error alert when the request fails", async () => {
    mockApiPost.mockRejectedValue(new Error("network down"));
    renderWithProviders(<VitalSignsScreen />);
    fillRequired();
    fireEvent.press(screen.getByText("Guardar"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "No se pudo registrar los signos vitales."
      )
    );
  });
});
