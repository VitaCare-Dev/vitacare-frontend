import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { apiPost } from "@/services/apiClient";
import CholesterolScreen from "@/screens/CholesterolScreen";
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

describe("CholesterolScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockApiPost.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  function fillForm() {
    fireEvent.changeText(screen.getByPlaceholderText("Ej: 200"), "200");
    fireEvent.changeText(screen.getByPlaceholderText("Ej: 130"), "130");
    fireEvent.changeText(screen.getByPlaceholderText("Ej: 40"), "40");
    fireEvent.changeText(screen.getByPlaceholderText("Ej: 150"), "150");
  }

  it(
    "shows validation errors when submitting an empty form",
    async () => {
      renderWithProviders(<CholesterolScreen />);
      fireEvent.press(screen.getByText("Guardar registro"));
      await waitFor(() =>
        expect(screen.getByText("El colesterol total es obligatorio.")).toBeTruthy()
      );
    },
    10000
  );

  it("submits a valid lipid profile", async () => {
    mockApiPost.mockResolvedValue({});
    renderWithProviders(<CholesterolScreen />);
    fillForm();
    fireEvent.press(screen.getByText("Guardar registro"));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith("/api/measurements/lipids", {
        colesterolTotal: 200,
        colesterolLDL: 130,
        colesterolHDL: 40,
        trigliceridos: 150,
        notas: undefined,
      })
    );
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });

  it("shows a range error for an implausible value", async () => {
    renderWithProviders(<CholesterolScreen />);
    fillForm();
    fireEvent.changeText(screen.getByPlaceholderText("Ej: 200"), "99999");
    fireEvent.press(screen.getByText("Guardar registro"));

    await waitFor(() =>
      expect(screen.getByText(/El colesterol total debe estar entre/)).toBeTruthy()
    );
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("shows an error alert when the request fails", async () => {
    mockApiPost.mockRejectedValue(new Error("network down"));
    renderWithProviders(<CholesterolScreen />);
    fillForm();
    fireEvent.press(screen.getByText("Guardar registro"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith("Error", "No se pudo registrar el colesterol.")
    );
  });
});
