import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import LoginScreen from "@/screens/LoginScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

const mockSignIn = jest.fn();
jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignIn(...args),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockSignIn.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "shows validation errors when submitting empty fields",
    async () => {
      renderWithProviders(<LoginScreen />);
      fireEvent.press(screen.getByText("Iniciar sesión"));
      await waitFor(() => expect(screen.getByText("El correo es obligatorio.")).toBeTruthy());
      expect(mockSignIn).not.toHaveBeenCalled();
    },
    10000
  );

  it("signs in and navigates home on success", async () => {
    mockSignIn.mockResolvedValue({});
    renderWithProviders(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("correo@vitacare.cl"), "a@b.cl");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "secret");
    fireEvent.press(screen.getByText("Iniciar sesión"));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(tabs)/home"));
    expect(mockSignIn).toHaveBeenCalledWith(expect.anything(), "a@b.cl", "secret");
  });

  it("shows a friendly error message for wrong-password", async () => {
    mockSignIn.mockRejectedValue({ code: "auth/wrong-password" });
    renderWithProviders(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("correo@vitacare.cl"), "a@b.cl");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "secret");
    fireEvent.press(screen.getByText("Iniciar sesión"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error al iniciar sesión",
        "Contraseña incorrecta."
      )
    );
  });

  it("shows a generic error message for unknown auth error codes", async () => {
    mockSignIn.mockRejectedValue({ code: "auth/unknown-thing" });
    renderWithProviders(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("correo@vitacare.cl"), "a@b.cl");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "secret");
    fireEvent.press(screen.getByText("Iniciar sesión"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error al iniciar sesión",
        "Ocurrió un error. Intenta nuevamente."
      )
    );
  });

  it("toggles password visibility", () => {
    renderWithProviders(<LoginScreen />);
    expect(screen.getByLabelText("ojo")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("ojo"));
    expect(screen.getByLabelText("cerrar-ojo")).toBeTruthy();
  });

  it("navigates to /forgot-password", () => {
    renderWithProviders(<LoginScreen />);
    fireEvent.press(screen.getByText("¿Olvidaste tu contraseña?"));
    expect(mockPush).toHaveBeenCalledWith("/forgot-password");
  });

  it("navigates to /register", () => {
    renderWithProviders(<LoginScreen />);
    fireEvent.press(screen.getByText("Registrarse"));
    expect(mockPush).toHaveBeenCalledWith("/register");
  });
});
