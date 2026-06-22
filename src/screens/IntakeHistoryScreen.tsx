import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { intakeHistory } from "@/data/mockData";
import { VitaCareTheme } from "@/theme/theme";

export default function IntakeHistoryScreen() {
  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Historial de tomas" />
      <View style={styles.header}>
        <Text style={styles.title}>Historial de tomas</Text>
        <Text style={styles.subtitle}>
          Revisa qué medicamentos se administraron y cuándo.
        </Text>
      </View>

      <View style={styles.list}>
        {intakeHistory.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <IconImage name="capsulas" size={24} />
              </View>
              <View style={styles.rowTopText}>
                <Text style={styles.medication}>{item.medication}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.detail}>Programada: {item.scheduledAt}</Text>
            <Text style={styles.detail}>Real: {item.takenAt}</Text>
            <AppButton
              title="Marcar como tomada"
              variant="outline"
              icon="agregar"
              iconTone="green"
            />
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: VitaCareTheme.spacing.xs,
  },
  title: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 26,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  list: {
    gap: VitaCareTheme.spacing.md,
  },
  card: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.sm,
    ...VitaCareTheme.shadow.card,
  },
  rowTop: {
    flexDirection: "row",
    gap: VitaCareTheme.spacing.md,
    alignItems: "center",
  },
  iconWrap: {
    width: 32,
  },
  rowTopText: {
    flex: 1,
    gap: 2,
  },
  medication: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  status: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  detail: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
