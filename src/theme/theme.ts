const lightColors = {
  primary: "#00987A",
  secondary: "#005F4E",
  background: "#F8FAF8",
  surface: "#FFFFFF",
  surfaceSoft: "#EEF7F4",
  surfaceAlt: "#E5F2EE",
  text: "#18312C",
  textMuted: "#5C706B",
  border: "#D6E5E0",
  success: "#CFEFE5",
  warning: "#FCE8B8",
  warningStrong: "#E7A93D",
  error: "#F8D5D5",
  chip: "#EAF4F1",
};

const darkColors = {
  primary: "#35D6A9",
  secondary: "#7FE6C9",
  background: "#12181A",
  surface: "#1B2225",
  surfaceSoft: "#212A2C",
  surfaceAlt: "#1D2C29",
  text: "#EAF2EF",
  textMuted: "#9AACA7",
  border: "#2C3538",
  success: "#1E4A3F",
  warning: "#4A3C1E",
  warningStrong: "#E7A93D",
  error: "#4A2323",
  chip: "#212C29",
};

const shared = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
  },
  typography: {
    fontFamily: "Poppins",
    title: 30,
    heading: 22,
    subheading: 18,
    body: 16,
    small: 13,
  },
} as const;

const lightShadow = {
  card: {
    shadowColor: "#103B33",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  button: {
    shadowColor: "#005F4E",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
};

const darkShadow = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  button: {
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
};

export const lightTheme = {
  colors: lightColors,
  shadow: lightShadow,
  ...shared,
} as const;

export const darkTheme = {
  colors: darkColors,
  shadow: darkShadow,
  ...shared,
} as const;

export type VitaCareThemeType = typeof lightTheme;

/**
 * Alias al tema claro, mantenido por compatibilidad para cualquier import
 * estático que quede sin migrar a `useTheme()`. El código nuevo/migrado debe
 * usar `useTheme()` de `@/theme/ThemeContext`, no este export.
 */
export const VitaCareTheme = lightTheme;
