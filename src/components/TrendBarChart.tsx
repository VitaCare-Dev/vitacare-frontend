import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

export type TrendPoint = {
  label: string;
  value: number;
};

type TrendBarChartProps = Readonly<{
  points: TrendPoint[];
  color?: string;
  /**
   * Rango fijo (ej. el rango fisiológico plausible del indicador) contra el
   * que se escalan las barras. Sin esto, el gráfico escala según el propio
   * mínimo/máximo de los puntos visibles, lo que exagera visualmente
   * diferencias pequeñas cuando todos los valores están cerca entre sí.
   */
  range?: { min: number; max: number };
}>;

const CHART_HEIGHT = 120;
const MIN_BAR_RATIO = 0.15;

/** Gráfico de barras simple (sin dependencias nativas) para visualizar una serie de valores en el tiempo. */
export function TrendBarChart({ points, color, range }: TrendBarChartProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  if (points.length === 0) return null;

  const values = points.map((point) => point.value);
  const maxValue = range?.max ?? Math.max(...values);
  const minValue = range?.min ?? Math.min(...values);
  const span = maxValue - minValue || 1;
  const barColor = color ?? theme.colors.primary;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      {points.map((point, index) => {
        const normalized = Math.min(1, Math.max(0, (point.value - minValue) / span));
        const ratio = MIN_BAR_RATIO + (1 - MIN_BAR_RATIO) * normalized;
        return (
          <View key={index} style={styles.column}>
            <Text style={styles.valueLabel}>{point.value}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: `${ratio * 100}%`, backgroundColor: barColor },
                ]}
              />
            </View>
            <Text style={styles.dateLabel}>{point.label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  track: {
    alignItems: "flex-end",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  column: {
    alignItems: "center",
    width: 36,
    gap: theme.spacing.xs,
  },
  valueLabel: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  barTrack: {
    height: CHART_HEIGHT,
    width: 18,
    justifyContent: "flex-end",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: theme.radius.sm,
    borderTopRightRadius: theme.radius.sm,
  },
  dateLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily,
  },
});
}
