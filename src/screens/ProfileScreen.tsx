import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { patient } from "@/data/mockData";
import { VitaCareTheme } from "@/theme/theme";

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scrollable>
      <ScreenHeader />
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <IconImage name="usuario" size={64} />
        </View>
        <Text style={styles.name}>{patient.fullName}</Text>
        <Text style={styles.contact}>{patient.rut}</Text>
      </View>

      <View style={styles.card}>
        <DetailRow label="Fecha de nacimiento" value={patient.birthDate} />
        <DetailRow label="Teléfono principal" value={patient.phonePrimary} />
        <DetailRow label="Teléfono secundario" value={patient.phoneSecondary} />
        <DetailRow label="Dirección" value={patient.address} />
        <View style={styles.diseaseBlock}>
          <Text style={styles.blockTitle}>Enfermedades asociadas</Text>
          {patient.diseases.map((item) => (
            <Text key={item} style={styles.diseaseItem}>
              • {item}
            </Text>
          ))}
        </View>
      </View>

      <AppButton
        title="Ver información médica completa"
        icon="md-del-usuario"
        onPress={() => router.push("/medical-info")}
      />

      <AppButton
        title="Consultar prestadores"
        icon="md-del-usuario"
        variant="outline"
        iconTone="green"
        onPress={() => router.push("/providers")}
      />
    </ScreenContainer>
  );
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    backgroundColor: VitaCareTheme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...VitaCareTheme.shadow.card,
  },
  name: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 24,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  contact: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  card: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.md,
    ...VitaCareTheme.shadow.card,
  },
  detailRow: {
    gap: VitaCareTheme.spacing.xs,
  },
  detailLabel: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  detailValue: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  diseaseBlock: {
    gap: VitaCareTheme.spacing.xs,
    paddingTop: VitaCareTheme.spacing.sm,
  },
  blockTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  diseaseItem: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
