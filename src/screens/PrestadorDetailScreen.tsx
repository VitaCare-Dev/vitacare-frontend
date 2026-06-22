import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getPrestadorById } from "@/services/prestadoresApi";
import { VitaCareTheme } from "@/theme/theme";
import type { Prestador } from "@/types/prestador";

export default function PrestadorDetailScreen() {
  const router = useRouter();
  const { providerId } = useLocalSearchParams<{ providerId?: string }>();
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPrestador() {
      if (!providerId) {
        setPrestador(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const data = await getPrestadorById(providerId);
      if (!isMounted) {
        return;
      }

      setPrestador(data);
      setIsLoading(false);
    }

    void loadPrestador();

    return () => {
      isMounted = false;
    };
  }, [providerId]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader showBackButton title="Prestador" />
        <View style={styles.centeredState}>
          <Text style={styles.centeredText}>Cargando prestador...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!prestador) {
    return (
      <ScreenContainer>
        <ScreenHeader showBackButton title="Prestador" />
        <View style={styles.centeredState}>
          <Text style={styles.centeredText}>Prestador no encontrado.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ScreenHeader showBackButton title="Detalle del prestador" />

        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <IconImage name="md-del-usuario" size={44} />
            <View style={styles.headerTextWrap}>
              <Text style={styles.name}>{prestador.nombre}</Text>
              <Text style={styles.specialty}>{prestador.especialidad}</Text>
            </View>
          </View>
          <StatusBadge estado={prestador.estadoValidacion} />
        </View>

        <DetailCard title="Datos del prestador">
          <DetailRow label="RUT" value={prestador.rut} />
          <DetailRow
            label="Registro profesional"
            value={prestador.registroProfesional}
          />
          <DetailRow label="Institución" value={prestador.institucion} />
          <DetailRow label="Teléfono" value={prestador.telefono} />
          <DetailRow label="Email" value={prestador.email} />
        </DetailCard>

        <DetailCard title="Ubicación">
          <DetailRow label="Dirección" value={prestador.direccion} />
          <DetailRow label="Región" value={prestador.region} />
          <DetailRow label="Comuna" value={prestador.comuna} />
          <DetailRow
            label="Fecha de actualización"
            value={prestador.fechaActualizacion}
          />
        </DetailCard>

        <View style={styles.noticeCard}>
          <IconImage name="nota" size={20} />
          <Text style={styles.noticeText}>
            Información simulada para fines académicos. En una versión real,
            estos datos serían consultados desde la API de Prestadores de la
            Superintendencia de Salud.
          </Text>
        </View>

        <AppButton
          title="Volver"
          variant="outline"
          icon="home"
          iconTone="green"
          onPress={() => router.back()}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function DetailCard(
  props: Readonly<{ title: string; children: React.ReactNode }>,
) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{props.title}</Text>
      {props.children}
    </View>
  );
}

function DetailRow(props: Readonly<{ label: string; value: string }>) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{props.label}</Text>
      <Text style={styles.detailValue}>{props.value}</Text>
    </View>
  );
}

function StatusBadge(
  props: Readonly<{ estado: Prestador["estadoValidacion"] }>,
) {
  const { estado } = props;
  const badgeStyle =
    estado === "Validado"
      ? styles.validatedBadge
      : estado === "Pendiente"
        ? styles.pendingBadge
        : styles.notFoundBadge;
  const badgeTextStyle =
    estado === "Validado"
      ? styles.validatedBadgeText
      : estado === "Pendiente"
        ? styles.pendingBadgeText
        : styles.notFoundBadgeText;

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.badgeText, badgeTextStyle]}>{estado}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: VitaCareTheme.spacing.lg,
    paddingBottom: VitaCareTheme.spacing.xxxl,
  },
  centeredState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredText: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  headerCard: {
    gap: VitaCareTheme.spacing.md,
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.lg,
    ...VitaCareTheme.shadow.card,
  },
  headerRow: {
    flexDirection: "row",
    gap: VitaCareTheme.spacing.md,
    alignItems: "center",
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.subheading,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  specialty: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  card: {
    gap: VitaCareTheme.spacing.sm,
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.lg,
    ...VitaCareTheme.shadow.card,
  },
  cardTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  detailRow: {
    gap: VitaCareTheme.spacing.xs,
    paddingTop: VitaCareTheme.spacing.xs,
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
  noticeCard: {
    flexDirection: "row",
    gap: VitaCareTheme.spacing.sm,
    backgroundColor: VitaCareTheme.colors.surfaceSoft,
    borderRadius: VitaCareTheme.radius.md,
    padding: VitaCareTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: VitaCareTheme.colors.primary,
  },
  noticeText: {
    flex: 1,
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    lineHeight: 20,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: VitaCareTheme.spacing.sm,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  validatedBadge: {
    backgroundColor: VitaCareTheme.colors.success,
  },
  validatedBadgeText: {
    color: VitaCareTheme.colors.primary,
  },
  pendingBadge: {
    backgroundColor: VitaCareTheme.colors.warning,
  },
  pendingBadgeText: {
    color: VitaCareTheme.colors.warningStrong,
  },
  notFoundBadge: {
    backgroundColor: VitaCareTheme.colors.error,
  },
  notFoundBadgeText: {
    color: "#B54444",
  },
});
