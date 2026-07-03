import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPut } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import { VitaCareTheme } from "@/theme/theme";

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

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Alertas" />
      <View style={styles.header}>
        <Text style={styles.title}>Alertas IA</Text>
        <Text style={styles.subtitle}>
          Seguimiento automático de eventos relevantes.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={VitaCareTheme.colors.primary} style={styles.loader} />
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertas IA</Text>
            <View style={styles.list}>
              {alerts.length === 0 ? (
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
                        <Text style={styles.cardTitle}>{item.motivoAlerta}</Text>
                        <Text style={styles.date}>{formatDate(item.fechaDisparo)}</Text>
                      </View>
                      <Text style={styles.detail}>{item.recomendacionIa}</Text>
                      <Text style={styles.status}>{item.leida ? "Leída" : "No leída"}</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recomendaciones alimentarias</Text>
            <View style={styles.list}>
              {recommendations.length === 0 ? (
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
  loader: {
    marginTop: VitaCareTheme.spacing.xl,
  },
  section: {
    gap: VitaCareTheme.spacing.sm,
  },
  sectionTitle: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.subheading,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  list: {
    gap: VitaCareTheme.spacing.md,
  },
  emptyText: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  card: {
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    padding: VitaCareTheme.spacing.md,
    flexDirection: "row",
    gap: VitaCareTheme.spacing.md,
  },
  alertCard: {
    backgroundColor: "#FFF2D8",
    borderColor: "#F1C57D",
  },
  recommendationCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: VitaCareTheme.spacing.sm,
  },
  cardTitle: {
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
