import { useEffect, useRef } from "react";
import { Animated, Easing, View, type DimensionValue, type ViewStyle } from "react-native";

import { useTheme } from "@/theme/ThemeContext";

type SkeletonProps = Readonly<{
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}>;

/**
 * Placeholder animado ("shimmer") que imita la forma del contenido real
 * mientras carga, en vez de un spinner genérico centrado en la pantalla:
 * reduce el salto de layout cuando llegan los datos y se percibe como más
 * rápido aunque tarde lo mismo.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      testID="skeleton"
      style={[
        { width, height, borderRadius, backgroundColor: theme.colors.border, opacity },
        style,
      ]}
    />
  );
}

/**
 * Skeleton genérico para pantallas de formulario/detalle: un título y N
 * filas simulando pares de etiqueta + campo, mientras se carga el dato
 * inicial de la pantalla completa (antes de mostrar el formulario real).
 */
export function FormSkeleton({ rows = 4 }: Readonly<{ rows?: number }>) {
  return (
    <View testID="form-skeleton" style={{ gap: 20, marginTop: 8 }}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={{ gap: 8 }}>
          <Skeleton width="35%" height={13} />
          <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
      ))}
    </View>
  );
}
