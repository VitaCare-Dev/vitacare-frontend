export const VitaCareTheme = {
  colors: {
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
  },
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
  shadow: {
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

export type VitaCareThemeType = typeof VitaCareTheme;
