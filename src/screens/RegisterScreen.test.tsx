import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { chileRegions, getComunasByRegion } from "@/data/chileRegions";
import { apiPost } from "@/services/apiClient";
import RegisterScreen from "@/screens/RegisterScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

const santiagoRegion = chileRegions.find((r) => r.name.includes("Metropolitana"))!;
const santiagoComuna = getComunasByRegion(santiagoRegion.id).find((c) => c.name === "Santiago")!;

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

let mockAuthState: { status: string } = { status: "unauthenticated" };
const mockRefreshAuthProfile = jest.fn().mockResolvedValue(undefined);
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
  refreshAuthProfile: () => mockRefreshAuthProfile(),
}));

const mockCreateUser = jest.fn();
const mockUpdateProfile = jest.fn();
jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUser(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
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
    mockAuthState = { status: "unauthenticated" };
    mockRefreshAuthProfile.mockClear();
    mockCreateUser.mockReset();
    mockUpdateProfile.mockReset();
    mockApiPost.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
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
    await waitFor(() => expect(mockRefreshAuthProfile).toHaveBeenCalled());
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

  it("starts at step 2 of 2 and skips credentials when completing an existing profile", async () => {
    mockAuthState = { status: "authenticated" };
    mockApiPost.mockResolvedValue({});
    renderWithProviders(<RegisterScreen />);

    expect(screen.getByText("Paso 1 de 2 — Tus datos personales.")).toBeTruthy();
    expect(screen.queryByPlaceholderText("correo@vitacare.cl")).toBeNull();

    await fillPersonalStep();
    await waitFor(() => expect(screen.getByText("Paso 2 de 2 — Tu dirección.")).toBeTruthy());
    await fillAddressStep();
    fireEvent.press(screen.getByText("Completar registro"));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith("/api/auth/register", expect.anything()));
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("navigates back from step 2 to step 1 in the signup flow", async () => {
    renderWithProviders(<RegisterScreen />);
    await fillCredentialsStep();

    fireEvent.press(screen.getByText("Atrás"));
    await waitFor(() => expect(screen.getByText("Paso 1 de 3 — Tu cuenta.")).toBeTruthy());
  });
});
