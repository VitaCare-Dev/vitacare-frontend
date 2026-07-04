import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import ForgotPasswordScreen from "@/screens/ForgotPasswordScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("@/config/firebase");

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockSendPasswordResetEmail = jest.fn();
jest.mock("firebase/auth", () => ({
  sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
}));

describe("ForgotPasswordScreen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSendPasswordResetEmail.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
  });

  it(
    "shows a validation error for an empty email",
    async () => {
      renderWithProviders(<ForgotPasswordScreen />);
      fireEvent.press(screen.getByText("Enviar enlace"));
      await waitFor(() => expect(screen.getByText("El correo es obligatorio.")).toBeTruthy());
    },
    10000
  );

  it("shows the confirmation message on success", async () => {
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
    renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("correo@vitacare.cl"), "a@b.cl");
    fireEvent.press(screen.getByText("Enviar enlace"));

    await waitFor(() =>
      expect(screen.getByText(/Si existe una cuenta con ese correo/)).toBeTruthy()
    );
  });

  it("shows the same generic confirmation for a nonexistent email, to avoid leaking which emails are registered", async () => {
    mockSendPasswordResetEmail.mockRejectedValue({ code: "auth/user-not-found" });
    renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("correo@vitacare.cl"), "nadie@b.cl");
    fireEvent.press(screen.getByText("Enviar enlace"));

    await waitFor(() =>
      expect(screen.getByText(/Si existe una cuenta con ese correo/)).toBeTruthy()
    );
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("shows a friendly error for an invalid email code from Firebase", async () => {
    mockSendPasswordResetEmail.mockRejectedValue({ code: "auth/invalid-email" });
    renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("correo@vitacare.cl"), "a@b.cl");
    fireEvent.press(screen.getByText("Enviar enlace"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "No se pudo enviar el correo",
        "El correo ingresado no es válido."
      )
    );
  });

  it("shows a generic error for an unknown error code", async () => {
    mockSendPasswordResetEmail.mockRejectedValue({ code: "auth/something-else" });
    renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("correo@vitacare.cl"), "a@b.cl");
    fireEvent.press(screen.getByText("Enviar enlace"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "No se pudo enviar el correo",
        "Ocurrió un error. Intenta nuevamente."
      )
    );
  });

  it("navigates back to login from the confirmation screen", async () => {
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
    renderWithProviders(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("correo@vitacare.cl"), "a@b.cl");
    fireEvent.press(screen.getByText("Enviar enlace"));
    await waitFor(() => expect(screen.getByText("Volver a iniciar sesión")).toBeTruthy());

    fireEvent.press(screen.getByText("Volver a iniciar sesión"));
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
