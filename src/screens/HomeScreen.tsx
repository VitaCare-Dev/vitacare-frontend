import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { HealthCard } from "@/components/HealthCard";
import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { summaryMeasurements } from "@/data/mockData";
import { useNextTreatmentMedication } from "@/store/medicalStore";
import { VitaCareTheme } from "@/theme/theme";

export default function HomeScreen() {
  const router = useRouter();
  const nextMedication = useNextTreatmentMedication();

  return (
    <ScreenContainer scrollable>
      <View style={styles.headerRow}>
        <View style={styles.spacer} />
        <Pressable
          onPress={() => router.push("/alerts-recommendations")}
          style={styles.notificationButton}
        >
          <IconImage name="campana" size={28} />
          <View style={styles.notificationBadge} />
        </Pressable>
      </View>

      <View style={styles.greetingBlock}>
        <Text style={styles.greeting}>¡Hola, María Carolina!</Text>
        <Text style={styles.message}>Hoy es un buen día para cuidarte.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen de hoy</Text>
        <View style={styles.grid}>
          {summaryMeasurements.map((item) => (
            <HealthCard
              key={item.label}
              label={item.label}
              value={item.value}
              unit={item.unit}
              icon={item.icon}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próxima toma de medicamento</Text>
        <View style={styles.nextMedicationCard}>
          <View style={styles.nextMedicationHeader}>
            <IconImage name="medicamento" size={24} />
            <Text style={styles.nextMedicationTime}>
              {nextMedication ? "Próximo control" : "Sin pendiente"}
            </Text>
          </View>
          <Text style={styles.nextMedicationTitle}>
            {nextMedication
              ? nextMedication.name
              : "No hay medicamentos activos"}
          </Text>
          <Text style={styles.nextMedicationDetail}>
            {nextMedication
              ? nextMedication.frequency
              : "Agrega un tratamiento para verlo aquí."}
          </Text>
          {nextMedication ? (
            <Text style={styles.nextMedicationDetail}>
              Estado: {nextMedication.takenToday ?? "Pendiente"}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerta IA destacada</Text>
        <View style={styles.alertCard}>
          <View style={styles.alertIconWrap}>
            <IconImage name="campana" size={28} />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>Presión diastólica elevada</Text>
            <Text style={styles.alertText}>
              Se sugiere repetir el control en reposo y mantener hidratación.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acceso rápido al asistente IA</Text>
        <AppButton
          title="Abrir VitaCare IA"
          icon="chatbot"
          onPress={() => router.push("/assistant")}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestadores de salud</Text>
        <AppButton
          title="Consultar prestadores"
          icon="md-del-usuario"
          onPress={() => router.push("/providers")}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: VitaCareTheme.spacing.md,
  },
  spacer: {
    flex: 1,
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: VitaCareTheme.colors.primary,
  },
  greetingBlock: {
    gap: VitaCareTheme.spacing.xs,
  },
  greeting: {
    color: VitaCareTheme.colors.text,
    fontSize: 26,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  message: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  section: {
    gap: VitaCareTheme.spacing.sm,
  },
  sectionTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.subheading,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: VitaCareTheme.spacing.sm,
  },
  nextMedicationCard: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.xs,
    ...VitaCareTheme.shadow.card,
  },
  nextMedicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextMedicationTime: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  nextMedicationTitle: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  nextMedicationDetail: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  alertCard: {
    flexDirection: "row",
    gap: VitaCareTheme.spacing.md,
    padding: VitaCareTheme.spacing.md,
    borderRadius: VitaCareTheme.radius.lg,
    backgroundColor: "#FFF1D9",
    borderWidth: 1,
    borderColor: "#E9C57B",
  },
  alertIconWrap: {
    width: 32,
  },
  alertTextWrap: {
    flex: 1,
    gap: VitaCareTheme.spacing.xs,
  },
  alertTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  alertText: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
