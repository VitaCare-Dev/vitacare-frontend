import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { apiGet } from "@/services/apiClient";
import ProfileScreen from "@/screens/ProfileScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated" }),
}));

const mockSignOut = jest.fn();
jest.mock("firebase/auth", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiGet: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;

const patient = {
  idPaciente: 1,
  rut: "12.345.678-9",
  nombre: "María",
  apellidoPaterno: "Pérez",
  apellidoMaterno: "Soto",
  fechaNacimiento: "1990-05-15",
  telefonoPrincipal: "+56 9 1234 5678",
  telefonoSecundario: null,
};

const address = {
  idDireccion: 1,
  calle: "Av. Los Carrera",
  numero: "123",
  comuna: "Santiago",
  region: "Metropolitana",
};

const disease = { idEnfermedad: 1, nombreEnfermedad: "Diabetes tipo 2" };

function mockApi(overrides: Partial<{ patient: unknown; addresses: unknown; diseases: unknown }> = {}) {
  mockApiGet.mockImplementation((path: string) => {
    if (path === "/api/patients/me") return Promise.resolve(overrides.patient ?? patient);
    if (path === "/api/patients/me/addresses") return Promise.resolve(overrides.addresses ?? [address]);
    if (path === "/api/patients/me/diseases") return Promise.resolve(overrides.diseases ?? [disease]);
    return Promise.resolve([]);
  });
}

describe("ProfileScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSignOut.mockReset();
    mockApiGet.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "renders patient details, address, and diseases once loaded",
    async () => {
      mockApi();
      renderWithProviders(<ProfileScreen />);
      await waitFor(() => expect(screen.getByText("María Pérez")).toBeTruthy());
      expect(screen.getByText("12.345.678-9")).toBeTruthy();
      expect(screen.getByText("Av. Los Carrera 123, Santiago, Metropolitana")).toBeTruthy();
      expect(screen.getByText("• Diabetes tipo 2")).toBeTruthy();
    },
    20000
  );

  it("shows fallback text when there is no address or disease registered", async () => {
    mockApi({ addresses: [], diseases: [] });
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("Sin dirección registrada")).toBeTruthy());
    expect(screen.getByText("Sin enfermedades registradas")).toBeTruthy();
  });

  it("navigates to medical info and providers screens", async () => {
    mockApi();
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("María Pérez")).toBeTruthy());

    fireEvent.press(screen.getByText("Ver información médica completa"));
    expect(mockPush).toHaveBeenCalledWith("/medical-info");

    fireEvent.press(screen.getByText("Consultar prestadores"));
    expect(mockPush).toHaveBeenCalledWith("/providers");
  });

  it("toggles dark mode via the switch", async () => {
    mockApi();
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("Desactivado")).toBeTruthy());

    fireEvent(screen.getByRole("switch"), "valueChange", true);
    await waitFor(() => expect(screen.getByText("Activado")).toBeTruthy());
  });

  it("asks for confirmation and signs out when the user confirms", async () => {
    mockApi();
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("María Pérez")).toBeTruthy());

    fireEvent.press(screen.getByText("Cerrar sesión"));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
