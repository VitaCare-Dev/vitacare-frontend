import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

import { AppButton } from "@/components/AppButton";
import { IconImage } from "@/components/IconImage";
import { InlineErrorNotice } from "@/components/InlineErrorNotice";
import { ScreenContainer } from "@/components/ScreenContainer";
import {
    getComunas,
    getEspecialidades,
    getPrestadores,
    getRegiones,
    searchPrestadores,
} from "@/services/prestadoresApi";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { Prestador } from "@/types/prestador";

export default function PrestadoresScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [regiones, setRegiones] = useState<string[]>([]);
  const [comunas, setComunas] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedEspecialidad, setSelectedEspecialidad] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedComuna, setSelectedComuna] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          initialPrestadores,
          especialidadesData,
          regionesData,
          comunasData,
        ] = await Promise.all([
          getPrestadores(),
          getEspecialidades(),
          getRegiones(),
          getComunas(),
        ]);

        if (!isMounted) {
          return;
        }

        setPrestadores(initialPrestadores);
        setEspecialidades(especialidadesData);
        setRegiones(regionesData);
        setComunas(comunasData);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error(error);
        setErrorMessage("No fue posible cargar los prestadores.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setErrorMessage("");
    try {
      const [initialPrestadores, especialidadesData, regionesData, comunasData] =
        await Promise.all([
          getPrestadores(),
          getEspecialidades(),
          getRegiones(),
          getComunas(),
        ]);
      setPrestadores(initialPrestadores);
      setEspecialidades(especialidadesData);
      setRegiones(regionesData);
      setComunas(comunasData);
    } catch (error) {
      console.error(error);
      setErrorMessage("No fue posible cargar los prestadores.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function runSearch() {
      try {
        const results = await searchPrestadores({
          nombre: searchText,
          especialidad: selectedEspecialidad,
          region: selectedRegion,
          comuna: selectedComuna,
        });

        if (isMounted) {
          setPrestadores(results);
        }
      } catch (error) {
        if (isMounted) {
          console.error(error);
          setErrorMessage("No fue posible aplicar los filtros.");
        }
      }
    }

    void runSearch();

    return () => {
      isMounted = false;
    };
  }, [searchText, selectedEspecialidad, selectedRegion, selectedComuna]);

  const filteredComunas = useMemo(() => {
    if (!selectedRegion) {
      return comunas;
    }

    return [
      ...new Set(
        prestadores
          .filter((prestador) => prestador.region === selectedRegion)
          .map((prestador) => prestador.comuna),
      ),
    ];
  }, [comunas, prestadores, selectedRegion]);

  const renderBadge = (estado: Prestador["estadoValidacion"]) => {
    let badgeStyle: StyleProp<ViewStyle> = styles.notFoundBadge;
    let badgeTextStyle: StyleProp<TextStyle> = styles.notFoundBadgeText;

    if (estado === "Validado") {
      badgeStyle = styles.validatedBadge;
      badgeTextStyle = styles.validatedBadgeText;
    } else if (estado === "Pendiente") {
      badgeStyle = styles.pendingBadge;
      badgeTextStyle = styles.pendingBadgeText;
    }

    return (
      <View style={[styles.badge, badgeStyle]}>
        <Text style={[styles.badgeText, badgeTextStyle]}>{estado}</Text>
      </View>
    );
  };

  const renderPrestadorCard = (prestador: Prestador) => (
    <View key={prestador.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <IconImage name="md-del-usuario" size={28} />
          <View style={styles.cardTitleTextWrap}>
            <Text style={styles.cardTitle}>{prestador.nombre}</Text>
            <Text style={styles.cardSubtitle}>{prestador.especialidad}</Text>
          </View>
        </View>
        {renderBadge(prestador.estadoValidacion)}
      </View>

      <Text style={styles.cardDetail}>RUT: {prestador.rut}</Text>
      <Text style={styles.cardDetail}>
        Registro profesional: {prestador.registroProfesional}
      </Text>
      <Text style={styles.cardDetail}>Región: {prestador.region}</Text>
      <Text style={styles.cardDetail}>Comuna: {prestador.comuna}</Text>

      <AppButton
        title="Ver detalle"
        variant="outline"
        icon="registros"
        iconTone="green"
        onPress={() =>
          router.push({
            pathname: "/provider-detail",
            params: { providerId: prestador.id },
          })
        }
      />
    </View>
  );

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Prestadores de salud</Text>
          <Text style={styles.subtitle}>
            Consulta profesionales de salud asociados al cuidado del paciente.
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <IconImage name="nota" size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o especialidad"
            placeholderTextColor={theme.colors.textMuted}
            value={searchText}
            onChangeText={(value) => {
              setSearchText(value);
              setErrorMessage("");
            }}
          />
        </View>

        <FilterSection
          label="Especialidad"
          options={especialidades}
          selectedValue={selectedEspecialidad}
          emptyLabel="Todas"
          onSelect={setSelectedEspecialidad}
        />
        <FilterSection
          label="Región"
          options={regiones}
          selectedValue={selectedRegion}
          emptyLabel="Todas"
          onSelect={(value) => {
            setSelectedRegion(value);
            setSelectedComuna("");
          }}
        />
        <FilterSection
          label="Comuna"
          options={filteredComunas}
          selectedValue={selectedComuna}
          emptyLabel="Todas"
          onSelect={setSelectedComuna}
        />

        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Profesionales disponibles</Text>
          <Text style={styles.helperText}>
            Usa el buscador por nombre o especialidad, y apóyate en los filtros
            para acotar la lista.
          </Text>
          {errorMessage ? (
            <InlineErrorNotice
              message={errorMessage}
              onRetry={handleRefresh}
              retrying={refreshing}
            />
          ) : null}
          {isLoading ? (
            <Text style={styles.helperText}>Cargando prestadores...</Text>
          ) : null}
          {!isLoading && prestadores.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                No se encontraron prestadores
              </Text>
              <Text style={styles.helperText}>
                Prueba cambiando los filtros o el texto de búsqueda.
              </Text>
            </View>
          ) : null}
          {isLoading ? null : prestadores.map(renderPrestadorCard)}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

type FilterSectionProps = {
  label: string;
  options: string[];
  selectedValue: string;
  emptyLabel: string;
  onSelect: (value: string) => void;
};

function FilterSection(props: Readonly<FilterSectionProps>) {
  const { label, options, selectedValue, emptyLabel, onSelect } = props;
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterChipRow}>
          <Pressable
            style={[
              styles.filterChip,
              !selectedValue && styles.filterChipActive,
            ]}
            onPress={() => onSelect("")}
          >
            <Text
              style={[
                styles.filterChipText,
                !selectedValue && styles.filterChipTextActive,
              ]}
            >
              {emptyLabel}
            </Text>
          </Pressable>
          {options.map((option) => (
            <Pressable
              key={`${label}-${option}`}
              style={[
                styles.filterChip,
                selectedValue === option && styles.filterChipActive,
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedValue === option && styles.filterChipTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.secondary,
    fontSize: theme.typography.heading,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    minHeight: 54,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    paddingVertical: theme.spacing.sm,
  },
  filterSection: {
    gap: theme.spacing.sm,
  },
  filterLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  filterChipRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: theme.colors.surface,
  },
  resultsSection: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.secondary,
    fontSize: theme.typography.subheading,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  card: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  cardTitleWrap: {
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  cardTitleTextWrap: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  cardDetail: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  validatedBadge: {
    backgroundColor: theme.colors.success,
  },
  validatedBadgeText: {
    color: theme.colors.primary,
  },
  pendingBadge: {
    backgroundColor: theme.colors.warning,
  },
  pendingBadgeText: {
    color: theme.colors.warningStrong,
  },
  notFoundBadge: {
    backgroundColor: theme.colors.error,
  },
  notFoundBadgeText: {
    color: "#B54444",
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  emptyTitle: {
    color: theme.colors.secondary,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
});
}
