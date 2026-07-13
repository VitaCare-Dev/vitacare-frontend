import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { auth } from "@/config/firebase";
import { chileRegions, getComunasByRegion } from "@/data/chileRegions";
import { ApiError, apiPost } from "@/services/apiClient";
import RegisterScreen from "@/screens/RegisterScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

const santiagoRegion = chileRegions.find((r) => r.name.includes("Metropolitana"))!;
const santiagoComuna = getComunasByRegion(santiagoRegion.id).find((c) => c.name === "Santiago")!;

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

const mockRefreshAuthProfile = jest.fn().mockResolvedValue(undefined);
jest.mock("@/context/AuthContext", () => ({
  refreshAuthProfile: () => mockRefreshAuthProfile(),
}));

const mockCreateUser = jest.fn();
const mockUpdateProfile = jest.fn();
const mockFetchSignInMethodsForEmail = jest.fn();
jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUser(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  fetchSignInMethodsForEmail: (...args: unknown[]) => mockFetchSignInMethodsForEmail(...args),
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiPost: jest.fn(),
}));

const mockApiPost = apiPost as jest.Mock;

const strongPassword = "Abcdef1!";

async function fillCredentialsStep() {
  fireEvent.changeText(screen.getByPlaceholderText("correo@vitacare.cl"), "maria@vitacare.cl");
  const [password, confirm] = screen.getAllByPlaceholderText("••••••••");
  fireEvent.changeText(password, strongPassword);
  fireEvent.changeText(confirm, strongPassword);
  fireEvent.press(screen.getByText("Siguiente"));
  await waitFor(() => expect(screen.getByText("Paso 2 de 3 — Tus datos personales.")).toBeTruthy());
}

async function fillPersonalStep(nextLabel = "Siguiente") {
  fireEvent.changeText(screen.getByPlaceholderText("12.345.678-9"), "111111111");
  fireEvent.changeText(screen.getByPlaceholderText("María Carolina"), "María");
  fireEvent.changeText(screen.getByPlaceholderText("Pérez"), "Pérez");
  fireEvent.press(screen.getByText("Fecha de nacimiento"));
  const datePicker = screen.UNSAFE_getByType(DateTimePicker);
  await act(async () => datePicker.props.onValueChange({} as never, new Date(1990, 4, 15)));
  fireEvent.changeText(screen.getByPlaceholderText("8765 4321"), "12345678");
  fireEvent.press(screen.getByText(nextLabel));
}

async function fillAddressStep() {
  const pickers = screen.UNSAFE_getAllByType(Picker);
  await act(async () => pickers[0].props.onValueChange(santiagoRegion.id));
  const pickersAfter = screen.UNSAFE_getAllByType(Picker);
  await act(async () => pickersAfter[1].props.onValueChange(santiagoComuna.id));
  fireEvent.changeText(screen.getByPlaceholderText("Av. Los Carrera"), "Av. Providencia");
  fireEvent.changeText(screen.getByPlaceholderText("1234, Depto. 56"), "456");
}

describe("RegisterScreen", () => {
  beforeEach(() => {
    mockRefreshAuthProfile.mockClear();
    mockCreateUser.mockReset();
    mockUpdateProfile.mockReset();
    mockApiPost.mockReset();
    // Por defecto el correo no está registrado: los tests que no verifican
    // este chequeo en particular no necesitan configurarlo aparte.
    mockFetchSignInMethodsForEmail.mockReset().mockResolvedValue([]);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
    (auth as { currentUser: unknown }).currentUser = null;
  });

  it(
    "blocks moving to step 2 when credentials are invalid",
    async () => {
      renderWithProviders(<RegisterScreen />);
      fireEvent.press(screen.getByText("Siguiente"));
      await waitFor(() => expect(screen.getByText("El correo es obligatorio.")).toBeTruthy());
      expect(screen.getByText("Paso 1 de 3 — Tu cuenta.")).toBeTruthy();
    },
    10000
  );

  it("completes the full 3-step signup and registers patient + address", async () => {
    mockCreateUser.mockResolvedValue({ user: { uid: "u1" } });
    mockUpdateProfile.mockResolvedValue(undefined);
    mockApiPost.mockResolvedValue({});
    // El éxito muestra un Alert de confirmación; refreshAuthProfile() (lo que
    // dispara la navegación) solo se llama al presionar "Continuar" ahí.
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      buttons?.[0]?.onPress?.();
    });
    renderWithProviders(<RegisterScreen />);

    await fillCredentialsStep();
    await fillPersonalStep();
    await waitFor(() => expect(screen.getByText("Paso 3 de 3 — Tu dirección.")).toBeTruthy());
    await fillAddressStep();

    fireEvent.press(screen.getAllByText("Registrarse").slice(-1)[0]);

    await waitFor(() =>
      expect(mockCreateUser).toHaveBeenCalledWith(expect.anything(), "maria@vitacare.cl", strongPassword)
    );
    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({ nombre: "María", apellidoPaterno: "Pérez" })
      )
    );
    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/patients/me/addresses",
        expect.objectContaining({ calle: "Av. Providencia", numero: "456" })
      )
    );
    expect(Alert.alert).toHaveBeenCalledWith("Registro exitoso", undefined, expect.anything());
    await waitFor(() => expect(mockRefreshAuthProfile).toHaveBeenCalled());

    // Tras el éxito, la pantalla se mantiene en estado de carga (no vuelve a
    // mostrar "Registrarse") hasta que AppNavigator navegue fuera de esta
    // pantalla, para no mostrar el formulario "normal" por un instante.
    expect(screen.getByText("Guardando...")).toBeTruthy();
  });

  it("does not call refreshAuthProfile (and so does not navigate) until the user dismisses the success alert", async () => {
    mockCreateUser.mockResolvedValue({ user: { uid: "u1" } });
    mockUpdateProfile.mockResolvedValue(undefined);
    mockApiPost.mockResolvedValue({});
    // A diferencia del test anterior, acá el mock de Alert NO presiona el
    // botón: simula al usuario viendo el mensaje sin haberlo cerrado todavía.
    renderWithProviders(<RegisterScreen />);

    await fillCredentialsStep();
    await fillPersonalStep();
    await waitFor(() => expect(screen.getByText("Paso 3 de 3 — Tu dirección.")).toBeTruthy());
    await fillAddressStep();
    fireEvent.press(screen.getAllByText("Registrarse").slice(-1)[0]);

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/patients/me/addresses",
        expect.objectContaining({ calle: "Av. Providencia", numero: "456" })
      )
    );
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    expect(mockRefreshAuthProfile).not.toHaveBeenCalled();
  });

  it("blocks moving to step 2 when the email is already registered, without creating a Firebase account", async () => {
    mockFetchSignInMethodsForEmail.mockResolvedValue(["password"]);
    renderWithProviders(<RegisterScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("correo@vitacare.cl"), "maria@vitacare.cl");
    const [password, confirm] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.changeText(password, strongPassword);
    fireEvent.changeText(confirm, strongPassword);
    fireEvent.press(screen.getByText("Siguiente"));

    await waitFor(() => expect(screen.getByText("Ya existe una cuenta con ese correo.")).toBeTruthy());
    expect(screen.getByText("Paso 1 de 3 — Tu cuenta.")).toBeTruthy();
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockFetchSignInMethodsForEmail).toHaveBeenCalledWith(expect.anything(), "maria@vitacare.cl");
  });

  it("still proceeds to step 2 if checking email availability fails (e.g. network error)", async () => {
    mockFetchSignInMethodsForEmail.mockRejectedValue(new Error("network down"));
    renderWithProviders(<RegisterScreen />);

    await fillCredentialsStep();

    expect(screen.getByText("Paso 2 de 3 — Tus datos personales.")).toBeTruthy();
  });

  it("shows a friendly error when the email is already registered", async () => {
    mockCreateUser.mockRejectedValue({ code: "auth/email-already-in-use" });
    renderWithProviders(<RegisterScreen />);

    await fillCredentialsStep();
    await fillPersonalStep();
    await waitFor(() => expect(screen.getByText("Paso 3 de 3 — Tu dirección.")).toBeTruthy());
    await fillAddressStep();
    fireEvent.press(screen.getAllByText("Registrarse").slice(-1)[0]);

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error al registrarse",
        "Ya existe una cuenta con ese correo."
      )
    );
  });

  it("continues straight to the address when the patient already exists (409 from a previous attempt)", async () => {
    // Simula el re-submit tras cancelar un reintento de dirección: el
    // paciente ya quedó creado, así que /api/auth/register responde 409.
    // No debe mostrarse un error — se salta directo a registrar la dirección.
    mockCreateUser.mockResolvedValue({ user: { uid: "u1" } });
    mockUpdateProfile.mockResolvedValue(undefined);
    mockApiPost.mockImplementation((path: string) => {
      if (path === "/api/auth/register") {
        return Promise.reject(new ApiError(409, "Paciente ya registrado"));
      }
      return Promise.resolve({});
    });
    renderWithProviders(<RegisterScreen />);

    await fillCredentialsStep();
    await fillPersonalStep();
    await waitFor(() => expect(screen.getByText("Paso 3 de 3 — Tu dirección.")).toBeTruthy());
    await fillAddressStep();
    fireEvent.press(screen.getAllByText("Registrarse").slice(-1)[0]);

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/patients/me/addresses",
        expect.objectContaining({ calle: "Av. Providencia", numero: "456" })
      )
    );
    expect(Alert.alert).toHaveBeenCalledWith("Registro exitoso", undefined, expect.anything());
    expect(Alert.alert).not.toHaveBeenCalledWith(
      "Error al completar el registro",
      expect.anything(),
      expect.anything()
    );
  });

  it("offers to retry when the address registration fails", async () => {
    mockCreateUser.mockResolvedValue({ user: { uid: "u1" } });
    mockUpdateProfile.mockResolvedValue(undefined);
    mockApiPost.mockImplementation((path: string) => {
      if (path === "/api/patients/me/addresses") return Promise.reject(new Error("network down"));
      return Promise.resolve({});
    });
    renderWithProviders(<RegisterScreen />);

    await fillCredentialsStep();
    await fillPersonalStep();
    await waitFor(() => expect(screen.getByText("Paso 3 de 3 — Tu dirección.")).toBeTruthy());
    await fillAddressStep();
    fireEvent.press(screen.getAllByText("Registrarse").slice(-1)[0]);

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error al registrar tu dirección",
        "No se pudo registrar tu dirección.",
        expect.anything()
      )
    );
  });

  it("retries registering the address when 'Reintentar' is pressed after a failure", async () => {
    mockCreateUser.mockResolvedValue({ user: { uid: "u1" } });
    mockUpdateProfile.mockResolvedValue(undefined);
    let addressAttempts = 0;
    mockApiPost.mockImplementation((path: string) => {
      if (path === "/api/patients/me/addresses") {
        addressAttempts += 1;
        if (addressAttempts === 1) return Promise.reject(new Error("network down"));
        return Promise.resolve({});
      }
      return Promise.resolve({});
    });
    renderWithProviders(<RegisterScreen />);

    await fillCredentialsStep();
    await fillPersonalStep();
    await waitFor(() => expect(screen.getByText("Paso 3 de 3 — Tu dirección.")).toBeTruthy());
    await fillAddressStep();
    fireEvent.press(screen.getAllByText("Registrarse").slice(-1)[0]);

    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    await act(async () => buttons[0].onPress());

    await waitFor(() => expect(addressAttempts).toBe(2));
    expect(Alert.alert).toHaveBeenCalledWith("Registro exitoso", undefined, expect.anything());
  });

  it("shows a generic error and offers to retry when patient registration fails for a non-409 reason", async () => {
    mockCreateUser.mockResolvedValue({ user: { uid: "u1" } });
    mockUpdateProfile.mockResolvedValue(undefined);
    let registerAttempts = 0;
    mockApiPost.mockImplementation((path: string) => {
      if (path === "/api/auth/register") {
        registerAttempts += 1;
        if (registerAttempts === 1) return Promise.reject(new ApiError(500, "backend caído"));
        return Promise.resolve({});
      }
      return Promise.resolve({});
    });
    renderWithProviders(<RegisterScreen />);

    await fillCredentialsStep();
    await fillPersonalStep();
    await waitFor(() => expect(screen.getByText("Paso 3 de 3 — Tu dirección.")).toBeTruthy());
    await fillAddressStep();
    fireEvent.press(screen.getAllByText("Registrarse").slice(-1)[0]);

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error al completar el registro",
        "No se pudo completar tu registro de paciente. Intenta de nuevo.",
        expect.anything()
      )
    );

    // Presionar "Reintentar" del alert de registro de paciente.
    const call = (Alert.alert as jest.Mock).mock.calls.find(
      ([title]) => title === "Error al completar el registro"
    );
    await act(async () => call[2][0].onPress());

    await waitFor(() => expect(registerAttempts).toBe(2));
    expect(Alert.alert).toHaveBeenCalledWith("Registro exitoso", undefined, expect.anything());
  });

  it("navigates back from step 2 to step 1 in the signup flow", async () => {
    renderWithProviders(<RegisterScreen />);
    await fillCredentialsStep();

    fireEvent.press(screen.getByText("Atrás"));
    await waitFor(() => expect(screen.getByText("Paso 1 de 3 — Tu cuenta.")).toBeTruthy());
  });

  it("navigates back from step 3 to step 2", async () => {
    renderWithProviders(<RegisterScreen />);
    await fillCredentialsStep();
    await fillPersonalStep();
    await waitFor(() => expect(screen.getByText("Paso 3 de 3 — Tu dirección.")).toBeTruthy());

    fireEvent.press(screen.getByText("Atrás"));

    await waitFor(() => expect(screen.getByText("Paso 2 de 3 — Tus datos personales.")).toBeTruthy());
  });

  it("dismisses the birth date picker without changing the date when cancelled", async () => {
    renderWithProviders(<RegisterScreen />);
    await fillCredentialsStep();

    fireEvent.press(screen.getByText("Fecha de nacimiento"));
    const datePicker = screen.UNSAFE_getByType(DateTimePicker);
    await act(async () => datePicker.props.onDismiss());

    expect(screen.UNSAFE_queryByType(DateTimePicker)).toBeNull();
  });

  it("toggles password visibility for both the password and confirm-password fields", async () => {
    renderWithProviders(<RegisterScreen />);

    expect(screen.getAllByLabelText("ojo")).toHaveLength(2);

    fireEvent.press(screen.getAllByLabelText("ojo")[0]);
    expect(screen.getAllByLabelText("cerrar-ojo")).toHaveLength(2);

    fireEvent.press(screen.getAllByLabelText("cerrar-ojo")[1]);
    expect(screen.getAllByLabelText("ojo")).toHaveLength(2);
  });

  describe("when a Firebase user is already authenticated (ej. recién inició sesión con Google)", () => {
    beforeEach(() => {
      (auth as { currentUser: unknown }).currentUser = { uid: "g1", displayName: "María Pérez" };
    });

    it("skips the credentials step and starts at step 2, pre-filling the name", async () => {
      renderWithProviders(<RegisterScreen />);
      await waitFor(() => expect(screen.getByText("Paso 2 de 3 — Tus datos personales.")).toBeTruthy());
      expect(screen.queryByPlaceholderText("correo@vitacare.cl")).toBeNull();
      expect(screen.getByDisplayValue("María Pérez")).toBeTruthy();
    });

    it("does not show an 'Atrás' button on step 2 (there is no step 1 to go back to)", async () => {
      renderWithProviders(<RegisterScreen />);
      await waitFor(() => expect(screen.getByText("Paso 2 de 3 — Tus datos personales.")).toBeTruthy());
      expect(screen.queryByText("Atrás")).toBeNull();
    });

    it("does not create a new Firebase account, only updates the existing user's profile", async () => {
      mockUpdateProfile.mockResolvedValue(undefined);
      mockApiPost.mockResolvedValue({});
      renderWithProviders(<RegisterScreen />);

      await waitFor(() => expect(screen.getByText("Paso 2 de 3 — Tus datos personales.")).toBeTruthy());
      await fillPersonalStep();
      await waitFor(() => expect(screen.getByText("Paso 3 de 3 — Tu dirección.")).toBeTruthy());
      await fillAddressStep();
      fireEvent.press(screen.getAllByText("Registrarse").slice(-1)[0]);

      await waitFor(() =>
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          { uid: "g1", displayName: "María Pérez" },
          expect.objectContaining({ displayName: "María Pérez" })
        )
      );
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });
});
