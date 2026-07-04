import { render, screen } from "@testing-library/react-native";

import { IconImage } from "@/components/IconImage";

describe("IconImage", () => {
  it("uses the icon name as the default accessibility label", () => {
    render(<IconImage name="glucosa" />);
    expect(screen.getByLabelText("glucosa")).toBeTruthy();
  });

  it("uses a custom accessibility label when provided", () => {
    render(<IconImage name="glucosa" accessibilityLabel="Ícono de glucosa" />);
    expect(screen.getByLabelText("Ícono de glucosa")).toBeTruthy();
  });

  it("renders the white tone variant without crashing", () => {
    render(<IconImage name="usuario" tone="white" />);
    expect(screen.getByLabelText("usuario")).toBeTruthy();
  });

  it("renders the green tone variant (default) without crashing", () => {
    render(<IconImage name="usuario" tone="green" />);
    expect(screen.getByLabelText("usuario")).toBeTruthy();
  });
});
