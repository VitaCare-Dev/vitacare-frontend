import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { getPrestadorById } from "@/services/prestadoresApi";
import PrestadorDetailScreen from "@/screens/PrestadorDetailScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

let mockProviderId: string | undefined = "prestador-1";
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ providerId: mockProviderId }),
}));

jest.mock("@/services/prestadoresApi", () => ({
  getPrestadorById: jest.fn(),
}));

const mockGetPrestadorById = getPrestadorById as jest.Mock;

const prestador = {
  id: "prestador-1",
  nombre: "Dra. Camila Rojas",
  especialidad: "Cardiología",
  rut: "16.234.567-8",
  registroProfesional: "123456",
  region: "Metropolitana",
  comuna: "Providencia",
  estadoValidacion: "Validado" as const,
  institucion: "Clínica Central",
  telefono: "+56 2 2345 6789",
  email: "camila.rojas@clinica.cl",
  direccion: "Av. Providencia 1234",
  fechaActualizacion: "2026-01-01",
};

describe("PrestadorDetailScreen", () => {
  beforeEach(() => {
    mockProviderId = "prestador-1";
    mockBack.mockClear();
    mockGetPrestadorById.mockReset();
  });

  it(
    "renders the provider's details once loaded",
    async () => {
      mockGetPrestadorById.mockResolvedValue(prestador);
      renderWithProviders(<PrestadorDetailScreen />);
      expect(screen.getByText("Cargando prestador...")).toBeTruthy();

      await waitFor(() => expect(screen.getByText("Dra. Camila Rojas")).toBeTruthy());
      expect(screen.getByText("Cardiología")).toBeTruthy();
      expect(screen.getByText("Validado")).toBeTruthy();
      expect(screen.getByText("Clínica Central")).toBeTruthy();
    },
    10000
  );

  it("shows a not-found message when the provider does not exist", async () => {
    mockGetPrestadorById.mockResolvedValue(null);
    renderWithProviders(<PrestadorDetailScreen />);
    await waitFor(() => expect(screen.getByText("Prestador no encontrado.")).toBeTruthy());
  });

  it("shows a not-found message when there is no providerId param", async () => {
    mockProviderId = undefined;
    renderWithProviders(<PrestadorDetailScreen />);
    await waitFor(() => expect(screen.getByText("Prestador no encontrado.")).toBeTruthy());
    expect(mockGetPrestadorById).not.toHaveBeenCalled();
  });

  it("navigates back when 'Volver' is pressed", async () => {
    mockGetPrestadorById.mockResolvedValue(prestador);
    renderWithProviders(<PrestadorDetailScreen />);
    await waitFor(() => expect(screen.getByText("Volver")).toBeTruthy());

    fireEvent.press(screen.getByText("Volver"));
    expect(mockBack).toHaveBeenCalled();
  });
});
