import { screen } from "@testing-library/react-native";

import { AppPickerField } from "@/components/AppPickerField";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const options = [
  { label: "Región Metropolitana", value: "13" },
  { label: "Valparaíso", value: "5" },
];

describe("AppPickerField", () => {
  it("renders the label", () => {
    renderWithProviders(
      <AppPickerField
        label="Región"
        placeholder="Selecciona una región"
        value=""
        onValueChange={jest.fn()}
        options={options}
      />
    );
    expect(screen.getByText("Región")).toBeTruthy();
  });

  it("shows the error message when provided", () => {
    renderWithProviders(
      <AppPickerField
        label="Región"
        placeholder="Selecciona una región"
        value=""
        onValueChange={jest.fn()}
        options={options}
        errorMessage="Selecciona una región"
      />
    );
    expect(screen.getAllByText("Selecciona una región").length).toBeGreaterThan(0);
  });

  it("does not render an error text node when no error is given", () => {
    renderWithProviders(
      <AppPickerField
        label="Región"
        placeholder="Selecciona una región"
        value=""
        onValueChange={jest.fn()}
        options={options}
      />
    );
    // Sin errorMessage, el único texto propio del componente es el label.
    expect(screen.getByText("Región")).toBeTruthy();
    expect(screen.queryAllByText("Selecciona una región")).toHaveLength(0);
  });
});
