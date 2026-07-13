import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert, RefreshControl } from "react-native";

import { auth } from "@/config/firebase";
import { ApiError, apiDelete, apiGet } from "@/services/apiClient";
import MedicalInfoScreen from "@/screens/MedicalInfoScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated" }),
}));

const mockGetIdToken = jest.fn().mockResolvedValue("id-token");
const mockDeleteUser = jest.fn();
const mockReauthenticate = jest.fn();
const mockCredential = jest.fn().mockReturnValue("fake-credential");

jest.mock("@/config/firebase", () => ({
  auth: { currentUser: { email: "a@b.cl", getIdToken: () => mockGetIdToken() } },
}));

jest.mock("firebase/auth", () => ({
  EmailAuthProvider: { credential: (...args: unknown[]) => mockCredential(...args) },
  deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
  reauthenticateWithCredential: (...args: unknown[]) => mockReauthenticate(...args),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiGet: jest.fn(),
  apiDelete: jest.fn(),
}));

const mockApiGet = apiGet as jest.Mock;
const mockApiDelete = apiDelete as jest.Mock;

const patient = {
  idPaciente: 1,
  idUsuario: 1,
  rut: "12.345.678-9",
  nombre: "María",
  apellidoPaterno: "Pérez",
  apellidoMaterno: "Soto",
  fechaNacimiento: "1990-05-15",
  telefonoPrincipal: "+56 9 1234 5678",
  telefonoSecundario: null,
};

function mockApi(overrides: Record<string, unknown> = {}) {
  mockApiGet.mockImplementation((path: string) => {
    if (path === "/api/patients/me") return Promise.resolve(overrides.patient ?? patient);
    if (path === "/api/patients/me/addresses") return Promise.resolve(overrides.addresses ?? []);
    if (path === "/api/patients/me/diseases") return Promise.resolve(overrides.diseases ?? []);
    if (path === "/api/patients/me/thresholds")
      return Promise.resolve(overrides.thresholds ?? null);
    if (path === "/api/medications") return Promise.resolve(overrides.medications ?? []);
    return Promise.resolve([]);
  });
}

describe("MedicalInfoScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockApiGet.mockReset();
    mockApiDelete.mockReset();
    mockGetIdToken.mockClear().mockResolvedValue("id-token");
    mockDeleteUser.mockReset();
    mockReauthenticate.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
    (auth as { currentUser: unknown }).currentUser = {
      email: "a@b.cl",
      getIdToken: () => mockGetIdToken(),
    };
  });

  it(
    "renders patient, address, disease, threshold, and medication data",
    async () => {
      mockApi({
        addresses: [{ calle: "Av. Los Carrera", numero: "123", comuna: "Santiago", region: "RM" }],
        diseases: [{ idEnfermedad: 1, nombreEnfermedad: "Diabetes", descripcion: "Desc" }],
        thresholds: {
          glucosaMin: 70,
          glucosaMax: 180,
          sistolicaMax: 140,
          diastolicaMax: 90,
          temperaturaMax: 38,
        },
        medications: [{ idMedicamento: 1, activo: 1 }, { idMedicamento: 2, activo: 0 }],
      });
      renderWithProviders(<MedicalInfoScreen />);

      await waitFor(() => expect(screen.getByText("12.345.678-9")).toBeTruthy());
      expect(screen.getByText("María Pérez Soto")).toBeTruthy();
      expect(screen.getByText("Av. Los Carrera")).toBeTruthy();
      expect(screen.getByText("Diabetes")).toBeTruthy();
      expect(screen.getByText("70 mg/dL")).toBeTruthy();
      expect(screen.getByText("1")).toBeTruthy();
    },
    10000
  );

  it("shows fallback text for missing address, diseases, and thresholds", async () => {
    mockApi();
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() =>
      expect(screen.getByText("Sin dirección registrada")).toBeTruthy()
    );
    expect(screen.getByText("Sin enfermedades registradas")).toBeTruthy();
    expect(screen.getByText("Aún no tienes umbrales calculados")).toBeTruthy();
  });

  it("shows honest inline errors per section (not 'sin datos') when the requests fail with a non-404", async () => {
    // Un 500/red caída NO debe mostrarse como "Sin dirección registrada" /
    // "Sin enfermedades registradas": eso afirma un dato que no se pudo verificar.
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/api/patients/me") return Promise.resolve(patient);
      return Promise.reject(new ApiError(500, "backend caído"));
    });
    renderWithProviders(<MedicalInfoScreen />);

    await waitFor(() => expect(screen.getByText("No pudimos cargar tu dirección.")).toBeTruthy());
    expect(screen.getByText("No pudimos cargar tus enfermedades.")).toBeTruthy();
    expect(screen.getByText("No pudimos cargar tus umbrales médicos.")).toBeTruthy();
    expect(screen.getByText("No pudimos cargar tu tratamiento.")).toBeTruthy();
    expect(screen.queryByText("Sin dirección registrada")).toBeNull();
    expect(screen.queryByText("Sin enfermedades registradas")).toBeNull();
    expect(screen.queryByText("Aún no tienes umbrales calculados")).toBeNull();
  });

  it("treats a 404 as confirmed 'no data', not as a load error", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/api/patients/me") return Promise.resolve(patient);
      return Promise.reject(new ApiError(404, "not found"));
    });
    renderWithProviders(<MedicalInfoScreen />);

    await waitFor(() => expect(screen.getByText("Sin dirección registrada")).toBeTruthy());
    expect(screen.getByText("Aún no tienes umbrales calculados")).toBeTruthy();
    expect(screen.queryByText("No pudimos cargar tu dirección.")).toBeNull();
  });

  it("navigates to edit-profile, edit-address, add-disease, and change-password", async () => {
    mockApi();
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("12.345.678-9")).toBeTruthy());

    fireEvent.press(screen.getByText("Editar"));
    expect(mockPush).toHaveBeenCalledWith("/edit-profile");

    fireEvent.press(screen.getAllByText("Agregar")[0]);
    expect(mockPush).toHaveBeenCalledWith("/edit-address");

    fireEvent.press(screen.getAllByText("Agregar")[1]);
    expect(mockPush).toHaveBeenCalledWith("/add-disease");

    fireEvent.press(screen.getByText("Cambiar contraseña"));
    expect(mockPush).toHaveBeenCalledWith("/change-password");
  });

  it("deletes the account directly when reauthentication is not required", async () => {
    mockApi();
    mockDeleteUser.mockResolvedValue(undefined);
    mockApiDelete.mockResolvedValue({});
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("Eliminar cuenta")).toBeTruthy());

    fireEvent.press(screen.getByText("Eliminar cuenta"));

    await waitFor(() => expect(mockDeleteUser).toHaveBeenCalled());
    await waitFor(() => expect(mockApiDelete).toHaveBeenCalledWith("/api/patients/me", "id-token"));
  });

  it("shows the reauth modal when Firebase requires a recent login, then deletes on correct password", async () => {
    mockApi();
    mockDeleteUser
      .mockRejectedValueOnce({ code: "auth/requires-recent-login" })
      .mockResolvedValueOnce(undefined);
    mockReauthenticate.mockResolvedValue(undefined);
    mockApiDelete.mockResolvedValue({});
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("Eliminar cuenta")).toBeTruthy());

    fireEvent.press(screen.getByText("Eliminar cuenta"));
    await waitFor(() => expect(screen.getByText("Confirma tu contraseña")).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "mypassword");
    fireEvent.press(screen.getByText("Confirmar y eliminar cuenta"));

    await waitFor(() => expect(mockReauthenticate).toHaveBeenCalled());
    await waitFor(() => expect(mockApiDelete).toHaveBeenCalledWith("/api/patients/me", "id-token"));
  });

  it("shows an inline error in the modal for a wrong password", async () => {
    mockApi();
    mockDeleteUser.mockRejectedValue({ code: "auth/requires-recent-login" });
    mockReauthenticate.mockRejectedValue({ code: "auth/wrong-password" });
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("Eliminar cuenta")).toBeTruthy());

    fireEvent.press(screen.getByText("Eliminar cuenta"));
    await waitFor(() => expect(screen.getByText("Confirma tu contraseña")).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "wrong-pass");
    fireEvent.press(screen.getByText("Confirmar y eliminar cuenta"));

    await waitFor(() =>
      expect(screen.getByText("Contraseña incorrecta. Intenta de nuevo.")).toBeTruthy()
    );
  });

  it("shows a generic error when there is no active session during account deletion", async () => {
    mockApi();
    (auth as { currentUser: unknown }).currentUser = null;
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("Eliminar cuenta")).toBeTruthy());

    fireEvent.press(screen.getByText("Eliminar cuenta"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "No se pudo eliminar la cuenta",
        "Ocurrió un problema inesperado. Intenta de nuevo más tarde."
      )
    );
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("cancels the reauth modal without deleting the account", async () => {
    mockApi();
    mockDeleteUser.mockRejectedValue({ code: "auth/requires-recent-login" });
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("Eliminar cuenta")).toBeTruthy());

    fireEvent.press(screen.getByText("Eliminar cuenta"));
    await waitFor(() => expect(screen.getByText("Confirma tu contraseña")).toBeTruthy());

    fireEvent.press(screen.getByText("Cancelar"));

    expect(screen.queryByText("Confirma tu contraseña")).toBeNull();
    expect(mockReauthenticate).not.toHaveBeenCalled();
  });

  it("shows a generic error and closes the modal when reauthentication fails for an unrelated reason", async () => {
    mockApi();
    mockDeleteUser.mockRejectedValue({ code: "auth/requires-recent-login" });
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("Eliminar cuenta")).toBeTruthy());

    fireEvent.press(screen.getByText("Eliminar cuenta"));
    await waitFor(() => expect(screen.getByText("Confirma tu contraseña")).toBeTruthy());

    // Sin email en la sesión al momento de reautenticar: reauthMutation lanza
    // antes de llamar a reauthenticateWithCredential.
    (auth as { currentUser: unknown }).currentUser = { email: undefined };
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "mypassword");
    fireEvent.press(screen.getByText("Confirmar y eliminar cuenta"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "No se pudo eliminar la cuenta",
        "Ocurrió un problema inesperado. Intenta de nuevo más tarde."
      )
    );
    expect(mockReauthenticate).not.toHaveBeenCalled();
    expect(screen.queryByText("Confirma tu contraseña")).toBeNull();
  });

  it("retries each failing section from its own inline error notice", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/api/patients/me") return Promise.resolve(patient);
      return Promise.reject(new ApiError(500, "backend caído"));
    });
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("No pudimos cargar tu dirección.")).toBeTruthy());

    const retryButtons = screen.getAllByText("Reintentar");
    expect(retryButtons).toHaveLength(4);

    const callsBefore = mockApiGet.mock.calls.length;
    for (const button of retryButtons) {
      fireEvent.press(button);
    }

    await waitFor(() => expect(mockApiGet.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it("removes a disease when confirmed and refreshes diseases and thresholds", async () => {
    mockApi({
      diseases: [{ idEnfermedad: 1, nombreEnfermedad: "Diabetes", descripcion: "Desc" }],
    });
    mockApiDelete.mockResolvedValue(undefined);
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("Diabetes")).toBeTruthy());

    const callsBefore = mockApiGet.mock.calls.length;
    fireEvent.press(screen.getByText("Eliminar"));

    await waitFor(() =>
      expect(mockApiDelete).toHaveBeenCalledWith("/api/patients/me/diseases/1")
    );
    await waitFor(() => expect(mockApiGet.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it("shows an error alert when removing a disease fails", async () => {
    mockApi({
      diseases: [{ idEnfermedad: 1, nombreEnfermedad: "Diabetes", descripcion: "Desc" }],
    });
    mockApiDelete.mockRejectedValue(new ApiError(500, "backend caído"));
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("Diabetes")).toBeTruthy());

    fireEvent.press(screen.getByText("Eliminar"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "No se pudo eliminar",
        "Ocurrió un problema inesperado. Intenta de nuevo más tarde."
      )
    );
  });

  it("refetches all sections when the user pulls to refresh", async () => {
    mockApi();
    renderWithProviders(<MedicalInfoScreen />);
    await waitFor(() => expect(screen.getByText("12.345.678-9")).toBeTruthy());

    const callsBeforeRefresh = mockApiGet.mock.calls.length;
    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    await act(async () => refreshControl.props.onRefresh());

    expect(mockApiGet.mock.calls.length).toBeGreaterThan(callsBeforeRefresh);
  });
});
