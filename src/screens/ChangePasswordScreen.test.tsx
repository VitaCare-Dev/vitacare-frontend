import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { auth } from "@/config/firebase";
import ChangePasswordScreen from "@/screens/ChangePasswordScreen";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

const mockReauthenticate = jest.fn();
const mockUpdatePassword = jest.fn();
const mockCredential = jest.fn();
jest.mock("firebase/auth", () => ({
  EmailAuthProvider: { credential: (...args: unknown[]) => mockCredential(...args) },
  reauthenticateWithCredential: (...args: unknown[]) => mockReauthenticate(...args),
  updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
}));

jest.mock("@/config/firebase", () => ({
  auth: { currentUser: { email: "a@b.cl" } },
}));

const strongPassword = "Abcdef1!";

describe("ChangePasswordScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReauthenticate.mockReset();
    mockUpdatePassword.mockReset();
    mockCredential.mockReset().mockReturnValue("fake-credential");
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore();
    (auth as { currentUser: unknown }).currentUser = { email: "a@b.cl" };
  });

  function fillForm() {
    const [current, newPass, confirm] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.changeText(current, "old-pass");
    fireEvent.changeText(newPass, strongPassword);
    fireEvent.changeText(confirm, strongPassword);
  }

  function pressSubmit() {
    // "Cambiar contraseña" aparece también en el encabezado y el título de la
    // pantalla; el botón es la última coincidencia.
    const matches = screen.getAllByText("Cambiar contraseña");
    fireEvent.press(matches[matches.length - 1]);
  }

  it(
    "shows a validation error when the current password is empty",
    async () => {
      renderWithProviders(<ChangePasswordScreen />);
      pressSubmit();
      await waitFor(() =>
        expect(screen.getByText("La contraseña actual es obligatorio.")).toBeTruthy()
      );
    },
    10000
  );

  it("reauthenticates and updates the password on success", async () => {
    mockReauthenticate.mockResolvedValue(undefined);
    mockUpdatePassword.mockResolvedValue(undefined);
    renderWithProviders(<ChangePasswordScreen />);
    fillForm();
    pressSubmit();

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Contraseña actualizada",
        "Tu contraseña se cambió correctamente.",
        expect.anything()
      )
    );
    expect(mockCredential).toHaveBeenCalledWith("a@b.cl", "old-pass");
    expect(mockUpdatePassword).toHaveBeenCalledWith(expect.anything(), strongPassword);
  });

  it("navigates back after confirming the success alert", async () => {
    mockReauthenticate.mockResolvedValue(undefined);
    mockUpdatePassword.mockResolvedValue(undefined);
    renderWithProviders(<ChangePasswordScreen />);
    fillForm();
    pressSubmit();

    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    buttons[0].onPress();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("shows a friendly error when the current password is wrong", async () => {
    mockReauthenticate.mockRejectedValue({ code: "auth/wrong-password" });
    renderWithProviders(<ChangePasswordScreen />);
    fillForm();
    pressSubmit();

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "No se pudo cambiar la contraseña",
        "La contraseña actual es incorrecta."
      )
    );
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("shows a generic error for an unrecognized failure", async () => {
    mockReauthenticate.mockRejectedValue({ code: "auth/mystery" });
    renderWithProviders(<ChangePasswordScreen />);
    fillForm();
    pressSubmit();

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "No se pudo cambiar la contraseña",
        "Ocurrió un error. Intenta nuevamente."
      )
    );
  });

  it("shows an error and does not attempt to reauthenticate when there is no active session", async () => {
    (auth as { currentUser: unknown }).currentUser = null;
    renderWithProviders(<ChangePasswordScreen />);
    fillForm();
    pressSubmit();

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "No se pudo cambiar la contraseña",
        "No hay una sesión activa."
      )
    );
    expect(mockReauthenticate).not.toHaveBeenCalled();
  });

  it("shows the password requirements checklist reacting to the new password field", () => {
    renderWithProviders(<ChangePasswordScreen />);
    expect(screen.getByText("Mínimo 8 caracteres")).toBeTruthy();
    const [, newPass] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.changeText(newPass, strongPassword);
    expect(screen.getAllByText("✓")).toHaveLength(5);
  });
});
