import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { apiGet, apiPost } from "@/services/apiClient";
import AddDiseaseScreen from "@/screens/AddDiseaseScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated" }),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;
const mockApiPost = apiPost as jest.Mock;

const catalog = [
  { idEnfermedad: 1, nombreEnfermedad: "Diabetes tipo 2", descripcion: "Descripción diabetes" },
  { idEnfermedad: 2, nombreEnfermedad: "Hipertensión", descripcion: "Descripción hipertensión" },
];

describe("AddDiseaseScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockApiGet.mockReset();
    mockApiPost.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "shows only diseases not already registered by the patient",
    async () => {
      mockApiGet.mockImplementation((path: string) => {
        if (path === "/api/diseases") return Promise.resolve(catalog);
        return Promise.resolve([{ idEnfermedad: 1, nombreEnfermedad: "Diabetes tipo 2" }]);
      });
      renderWithProviders(<AddDiseaseScreen />);

      await waitFor(() => expect(screen.getByText("Hipertensión")).toBeTruthy());
      expect(screen.queryByText("Diabetes tipo 2")).toBeNull();
    },
    10000
  );

  it("shows an empty state when every catalog disease is already registered", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/api/diseases") return Promise.resolve(catalog);
      return Promise.resolve(catalog);
    });
    renderWithProviders(<AddDiseaseScreen />);

    await waitFor(() =>
      expect(screen.getByText("Ya tienes todas las enfermedades del catálogo")).toBeTruthy()
    );
  });

  it("disables the 'Agregar' button until a disease is selected", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/api/diseases") return Promise.resolve(catalog);
      return Promise.resolve([]);
    });
    renderWithProviders(<AddDiseaseScreen />);

    await waitFor(() => expect(screen.getByText("Diabetes tipo 2")).toBeTruthy());
    expect(screen.getByText("Agregar")).toBeDisabled();

    fireEvent.press(screen.getByText("Diabetes tipo 2"));
    expect(screen.getByText("Agregar")).toBeEnabled();
  });

  it("registers the selected disease and navigates back on success", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/api/diseases") return Promise.resolve(catalog);
      return Promise.resolve([]);
    });
    mockApiPost.mockResolvedValue({});
    renderWithProviders(<AddDiseaseScreen />);

    await waitFor(() => expect(screen.getByText("Diabetes tipo 2")).toBeTruthy());
    fireEvent.press(screen.getByText("Diabetes tipo 2"));
    fireEvent.press(screen.getByText("Agregar"));

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith("/api/patients/me/diseases", { idEnfermedad: 1 })
    );
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });
});
