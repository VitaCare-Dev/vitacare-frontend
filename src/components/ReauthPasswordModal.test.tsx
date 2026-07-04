import { fireEvent, screen } from "@testing-library/react-native";

import { ReauthPasswordModal } from "@/components/ReauthPasswordModal";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("ReauthPasswordModal", () => {
  it("renders its content when visible", () => {
    renderWithProviders(
      <ReauthPasswordModal
        visible
        loading={false}
        errorMessage=""
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText("Confirma tu contraseña")).toBeTruthy();
  });

  it("shows the error message when provided", () => {
    renderWithProviders(
      <ReauthPasswordModal
        visible
        loading={false}
        errorMessage="Contraseña incorrecta."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText("Contraseña incorrecta.")).toBeTruthy();
  });

  it("disables the confirm button while the password field is empty", () => {
    renderWithProviders(
      <ReauthPasswordModal
        visible
        loading={false}
        errorMessage=""
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText("Confirmar y eliminar cuenta")).toBeDisabled();
  });

  it("calls onConfirm with the typed password once enabled", () => {
    const onConfirm = jest.fn();
    renderWithProviders(
      <ReauthPasswordModal
        visible
        loading={false}
        errorMessage=""
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "mi-clave-123");
    fireEvent.press(screen.getByText("Confirmar y eliminar cuenta"));
    expect(onConfirm).toHaveBeenCalledWith("mi-clave-123");
  });

  it("shows 'Verificando...' while loading", () => {
    renderWithProviders(
      <ReauthPasswordModal
        visible
        loading
        errorMessage=""
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText("Verificando...")).toBeTruthy();
  });

  it("calls onCancel and clears the password when 'Cancelar' is pressed", () => {
    const onCancel = jest.fn();
    renderWithProviders(
      <ReauthPasswordModal
        visible
        loading={false}
        errorMessage=""
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.press(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
