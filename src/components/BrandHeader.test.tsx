import { fireEvent, screen } from "@testing-library/react-native";

import { BrandHeader } from "@/components/BrandHeader";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("BrandHeader", () => {
  it("renders without a right icon by default", () => {
    renderWithProviders(<BrandHeader />);
    expect(screen.queryByLabelText("chatbot")).toBeNull();
  });

  it("renders the right icon when provided", () => {
    renderWithProviders(<BrandHeader rightIcon="chatbot" />);
    expect(screen.getByLabelText("chatbot")).toBeTruthy();
  });

  it("calls onRightPress when the right icon is tapped", () => {
    const onRightPress = jest.fn();
    renderWithProviders(<BrandHeader rightIcon="chatbot" onRightPress={onRightPress} />);
    fireEvent.press(screen.getByLabelText("chatbot"));
    expect(onRightPress).toHaveBeenCalledTimes(1);
  });

  it("renders with the vertical logo style without crashing", () => {
    renderWithProviders(<BrandHeader logoStyle="vertical" />);
  });
});
