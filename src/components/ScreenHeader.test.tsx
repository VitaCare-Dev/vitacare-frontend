import { fireEvent, screen } from "@testing-library/react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

describe("ScreenHeader", () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it("renders nothing when there is no title, back button or right icon", () => {
    const { toJSON } = renderWithProviders(<ScreenHeader />);
    expect(toJSON()).toBeNull();
  });

  it("renders the title when provided", () => {
    renderWithProviders(<ScreenHeader title="Historial" />);
    expect(screen.getByText("Historial")).toBeTruthy();
  });

  it("calls router.back() when the back button is pressed without a custom handler", () => {
    renderWithProviders(<ScreenHeader showBackButton title="Detalle" />);
    fireEvent.press(screen.getByText("←"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("calls the custom onBackPress instead of router.back() when provided", () => {
    const onBackPress = jest.fn();
    renderWithProviders(
      <ScreenHeader showBackButton title="Detalle" onBackPress={onBackPress} />
    );
    fireEvent.press(screen.getByText("←"));
    expect(onBackPress).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("renders and triggers the right icon action", () => {
    const onRightPress = jest.fn();
    renderWithProviders(
      <ScreenHeader title="Tratamiento" rightIcon="agregar" onRightPress={onRightPress} />
    );
    fireEvent.press(screen.getByLabelText("agregar"));
    expect(onRightPress).toHaveBeenCalledTimes(1);
  });
});
