import { ScrollView, StyleSheet, Text, View } from "react-native";

import { VitaCareTheme } from "@/theme/theme";

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
  if (points.length === 0) return null;

  const values = points.map((point) => point.value);
  const maxValue = range?.max ?? Math.max(...values);
  const minValue = range?.min ?? Math.min(...values);
  const span = maxValue - minValue || 1;
  const barColor = color ?? VitaCareTheme.colors.primary;

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

const styles = StyleSheet.create({
  track: {
    alignItems: "flex-end",
    gap: VitaCareTheme.spacing.sm,
    paddingHorizontal: VitaCareTheme.spacing.xs,
  },
  column: {
    alignItems: "center",
    width: 36,
    gap: VitaCareTheme.spacing.xs,
  },
  valueLabel: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 11,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  barTrack: {
    height: CHART_HEIGHT,
    width: 18,
    justifyContent: "flex-end",
    backgroundColor: VitaCareTheme.colors.background,
    borderRadius: VitaCareTheme.radius.sm,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: VitaCareTheme.radius.sm,
    borderTopRightRadius: VitaCareTheme.radius.sm,
  },
  dateLabel: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: 10,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
