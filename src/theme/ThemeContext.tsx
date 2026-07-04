import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance } from "react-native";

import { darkTheme, lightTheme, type VitaCareThemeType } from "@/theme/theme";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "vitacare:theme-mode";

type ThemeContextValue = {
  theme: VitaCareThemeType;
  mode: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [mode, setMode] = useState<ThemeMode>(
    Appearance.getColorScheme() === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") setMode(stored);
    });
  }, []);

  function toggleTheme() {
    setMode((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  const theme = mode === "dark" ? darkTheme : lightTheme;
  const value = useMemo(() => ({ theme, mode, toggleTheme }), [theme, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de AppThemeProvider");
  return ctx;
}

/** Devuelve el objeto de tema activo (colores/spacing/radius/shadow/typography). */
export function useTheme(): VitaCareThemeType {
  return useThemeContext().theme;
}

/** Devuelve el modo activo ("light"/"dark") y la función para alternarlo. */
export function useThemeMode(): { mode: ThemeMode; toggleTheme: () => void } {
  const { mode, toggleTheme } = useThemeContext();
  return { mode, toggleTheme };
}
