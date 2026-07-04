import { Picker } from "@react-native-picker/picker";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { chileRegions, getComunasByRegion } from "@/data/chileRegions";
import { apiGet, apiPost, apiPut } from "@/services/apiClient";
import EditAddressScreen from "@/screens/EditAddressScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const santiagoRegion = chileRegions.find((r) => r.name.includes("Metropolitana"))!;
const santiagoComuna = getComunasByRegion(santiagoRegion.id).find((c) => c.name === "Santiago")!;

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
  apiPut: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;
const mockApiPost = apiPost as jest.Mock;
const mockApiPut = apiPut as jest.Mock;

async function pickRegionAndComuna() {
  const pickers = screen.UNSAFE_getAllByType(Picker);
  await act(async () => pickers[0].props.onValueChange(santiagoRegion.id));
  const pickersAfter = screen.UNSAFE_getAllByType(Picker);
  await act(async () => pickersAfter[1].props.onValueChange(santiagoComuna.id));
}

describe("EditAddressScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockApiGet.mockReset();
    mockApiPost.mockReset();
    mockApiPut.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "shows 'Agregar dirección' when the patient has no address yet",
    async () => {
      mockApiGet.mockResolvedValue([]);
      renderWithProviders(<EditAddressScreen />);
      await waitFor(() => expect(screen.getByText("Guardar dirección")).toBeTruthy());
      expect(screen.getAllByText("Agregar dirección").length).toBeGreaterThan(0);
    },
    10000
  );

  it("preloads the form with the patient's existing address", async () => {
    mockApiGet.mockResolvedValue([
      {
        idDireccion: 5,
        calle: "Av. Los Carrera",
        numero: "123",
        comuna: "Santiago",
        region: santiagoRegion.name,
      },
    ]);
    renderWithProviders(<EditAddressScreen />);

    await waitFor(() => expect(screen.getByDisplayValue("Av. Los Carrera")).toBeTruthy());
    expect(screen.getByDisplayValue("123")).toBeTruthy();
    expect(screen.getAllByText("Editar dirección").length).toBeGreaterThan(0);
  });

  it("creates a new address (POST) when the patient has none", async () => {
    mockApiGet.mockResolvedValue([]);
    mockApiPost.mockResolvedValue({});
    renderWithProviders(<EditAddressScreen />);
    await waitFor(() => expect(screen.getByText("Guardar dirección")).toBeTruthy());

    await pickRegionAndComuna();
    fireEvent.changeText(screen.getByPlaceholderText("Av. Los Carrera"), "Nueva calle");
    fireEvent.changeText(screen.getByPlaceholderText("1234, Depto. 56"), "456");
    fireEvent.press(screen.getByText("Guardar dirección"));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalled());
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    expect(mockApiPut).not.toHaveBeenCalled();
  });

  it("updates the existing address (PUT) when one is already registered", async () => {
    mockApiGet.mockResolvedValue([
      {
        idDireccion: 5,
        calle: "Av. Los Carrera",
        numero: "123",
        comuna: "Santiago",
        region: santiagoRegion.name,
      },
    ]);
    mockApiPut.mockResolvedValue({});
    renderWithProviders(<EditAddressScreen />);

    await waitFor(() => expect(screen.getByDisplayValue("Av. Los Carrera")).toBeTruthy());
    fireEvent.press(screen.getByText("Guardar dirección"));

    await waitFor(() =>
      expect(mockApiPut).toHaveBeenCalledWith(
        "/api/patients/me/addresses/5",
        expect.objectContaining({ calle: "Av. Los Carrera", numero: "123" })
      )
    );
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  });

  it("shows an error alert when saving fails", async () => {
    mockApiGet.mockResolvedValue([]);
    mockApiPost.mockRejectedValue(new Error("network down"));
    renderWithProviders(<EditAddressScreen />);
    await waitFor(() => expect(screen.getByText("Guardar dirección")).toBeTruthy());

    await pickRegionAndComuna();
    fireEvent.changeText(screen.getByPlaceholderText("Av. Los Carrera"), "Nueva calle");
    fireEvent.changeText(screen.getByPlaceholderText("1234, Depto. 56"), "456");
    fireEvent.press(screen.getByText("Guardar dirección"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith("Error", "No se pudo guardar la dirección.")
    );
  });
});
