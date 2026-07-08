import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Image as ExpoImage } from "expo-image";
import { Alert, RefreshControl } from "react-native";

import { ApiError, apiGet } from "@/services/apiClient";
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

const mockPickProfilePhoto = jest.fn();
const mockTakeProfilePhoto = jest.fn();
const mockUploadProfilePhoto = jest.fn();
jest.mock("@/services/profilePhoto", () => ({
  pickProfilePhoto: (...args: unknown[]) => mockPickProfilePhoto(...args),
  takeProfilePhoto: (...args: unknown[]) => mockTakeProfilePhoto(...args),
  uploadProfilePhoto: (...args: unknown[]) => mockUploadProfilePhoto(...args),
}));

const mockAreNotificationsEnabled = jest.fn();
const mockSetNotificationsEnabled = jest.fn();
jest.mock("@/services/notifications", () => ({
  notificationsAvailable: true,
  areNotificationsEnabled: (...args: unknown[]) => mockAreNotificationsEnabled(...args),
  setNotificationsEnabled: (...args: unknown[]) => mockSetNotificationsEnabled(...args),
}));

/** Simula elegir una opción del Alert que abre `handleChangePhoto` (Cancelar/Tomar foto/Elegir de galería). */
function pressChangePhotoOption(buttonIndex: number) {
  (Alert.alert as jest.Mock).mockImplementationOnce((_title, _msg, buttons) => {
    buttons?.[buttonIndex]?.onPress?.();
  });
  fireEvent.press(screen.getByLabelText("Cambiar foto de perfil"));
}

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
  fotoPerfilUrl: null as string | null,
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
    mockPickProfilePhoto.mockReset();
    mockTakeProfilePhoto.mockReset();
    mockUploadProfilePhoto.mockReset();
    mockAreNotificationsEnabled.mockReset().mockResolvedValue(true);
    mockSetNotificationsEnabled.mockReset().mockResolvedValue(undefined);
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

  it("caches the profile photo by its stable blob URL, ignoring the SAS query string", async () => {
    mockApi({
      patient: {
        ...patient,
        fotoPerfilUrl:
          "https://vitacareprofilephotos.blob.core.windows.net/profile-photos/paciente-1.jpg?sv=2020-12-06&sig=abc",
      },
    });
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("María Pérez")).toBeTruthy());

    const image = screen.UNSAFE_getByType(ExpoImage);
    expect(image.props.source.uri).toBe(
      "https://vitacareprofilephotos.blob.core.windows.net/profile-photos/paciente-1.jpg?sv=2020-12-06&sig=abc"
    );
    expect(image.props.source.cacheKey).toBe(
      "https://vitacareprofilephotos.blob.core.windows.net/profile-photos/paciente-1.jpg"
    );
  });

  it("shows fallback text when there is no address or disease registered", async () => {
    mockApi({ addresses: [], diseases: [] });
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("Sin dirección registrada")).toBeTruthy());
    expect(screen.getByText("Sin enfermedades registradas")).toBeTruthy();
  });

  it("shows honest inline errors (not 'sin datos') when addresses/diseases fail with a non-404", async () => {
    // Un 500/red caída NO debe mostrarse como "Sin dirección registrada":
    // eso es un dato confirmado, y acá el estado real es "no se pudo verificar".
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/api/patients/me") return Promise.resolve(patient);
      return Promise.reject(new ApiError(500, "backend caído"));
    });
    renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(screen.getByText("No pudimos cargar tu dirección.")).toBeTruthy());
    expect(screen.getByText("No pudimos cargar tus enfermedades.")).toBeTruthy();
    expect(screen.queryByText("Sin dirección registrada")).toBeNull();
    expect(screen.queryByText("Sin enfermedades registradas")).toBeNull();
  });

  it("treats a 404 from addresses as confirmed 'no data', not as an error", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/api/patients/me") return Promise.resolve(patient);
      if (path === "/api/patients/me/diseases") return Promise.resolve([disease]);
      return Promise.reject(new ApiError(404, "not found"));
    });
    renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(screen.getByText("Sin dirección registrada")).toBeTruthy());
    expect(screen.queryByText("No pudimos cargar tu dirección.")).toBeNull();
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

    fireEvent(screen.getByLabelText("Tema oscuro"), "valueChange", true);
    await waitFor(() => expect(screen.getByText("Activado")).toBeTruthy());
  });

  it("shows notifications as enabled by default and lets the user disable them", async () => {
    mockApi();
    // La primera lectura (al montar) dice "activadas"; tras desactivar, la
    // pantalla invalida la query y vuelve a leerla, ahora "desactivada".
    mockAreNotificationsEnabled.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    renderWithProviders(<ProfileScreen />);
    await waitFor(() =>
      expect(screen.getByText("Activadas: te avisamos cuando toca un medicamento")).toBeTruthy()
    );

    await act(async () => fireEvent(screen.getByLabelText("Notificaciones"), "valueChange", false));

    expect(mockSetNotificationsEnabled.mock.calls[0]?.[0]).toBe(false);
    await waitFor(() =>
      expect(
        screen.getByText("Desactivadas: no recibirás recordatorios de medicamentos")
      ).toBeTruthy()
    );
  });

  it("reflects a previously disabled notifications preference", async () => {
    mockApi();
    mockAreNotificationsEnabled.mockResolvedValue(false);
    renderWithProviders(<ProfileScreen />);

    await waitFor(() =>
      expect(
        screen.getByText("Desactivadas: no recibirás recordatorios de medicamentos")
      ).toBeTruthy()
    );
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

  it("opens a chooser and uploads a photo from the gallery when picked", async () => {
    mockApi();
    mockPickProfilePhoto.mockResolvedValue("file:///local/photo.jpg");
    mockUploadProfilePhoto.mockResolvedValue(undefined);
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("María Pérez")).toBeTruthy());

    await act(async () => pressChangePhotoOption(2)); // "Elegir de galería"

    expect(mockPickProfilePhoto).toHaveBeenCalled();
    expect(mockTakeProfilePhoto).not.toHaveBeenCalled();
    await waitFor(() => expect(mockUploadProfilePhoto.mock.calls[0]?.[0]).toBe("file:///local/photo.jpg"));
  });

  it("uploads a photo taken with the camera when that option is chosen", async () => {
    mockApi();
    mockTakeProfilePhoto.mockResolvedValue("file:///local/camera.jpg");
    mockUploadProfilePhoto.mockResolvedValue(undefined);
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("María Pérez")).toBeTruthy());

    await act(async () => pressChangePhotoOption(1)); // "Tomar foto"

    expect(mockTakeProfilePhoto).toHaveBeenCalled();
    expect(mockPickProfilePhoto).not.toHaveBeenCalled();
    await waitFor(() => expect(mockUploadProfilePhoto.mock.calls[0]?.[0]).toBe("file:///local/camera.jpg"));
  });

  it("does not open the picker or upload anything when the user cancels the chooser", async () => {
    mockApi();
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("María Pérez")).toBeTruthy());

    await act(async () => pressChangePhotoOption(0)); // "Cancelar"

    expect(mockPickProfilePhoto).not.toHaveBeenCalled();
    expect(mockTakeProfilePhoto).not.toHaveBeenCalled();
    expect(mockUploadProfilePhoto).not.toHaveBeenCalled();
  });

  it("does not upload anything when the user cancels the photo picker itself", async () => {
    mockApi();
    mockPickProfilePhoto.mockResolvedValue(null);
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("María Pérez")).toBeTruthy());

    await act(async () => pressChangePhotoOption(2));

    expect(mockUploadProfilePhoto).not.toHaveBeenCalled();
  });

  it("shows an error alert when the upload fails", async () => {
    mockApi();
    mockPickProfilePhoto.mockResolvedValue("file:///local/photo.jpg");
    mockUploadProfilePhoto.mockRejectedValue(new Error("boom"));
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("María Pérez")).toBeTruthy());

    await act(async () => pressChangePhotoOption(2));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith("Error", "No se pudo subir la foto de perfil.")
    );
  });

  it("refetches patient data when the user pulls to refresh", async () => {
    mockApi();
    renderWithProviders(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText("María Pérez")).toBeTruthy());

    const callsBeforeRefresh = mockApiGet.mock.calls.length;
    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    await act(async () => refreshControl.props.onRefresh());

    expect(mockApiGet.mock.calls.length).toBeGreaterThan(callsBeforeRefresh);
  });
});
