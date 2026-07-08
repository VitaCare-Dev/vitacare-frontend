import { fireEvent, screen } from "@testing-library/react-native";

import { InlineErrorNotice } from "@/components/InlineErrorNotice";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("InlineErrorNotice", () => {
  it("renders the given message", () => {
    renderWithProviders(<InlineErrorNotice message="No se pudieron cargar las alertas." />);
    expect(screen.getByText("No se pudieron cargar las alertas.")).toBeTruthy();
  });

  it("does not render a retry button when onRetry is not provided", () => {
    renderWithProviders(<InlineErrorNotice message="Error" />);
    expect(screen.queryByText("Reintentar")).toBeNull();
  });

  it("calls onRetry when the retry button is pressed", () => {
    const onRetry = jest.fn();
    renderWithProviders(<InlineErrorNotice message="Error" onRetry={onRetry} />);
    fireEvent.press(screen.getByText("Reintentar"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows a retrying label and disables the button while retrying", () => {
    const onRetry = jest.fn();
    renderWithProviders(<InlineErrorNotice message="Error" onRetry={onRetry} retrying />);
    expect(screen.getByText("Reintentando...")).toBeTruthy();
    fireEvent.press(screen.getByText("Reintentando..."));
    expect(onRetry).not.toHaveBeenCalled();
  });
});
