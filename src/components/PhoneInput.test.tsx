import { fireEvent, screen } from "@testing-library/react-native";

import { PhoneInput } from "@/components/PhoneInput";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

/**
 * Simula la escritura real, dígito por dígito, en el input controlado: cada
 * dígito nuevo dispara onChangeText con el texto acumulado hasta ese punto,
 * luego el componente se vuelve a renderizar con el `value` ya actualizado
 * por el padre (como pasaría con react-hook-form). Se usa `renderWithProviders`
 * de nuevo (en vez de `rerender`) para no tener que replicar a mano el mismo
 * árbol de providers — es más código, pero evita un desmontaje/remontaje
 * espurio si el wrapper no calza exactamente byte a byte.
 */
function typeDigits(
  digits: string,
  onChangeText: (next: string) => void,
  getValue: () => string
) {
  let typedSoFar = "";
  for (const digit of digits) {
    typedSoFar += digit;
    fireEvent.changeText(screen.getByPlaceholderText("8765 4321"), typedSoFar);
    renderWithProviders(
      <PhoneInput label="Teléfono" value={getValue()} onChangeText={onChangeText} />
    );
  }
}

describe("PhoneInput", () => {
  it("renders the fixed +56 9 prefix", () => {
    renderWithProviders(<PhoneInput label="Teléfono" value="" onChangeText={jest.fn()} />);
    expect(screen.getByText("+56 9")).toBeTruthy();
  });

  it("displays only the 8 mobile digits, grouped, in the editable field", () => {
    renderWithProviders(
      <PhoneInput label="Teléfono" value="+56 9 8765 4321" onChangeText={jest.fn()} />
    );
    expect(screen.getByDisplayValue("8765 4321")).toBeTruthy();
  });

  it("calls onChangeText with the full formatted value when the user types", () => {
    const onChangeText = jest.fn();
    renderWithProviders(<PhoneInput label="Teléfono" value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByPlaceholderText("8765 4321"), "87654321");
    expect(onChangeText).toHaveBeenCalledWith("+56 9 8765 4321");
  });

  it("keeps a subscriber number that starts with 56 as the user types it, key by key", () => {
    // Regresión: al tipear un número real como 5693 3245, los primeros
    // caracteres "5" y "6" no deben interpretarse como si fueran el prefijo
    // de país (+56) y borrarse — ese prefijo es un texto fijo aparte, nunca
    // parte de lo que el usuario edita.
    let value = "";
    const onChangeText = jest.fn((next: string) => {
      value = next;
    });
    renderWithProviders(<PhoneInput label="Teléfono" value={value} onChangeText={onChangeText} />);

    typeDigits("56933245", onChangeText, () => value);

    expect(value).toBe("+56 9 5693 3245");
    expect(screen.getByDisplayValue("5693 3245")).toBeTruthy();
  });

  it("keeps a subscriber number that starts with 9 as the user types it, key by key", () => {
    let value = "";
    const onChangeText = jest.fn((next: string) => {
      value = next;
    });
    renderWithProviders(<PhoneInput label="Teléfono" value={value} onChangeText={onChangeText} />);

    typeDigits("98437654", onChangeText, () => value);

    expect(value).toBe("+56 9 9843 7654");
    expect(screen.getByDisplayValue("9843 7654")).toBeTruthy();
  });

  it("shows the error message when provided", () => {
    renderWithProviders(
      <PhoneInput
        label="Teléfono"
        value=""
        onChangeText={jest.fn()}
        errorMessage="Ingresa los 8 dígitos del celular."
      />
    );
    expect(screen.getByText("Ingresa los 8 dígitos del celular.")).toBeTruthy();
  });
});
