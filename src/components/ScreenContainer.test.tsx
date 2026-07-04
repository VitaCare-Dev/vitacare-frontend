import { RefreshControl, ScrollView, Text } from "react-native";
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

  it("does not attach a RefreshControl when onRefresh is not provided", () => {
    renderWithProviders(
      <ScreenContainer>
        <Text>Contenido</Text>
      </ScreenContainer>
    );
    const scrollView = screen.UNSAFE_getByType(ScrollView);
    expect(scrollView.props.refreshControl).toBeUndefined();
  });

  it("wires a RefreshControl onto the ScrollView when onRefresh is provided", () => {
    const onRefresh = jest.fn();
    renderWithProviders(
      <ScreenContainer refreshing onRefresh={onRefresh}>
        <Text>Contenido</Text>
      </ScreenContainer>
    );
    const refreshControl = screen.UNSAFE_getByType(RefreshControl);
    expect(refreshControl.props.refreshing).toBe(true);
    expect(refreshControl.props.onRefresh).toBe(onRefresh);
  });
});
