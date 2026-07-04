import { fireEvent, screen } from "@testing-library/react-native";

import { PasswordVisibilityToggle } from "@/components/PasswordVisibilityToggle";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("PasswordVisibilityToggle", () => {
  it("shows the 'ojo' icon when not visible", () => {
    renderWithProviders(<PasswordVisibilityToggle visible={false} onToggle={jest.fn()} />);
    expect(screen.getByLabelText("ojo")).toBeTruthy();
  });

  it("shows the 'cerrar-ojo' icon when visible", () => {
    renderWithProviders(<PasswordVisibilityToggle visible={true} onToggle={jest.fn()} />);
    expect(screen.getByLabelText("cerrar-ojo")).toBeTruthy();
  });

  it("calls onToggle when pressed", () => {
    const onToggle = jest.fn();
    renderWithProviders(<PasswordVisibilityToggle visible={false} onToggle={onToggle} />);
    fireEvent.press(screen.getByLabelText("ojo"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
