import { StyleSheet, Text, View } from "react-native";

import { IconImage, IconName } from "@/components/IconImage";
import { VitaCareTheme } from "@/theme/theme";
import type { AlertItem } from "@/types";

type AlertCardProps = Readonly<{
  item: AlertItem;
}>;

export function AlertCard({ item }: AlertCardProps) {
  const isRecommendation = item.type === "recommendation";
  const icon: IconName = isRecommendation ? "plan" : "campana";

  return (
    <View
      style={[
        styles.card,
        isRecommendation ? styles.recommendation : styles.alert,
      ]}
    >
      <View style={styles.iconWrap}>
        <IconImage name={icon} size={24} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <Text style={styles.detail}>{item.detail}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    padding: VitaCareTheme.spacing.md,
    flexDirection: "row",
    gap: VitaCareTheme.spacing.md,
  },
  alert: {
    backgroundColor: "#FFF2D8",
    borderColor: "#F1C57D",
  },
  recommendation: {
    backgroundColor: VitaCareTheme.colors.surfaceAlt,
    borderColor: "#C8E7DD",
  },
  iconWrap: {
    width: 28,
    paddingTop: 2,
  },
  content: {
    flex: 1,
    gap: VitaCareTheme.spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: VitaCareTheme.spacing.sm,
  },
  title: {
    flex: 1,
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  date: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: 12,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  detail: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  status: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 12,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
});
