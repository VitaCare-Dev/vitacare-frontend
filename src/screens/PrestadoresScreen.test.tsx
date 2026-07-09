import { RefreshControl } from "react-native";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import {
  getComunas,
  getEspecialidades,
  getPrestadores,
  getRegiones,
  searchPrestadores,
} from "@/services/prestadoresApi";
import PrestadoresScreen from "@/screens/PrestadoresScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/services/prestadoresApi", () => ({
  getPrestadores: jest.fn(),
  getEspecialidades: jest.fn(),
  getRegiones: jest.fn(),
  getComunas: jest.fn(),
  searchPrestadores: jest.fn(),
}));

const mockGetPrestadores = getPrestadores as jest.Mock;
const mockGetEspecialidades = getEspecialidades as jest.Mock;
const mockGetRegiones = getRegiones as jest.Mock;
const mockGetComunas = getComunas as jest.Mock;
const mockSearchPrestadores = searchPrestadores as jest.Mock;

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

const pendingPrestador = {
  ...prestador,
  id: "prestador-2",
  nombre: "Dr. Juan Soto",
  region: "Valparaíso",
  comuna: "Viña del Mar",
  estadoValidacion: "Pendiente" as const,
};

describe("PrestadoresScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGetPrestadores.mockReset().mockResolvedValue([prestador]);
    mockGetEspecialidades.mockReset().mockResolvedValue(["Cardiología"]);
    mockGetRegiones.mockReset().mockResolvedValue(["Metropolitana"]);
    mockGetComunas.mockReset().mockResolvedValue(["Providencia"]);
    mockSearchPrestadores.mockReset().mockResolvedValue([prestador]);
  });

  it(
    "loads and renders the provider list with filter chips",
    async () => {
      renderWithProviders(<PrestadoresScreen />);
      expect(screen.getByText("Cargando prestadores...")).toBeTruthy();

      await waitFor(() => expect(screen.getByText("Dra. Camila Rojas")).toBeTruthy());
      expect(screen.getAllByText("Cardiología").length).toBeGreaterThan(0);
    },
    10000
  );

  it("shows an empty state when no providers match", async () => {
    mockGetPrestadores.mockResolvedValue([]);
    mockSearchPrestadores.mockResolvedValue([]);
    renderWithProviders(<PrestadoresScreen />);

    await waitFor(() => expect(screen.getByText("No se encontraron prestadores")).toBeTruthy());
  });

  it("searches by typed text", async () => {
    renderWithProviders(<PrestadoresScreen />);
    await waitFor(() => expect(screen.getByText("Dra. Camila Rojas")).toBeTruthy());

    fireEvent.changeText(
      screen.getByPlaceholderText("Buscar por nombre o especialidad"),
      "Camila"
    );

    await waitFor(() =>
      expect(mockSearchPrestadores).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: "Camila" })
      )
    );
  });

  it("filters by a specialty chip", async () => {
    renderWithProviders(<PrestadoresScreen />);
    await waitFor(() => expect(screen.getByText("Dra. Camila Rojas")).toBeTruthy());

    fireEvent.press(screen.getAllByText("Cardiología")[0]);

    await waitFor(() =>
      expect(mockSearchPrestadores).toHaveBeenCalledWith(
        expect.objectContaining({ especialidad: "Cardiología" })
      )
    );
  });

  it("shows a generic error message when the initial load fails", async () => {
    mockGetPrestadores.mockRejectedValue(new Error("network down"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    renderWithProviders(<PrestadoresScreen />);

    await waitFor(() =>
      expect(screen.getByText("No fue posible cargar los prestadores.")).toBeTruthy()
    );
    (console.error as jest.Mock).mockRestore();
  });

  it("navigates to the provider detail screen", async () => {
    renderWithProviders(<PrestadoresScreen />);
    await waitFor(() => expect(screen.getByText("Ver detalle")).toBeTruthy());

    fireEvent.press(screen.getByText("Ver detalle"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/provider-detail",
      params: { providerId: "prestador-1" },
    });
  });

  it("reloads the provider catalog when the user pulls to refresh", async () => {
    renderWithProviders(<PrestadoresScreen />);
    await waitFor(() => expect(screen.getByText("Dra. Camila Rojas")).toBeTruthy());

    const callsBeforeRefresh = mockGetPrestadores.mock.calls.length;
    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    await act(async () => refreshControl.props.onRefresh());

    expect(mockGetPrestadores.mock.calls.length).toBeGreaterThan(callsBeforeRefresh);
  });

  it("shows a generic error message when pull-to-refresh fails", async () => {
    renderWithProviders(<PrestadoresScreen />);
    await waitFor(() => expect(screen.getByText("Dra. Camila Rojas")).toBeTruthy());

    jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetPrestadores.mockRejectedValue(new Error("network down"));
    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    await act(async () => refreshControl.props.onRefresh());

    await waitFor(() =>
      expect(screen.getByText("No fue posible cargar los prestadores.")).toBeTruthy()
    );
    (console.error as jest.Mock).mockRestore();
  });

  it("shows a generic error message when applying filters fails", async () => {
    renderWithProviders(<PrestadoresScreen />);
    await waitFor(() => expect(screen.getByText("Dra. Camila Rojas")).toBeTruthy());

    jest.spyOn(console, "error").mockImplementation(() => {});
    mockSearchPrestadores.mockRejectedValue(new Error("network down"));
    fireEvent.changeText(
      screen.getByPlaceholderText("Buscar por nombre o especialidad"),
      "Camila"
    );

    await waitFor(() =>
      expect(screen.getByText("No fue posible aplicar los filtros.")).toBeTruthy()
    );
    (console.error as jest.Mock).mockRestore();
  });

  it("shows the 'Pendiente' badge for a provider awaiting validation", async () => {
    mockGetPrestadores.mockResolvedValue([pendingPrestador]);
    mockSearchPrestadores.mockResolvedValue([pendingPrestador]);
    renderWithProviders(<PrestadoresScreen />);

    await waitFor(() => expect(screen.getByText("Dr. Juan Soto")).toBeTruthy());
    expect(screen.getByText("Pendiente")).toBeTruthy();
  });

  it("narrows comuna options to the selected region and resets the comuna filter", async () => {
    mockGetPrestadores.mockResolvedValue([prestador, pendingPrestador]);
    mockGetRegiones.mockResolvedValue(["Metropolitana", "Valparaíso"]);
    mockGetComunas.mockResolvedValue(["Providencia", "Viña del Mar"]);
    mockSearchPrestadores.mockResolvedValue([prestador, pendingPrestador]);
    renderWithProviders(<PrestadoresScreen />);
    await waitFor(() => expect(screen.getByText("Dra. Camila Rojas")).toBeTruthy());

    fireEvent.press(screen.getAllByText("Metropolitana")[0]);

    await waitFor(() =>
      expect(mockSearchPrestadores).toHaveBeenCalledWith(
        expect.objectContaining({ region: "Metropolitana", comuna: "" })
      )
    );
    // Solo debería quedar la comuna de los prestadores de esa región.
    expect(screen.queryByText("Viña del Mar")).toBeNull();
  });

  it("resets a filter chip to 'Todas' when the empty option is pressed", async () => {
    renderWithProviders(<PrestadoresScreen />);
    await waitFor(() => expect(screen.getByText("Dra. Camila Rojas")).toBeTruthy());

    fireEvent.press(screen.getAllByText("Cardiología")[0]);
    await waitFor(() =>
      expect(mockSearchPrestadores).toHaveBeenLastCalledWith(
        expect.objectContaining({ especialidad: "Cardiología" })
      )
    );

    fireEvent.press(screen.getAllByText("Todas")[0]);

    await waitFor(() =>
      expect(mockSearchPrestadores).toHaveBeenLastCalledWith(
        expect.objectContaining({ especialidad: "" })
      )
    );
  });
});
