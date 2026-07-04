import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { AppThemeProvider, useTheme, useThemeMode } from "@/theme/ThemeContext";

function Probe() {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();
  return (
    <Pressable onPress={toggleTheme}>
      <Text>{`mode:${mode} bg:${theme.colors.background}`}</Text>
    </Pressable>
  );
}

describe("ThemeContext", () => {
  it("defaults to light mode", async () => {
    render(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>
    );
    await waitFor(() => expect(screen.getByText(/mode:light/)).toBeTruthy());
  });

  it("toggles to dark mode and back when toggleTheme is called", async () => {
    render(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>
    );
    await waitFor(() => expect(screen.getByText(/mode:light/)).toBeTruthy());

    fireEvent.press(screen.getByText(/mode:light/));
    await waitFor(() => expect(screen.getByText(/mode:dark/)).toBeTruthy());

    fireEvent.press(screen.getByText(/mode:dark/));
    await waitFor(() => expect(screen.getByText(/mode:light/)).toBeTruthy());
  });

  it("restores a persisted dark preference from AsyncStorage on mount", async () => {
    await AsyncStorage.setItem("vitacare:theme-mode", "dark");
    render(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>
    );
    await waitFor(() => expect(screen.getByText(/mode:dark/)).toBeTruthy());
  });

  it("restores a persisted light preference from AsyncStorage on mount", async () => {
    await AsyncStorage.setItem("vitacare:theme-mode", "light");
    render(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>
    );
    await waitFor(() => expect(screen.getByText(/mode:light/)).toBeTruthy());
  });

  it("throws when useTheme is used outside of AppThemeProvider", () => {
    function Orphan() {
      useTheme();
      return null;
    }
    // Silencia el log de error esperado de React para este render fallido.
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(
      "useTheme debe usarse dentro de AppThemeProvider"
    );
    consoleError.mockRestore();
  });
});
