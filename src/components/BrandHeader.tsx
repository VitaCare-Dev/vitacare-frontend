import { Image, Pressable, StyleSheet, View } from "react-native";

import { IconImage, type IconName } from "@/components/IconImage";
import { VitaCareTheme } from "@/theme/theme";

type BrandHeaderProps = Readonly<{
  logoStyle?: "horizontal" | "vertical";
  rightIcon?: IconName;
  onRightPress?: () => void;
}>;

export function BrandHeader({
  logoStyle = "horizontal",
  rightIcon,
  onRightPress,
}: BrandHeaderProps) {
  const logoSource =
    logoStyle === "vertical"
      ? require("../../assets/images/logos/logo_principal_verde.png")
      : require("../../assets/images/logos/logo_horizontal_verde.png");

  const logoSize =
    logoStyle === "vertical"
      ? { width: 140, height: 140 }
      : { width: 120, height: 28 };

  return (
    <View
      style={[styles.header, logoStyle === "vertical" && styles.verticalLayout]}
    >
      <Image source={logoSource} style={[styles.logo, logoSize]} />
      {rightIcon && (
        <Pressable onPress={onRightPress} style={styles.rightIconWrap}>
          <IconImage name={rightIcon} size={28} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: VitaCareTheme.spacing.lg,
  },
  verticalLayout: {
    justifyContent: "center",
    paddingBottom: VitaCareTheme.spacing.sm,
  },
  logo: {
    resizeMode: "contain",
  },
  rightIconWrap: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
