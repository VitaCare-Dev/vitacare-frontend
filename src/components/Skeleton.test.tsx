import { screen } from "@testing-library/react-native";

import { Skeleton } from "@/components/Skeleton";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("Skeleton", () => {
  it("renders a placeholder view", () => {
    renderWithProviders(<Skeleton />);
    expect(screen.getByTestId("skeleton")).toBeTruthy();
  });

  it("applies the given width, height and borderRadius", () => {
    renderWithProviders(<Skeleton width={120} height={40} borderRadius={20} />);
    const style = screen.getByTestId("skeleton").props.style;
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.flat(Infinity)) : style;
    expect(flatStyle.width).toBe(120);
    expect(flatStyle.height).toBe(40);
    expect(flatStyle.borderRadius).toBe(20);
  });
});
