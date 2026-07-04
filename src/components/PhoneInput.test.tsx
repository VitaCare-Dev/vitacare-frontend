import { fireEvent, screen } from "@testing-library/react-native";

import { PhoneInput } from "@/components/PhoneInput";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("PhoneInput", () => {
  it("renders the fixed +56 9 prefix", () => {
    renderWithProviders(<PhoneInput label="Teléfono" value="" onChangeText={jest.fn()} />);
    expect(screen.getByText("+56 9")).toBeTruthy();
  });

  it("displays only the 8 mobile digits, grouped, in the editable field", () => {
    renderWithProviders(
      <PhoneInput label="Teléfono" value="+56 9 8765 4321" onChangeText={jest.fn()} />
    );
    expect(screen.getByDisplayValue("8765 4321")).toBeTruthy();
  });

  it("calls onChangeText with the full formatted value when the user types", () => {
    const onChangeText = jest.fn();
    renderWithProviders(<PhoneInput label="Teléfono" value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByPlaceholderText("8765 4321"), "87654321");
    expect(onChangeText).toHaveBeenCalledWith("+56 9 8765 4321");
  });

  it("shows the error message when provided", () => {
    renderWithProviders(
      <PhoneInput
        label="Teléfono"
        value=""
        onChangeText={jest.fn()}
        errorMessage="Ingresa los 8 dígitos del celular."
      />
    );
    expect(screen.getByText("Ingresa los 8 dígitos del celular.")).toBeTruthy();
  });
});
