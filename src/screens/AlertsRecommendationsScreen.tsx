import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPut } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

/** Espejo de AlertaDto del BFF. */
type AlertRecord = {
  idAlertaIa: number;
  fechaDisparo: string;
  motivoAlerta: string;
  recomendacionIa: string;
  leida: boolean;
};

/** Espejo de RecomendacionDto del BFF. */
type RecommendationRecord = {
  idRecomendacion: number;
  titulo: string;
  contenido: string;
  fechaGeneracion: string;
  leida: boolean;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es-CL");
}

export default function AlertsRecommendationsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const authState = useAuth();
  const enabled = authState.status === "authenticated";
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: queryKeys.alertsAll,
    queryFn: () => apiGet<AlertRecord[]>("/api/alerts"),
    enabled,
  });
  const recommendationsQuery = useQuery({
    queryKey: queryKeys.recommendationsAll,
    queryFn: () => apiGet<RecommendationRecord[]>("/api/recommendations"),
    enabled,
  });

  function invalidateAlerts() {
    queryClient.invalidateQueries({ queryKey: queryKeys.alertsAll });
    queryClient.invalidateQueries({ queryKey: queryKeys.alertsUnread });
  }

  const markAlertReadMutation = useMutation({
    mutationFn: (id: number) => apiPut(`/api/alerts/${id}/read`),
    onSuccess: invalidateAlerts,
  });
  const markRecommendationReadMutation = useMutation({
    mutationFn: (id: number) => apiPut(`/api/recommendations/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.recommendationsAll }),
  });

  const alerts = alertsQuery.data ?? [];
  const recommendations = recommendationsQuery.data ?? [];
  const loading = alertsQuery.isLoading || recommendationsQuery.isLoading;
  const refreshing = alertsQuery.isRefetching || recommendationsQuery.isRefetching;

  function handleRefresh() {
    alertsQuery.refetch();
    recommendationsQuery.refetch();
  }

  // El detalle técnico (404/500/etc.) solo queda en consola: al usuario se le
  // muestra un mensaje genérico, nunca el error crudo del backend.
  useEffect(() => {
    if (alertsQuery.error) console.error("Error al cargar alertas:", alertsQuery.error);
  }, [alertsQuery.error]);
  useEffect(() => {
    if (recommendationsQuery.error) {
      console.error("Error al cargar recomendaciones:", recommendationsQuery.error);
    }
  }, [recommendationsQuery.error]);

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={handleRefresh}>
      <ScreenHeader showBackButton title="Alertas" />
      <View style={styles.header}>
        <Text style={styles.title}>Alertas IA</Text>
        <Text style={styles.subtitle}>
          Seguimiento automático de eventos relevantes.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertas IA</Text>
            <View style={styles.list}>
              {alertsQuery.isError ? (
                <Text style={styles.errorText}>
                  No se pudieron cargar las alertas. Intenta de nuevo más tarde.
                </Text>
              ) : alerts.length === 0 ? (
                <Text style={styles.emptyText}>No tienes alertas registradas.</Text>
              ) : (
                alerts.map((item) => (
                  <Pressable
                    key={item.idAlertaIa}
                    style={[styles.card, styles.alertCard]}
                    onPress={() => !item.leida && markAlertReadMutation.mutate(item.idAlertaIa)}
                  >
                    <View style={styles.iconWrap}>
                      <IconImage name="campana" size={24} />
                    </View>
                    <View style={styles.content}>
                      <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, styles.alertCardText]}>
                          {item.motivoAlerta}
                        </Text>
                        <Text style={[styles.date, styles.alertCardMutedText]}>
                          {formatDate(item.fechaDisparo)}
                        </Text>
                      </View>
                      <Text style={[styles.detail, styles.alertCardText]}>
                        {item.recomendacionIa}
                      </Text>
                      <Text style={[styles.status, styles.alertCardMutedText]}>
                        {item.leida ? "Leída" : "No leída"}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recomendaciones alimentarias</Text>
            <View style={styles.list}>
              {recommendationsQuery.isError ? (
                <Text style={styles.errorText}>
                  No se pudieron cargar las recomendaciones. Intenta de nuevo más tarde.
                </Text>
              ) : recommendations.length === 0 ? (
                <Text style={styles.emptyText}>Aún no tienes recomendaciones generadas.</Text>
              ) : (
                recommendations.map((item) => (
                  <Pressable
                    key={item.idRecomendacion}
                    style={[styles.card, styles.recommendationCard]}
                    onPress={() =>
                      !item.leida && markRecommendationReadMutation.mutate(item.idRecomendacion)
                    }
                  >
                    <View style={styles.iconWrap}>
                      <IconImage name="plan" size={24} />
                    </View>
                    <View style={styles.content}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.titulo}</Text>
                        <Text style={styles.date}>{formatDate(item.fechaGeneracion)}</Text>
                      </View>
                      <Text style={styles.detail}>{item.contenido}</Text>
                      <Text style={styles.status}>{item.leida ? "Leída" : "No leída"}</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.secondary,
    fontSize: 26,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.primary,
    fontSize: theme.typography.subheading,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  list: {
    gap: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  errorText: {
    color: "#B54444",
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  alertCard: {
    backgroundColor: "#FFF2D8",
    borderColor: "#F1C57D",
  },
  // Colores fijos (no siguen el tema): el fondo de esta card es siempre
  // claro (ámbar), así que el texto debe quedarse oscuro también en modo oscuro.
  alertCardText: {
    color: "#3A2E14",
  },
  alertCardMutedText: {
    color: "#6B5A38",
  },
  recommendationCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: "#C8E7DD",
  },
  iconWrap: {
    width: 28,
    paddingTop: 2,
  },
  content: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  cardTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  date: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
  },
  detail: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  status: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
});
}
