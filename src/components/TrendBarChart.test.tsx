import { screen } from "@testing-library/react-native";

import { TrendBarChart } from "@/components/TrendBarChart";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("TrendBarChart", () => {
  it("renders nothing when there are no points", () => {
    const { toJSON } = renderWithProviders(<TrendBarChart points={[]} />);
    expect(toJSON()).toBeNull();
  });

  it("renders a value and label for each point", () => {
    renderWithProviders(
      <TrendBarChart
        points={[
          { label: "01/06", value: 90 },
          { label: "02/06", value: 110 },
        ]}
      />
    );
    expect(screen.getByText("90")).toBeTruthy();
    expect(screen.getByText("110")).toBeTruthy();
    expect(screen.getByText("01/06")).toBeTruthy();
    expect(screen.getByText("02/06")).toBeTruthy();
  });

  it("renders correctly with a single point (no auto min/max range needed)", () => {
    renderWithProviders(<TrendBarChart points={[{ label: "01/06", value: 100 }]} />);
    expect(screen.getByText("100")).toBeTruthy();
  });

  it("renders correctly with a fixed external range", () => {
    renderWithProviders(
      <TrendBarChart
        points={[{ label: "01/06", value: 100 }]}
        range={{ min: 20, max: 600 }}
      />
    );
    expect(screen.getByText("100")).toBeTruthy();
  });
});
