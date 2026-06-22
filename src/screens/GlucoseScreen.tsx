import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { glucosePeriods } from "@/data/mockData";
import { VitaCareTheme } from "@/theme/theme";

export default function GlucoseScreen() {
  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Glucosa" />
      <View style={styles.header}>
        <Text style={styles.title}>Glucosa</Text>
        <Text style={styles.subtitle}>
          Registra la glicemia y el período correspondiente.
        </Text>
      </View>

      <View style={styles.card}>
        <AppInput
          label="Valor glucosa"
          placeholder="98"
          keyboardType="numeric"
          icon="glucosa"
        />

        <View style={styles.periodSection}>
          {glucosePeriods.map((item, index) => (
            <Pressable
              key={item.period}
              style={[styles.periodCard, index === 0 && styles.periodActive]}
            >
              <View style={styles.periodHeader}>
                <IconImage
                  name={index === 1 ? "insulina" : "glucosa"}
                  size={22}
                />
                <Text style={styles.periodTitle}>{item.period}</Text>
              </View>
              <Text style={styles.periodDescription}>{item.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <AppButton title="Guardar" onPress={() => {}} />
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
  card: {
    gap: VitaCareTheme.spacing.md,
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    ...VitaCareTheme.shadow.card,
  },
  periodSection: {
    gap: VitaCareTheme.spacing.sm,
  },
  periodCard: {
    borderRadius: VitaCareTheme.radius.md,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    backgroundColor: VitaCareTheme.colors.background,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.xs,
  },
  periodActive: {
    backgroundColor: VitaCareTheme.colors.surfaceAlt,
    borderColor: VitaCareTheme.colors.primary,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
  },
  periodTitle: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  periodDescription: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
