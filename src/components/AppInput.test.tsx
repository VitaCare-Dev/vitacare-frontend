import { fireEvent, screen } from "@testing-library/react-native";

import { AppInput } from "@/components/AppInput";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("AppInput", () => {
  it("renders the label and current value", () => {
    renderWithProviders(<AppInput label="Correo" value="a@b.cl" onChangeText={jest.fn()} />);
    expect(screen.getByText("Correo")).toBeTruthy();
    expect(screen.getByDisplayValue("a@b.cl")).toBeTruthy();
  });

  it("calls onChangeText when the user types", () => {
    const onChangeText = jest.fn();
    renderWithProviders(<AppInput label="Correo" value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByDisplayValue(""), "hola@vitacare.cl");
    expect(onChangeText).toHaveBeenCalledWith("hola@vitacare.cl");
  });

  it("shows the error message when provided", () => {
    renderWithProviders(
      <AppInput label="Correo" value="" onChangeText={jest.fn()} errorMessage="Campo obligatorio" />
    );
    expect(screen.getByText("Campo obligatorio")).toBeTruthy();
  });

  it("does not show an error message by default", () => {
    renderWithProviders(<AppInput label="Correo" value="" onChangeText={jest.fn()} />);
    expect(screen.queryByText("Campo obligatorio")).toBeNull();
  });

  it("renders an icon when provided", () => {
    renderWithProviders(<AppInput label="Correo" value="" onChangeText={jest.fn()} icon="usuario" />);
    expect(screen.getByLabelText("usuario")).toBeTruthy();
  });
});
