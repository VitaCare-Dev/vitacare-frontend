import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage, IconName } from "@/components/IconImage";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

type HealthCardProps = Readonly<{
  label: string;
  value: string;
  unit: string;
  icon: IconName;
  note?: string;
  onPress?: () => void;
}>;

export function HealthCard({
  label,
  value,
  unit,
  icon,
  note,
  onPress,
}: Readonly<HealthCardProps>) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
      <View style={styles.iconWrap}>
        <IconImage name={icon} size={34} />
      </View>
    </Pressable>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  card: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 130,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    ...theme.shadow.card,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing.xs,
    paddingRight: theme.spacing.sm,
  },
  label: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  value: {
    color: theme.colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  unit: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  note: {
    marginTop: theme.spacing.xs,
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  iconWrap: {
    width: 44,
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
});
}
