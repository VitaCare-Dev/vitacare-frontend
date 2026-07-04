import { Text } from "react-native";
import { screen } from "@testing-library/react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("ScreenContainer", () => {
  it("renders its children when scrollable (default)", () => {
    renderWithProviders(
      <ScreenContainer>
        <Text>Contenido</Text>
      </ScreenContainer>
    );
    expect(screen.getByText("Contenido")).toBeTruthy();
  });

  it("renders its children when not scrollable", () => {
    renderWithProviders(
      <ScreenContainer scrollable={false}>
        <Text>Contenido fijo</Text>
      </ScreenContainer>
    );
    expect(screen.getByText("Contenido fijo")).toBeTruthy();
  });
});
