import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { VitaCareTheme } from "@/theme/theme";

export default function VitalSignsScreen() {
  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Signos vitales" />
      <View style={styles.header}>
        <Text style={styles.title}>Signos vitales</Text>
        <Text style={styles.subtitle}>
          Ingresa los valores medidos en el control.
        </Text>
      </View>

      <View style={styles.card}>
        <AppInput
          label="Presión sistólica"
          placeholder="120"
          keyboardType="numeric"
          icon="presion"
        />
        <AppInput
          label="Presión diastólica"
          placeholder="80"
          keyboardType="numeric"
          icon="presion"
        />
        <AppInput
          label="Temperatura"
          placeholder="36.6"
          keyboardType="decimal-pad"
          icon="corazon"
        />
        <AppInput
          label="Peso"
          placeholder="65.2"
          keyboardType="decimal-pad"
          icon="peso"
        />
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
});
