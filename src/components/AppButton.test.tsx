import { fireEvent, screen } from "@testing-library/react-native";

import { AppButton } from "@/components/AppButton";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("AppButton", () => {
  it("renders the given title", () => {
    renderWithProviders(<AppButton title="Guardar" />);
    expect(screen.getByText("Guardar")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    renderWithProviders(<AppButton title="Guardar" onPress={onPress} />);
    fireEvent.press(screen.getByText("Guardar"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    renderWithProviders(<AppButton title="Guardar" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText("Guardar"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
