import { StyleSheet, Text, View } from "react-native";

import { IconImage, IconName } from "@/components/IconImage";
import { VitaCareTheme } from "@/theme/theme";

type HealthCardProps = Readonly<{
  label: string;
  value: string;
  unit: string;
  icon: IconName;
  note?: string;
}>;

export function HealthCard({
  label,
  value,
  unit,
  icon,
  note,
}: Readonly<HealthCardProps>) {
  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
      <View style={styles.iconWrap}>
        <IconImage name={icon} size={34} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 130,
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    ...VitaCareTheme.shadow.card,
  },
  textBlock: {
    flex: 1,
    gap: VitaCareTheme.spacing.xs,
    paddingRight: VitaCareTheme.spacing.sm,
  },
  label: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  value: {
    color: VitaCareTheme.colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  unit: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  note: {
    marginTop: VitaCareTheme.spacing.xs,
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  iconWrap: {
    width: 44,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
});
