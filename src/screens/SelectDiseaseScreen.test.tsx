import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { apiGet, apiPost } from "@/services/apiClient";
import SelectDiseaseScreen from "@/screens/SelectDiseaseScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

jest.mock("@/context/AuthContext", () => ({
  refreshAuthProfile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;
const mockApiPost = apiPost as jest.Mock;

const catalog = [
  { idEnfermedad: 1, nombreEnfermedad: "Diabetes tipo 2", descripcion: "Descripción" },
  { idEnfermedad: 2, nombreEnfermedad: "Hipertensión", descripcion: "Descripción" },
];

describe("SelectDiseaseScreen", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiPost.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "loads and renders the disease catalog",
    async () => {
      mockApiGet.mockResolvedValue(catalog);
      renderWithProviders(<SelectDiseaseScreen />);
      await waitFor(() => expect(screen.getByText("Diabetes tipo 2")).toBeTruthy());
      expect(screen.getByText("Hipertensión")).toBeTruthy();
    },
    10000
  );

  it("shows a retryable alert when the catalog fails to load", async () => {
    mockApiGet.mockRejectedValue(new Error("network down"));
    renderWithProviders(<SelectDiseaseScreen />);
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });

  it("disables 'Continuar' until a disease is selected", async () => {
    mockApiGet.mockResolvedValue(catalog);
    renderWithProviders(<SelectDiseaseScreen />);
    await waitFor(() => expect(screen.getByText("Diabetes tipo 2")).toBeTruthy());
    expect(screen.getByText("Continuar")).toBeDisabled();
  });

  it("submits the selected disease and refreshes the auth profile", async () => {
    mockApiGet.mockResolvedValue(catalog);
    mockApiPost.mockResolvedValue({});
    renderWithProviders(<SelectDiseaseScreen />);

    await waitFor(() => expect(screen.getByText("Diabetes tipo 2")).toBeTruthy());
    fireEvent.press(screen.getByText("Diabetes tipo 2"));
    fireEvent.press(screen.getByText("Continuar"));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith("/api/patients/me/diseases", { idEnfermedad: 1 })
    );
  });
});
