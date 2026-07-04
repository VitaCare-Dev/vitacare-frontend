import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { apiPost } from "@/services/apiClient";
import GlucoseScreen from "@/screens/GlucoseScreen";
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

describe("GlucoseScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockApiPost.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "shows validation errors for missing value and period",
    async () => {
      renderWithProviders(<GlucoseScreen />);
      fireEvent.press(screen.getByText("Guardar"));
      await waitFor(() =>
        expect(screen.getByText("La glucosa es obligatorio.")).toBeTruthy()
      );
    },
    10000
  );

  it("shows a range error for an implausible glucose value", async () => {
    renderWithProviders(<GlucoseScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("98"), "3000");
    fireEvent.press(screen.getByText("En ayunas"));
    fireEvent.press(screen.getByText("Guardar"));
    await waitFor(() =>
      expect(screen.getByText(/La glucosa debe estar entre/)).toBeTruthy()
    );
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("submits a valid glucose reading and navigates back", async () => {
    mockApiPost.mockResolvedValue({});
    renderWithProviders(<GlucoseScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("98"), "98");
    fireEvent.press(screen.getByText("En ayunas"));
    fireEvent.press(screen.getByText("Guardar"));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith("/api/measurements/glucose", {
        glucosa: 98,
        periodo: "AYUNAS",
        notas: undefined,
      })
    );
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });

  it("shows an error alert when the request fails", async () => {
    mockApiPost.mockRejectedValue(new Error("network down"));
    renderWithProviders(<GlucoseScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("98"), "98");
    fireEvent.press(screen.getByText("Después de comer"));
    fireEvent.press(screen.getByText("Guardar"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "No se pudo registrar la glucosa.",
        expect.anything()
      )
    );
  });
});
