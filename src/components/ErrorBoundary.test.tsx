import { fireEvent, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

function Bomb({ shouldThrow }: Readonly<{ shouldThrow: boolean }>) {
  if (shouldThrow) {
    throw new Error("boom");
  }
  return <Text>Contenido normal</Text>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("renders its children when nothing throws", () => {
    renderWithProviders(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Contenido normal")).toBeTruthy();
  });

  it("shows a fallback UI instead of crashing when a child throws during render", () => {
    renderWithProviders(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Algo salió mal")).toBeTruthy();
    expect(screen.queryByText("Contenido normal")).toBeNull();
  });

  it("lets the user retry, re-rendering the children again", () => {
    renderWithProviders(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Algo salió mal")).toBeTruthy();

    fireEvent.press(screen.getByText("Reintentar"));

    // El hijo vuelve a lanzar el mismo error al reintentar (no cambió la
    // condición): el boundary debe volver a mostrar el fallback, no crashear.
    expect(screen.getByText("Algo salió mal")).toBeTruthy();
  });
});
