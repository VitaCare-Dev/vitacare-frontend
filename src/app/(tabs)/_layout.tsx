import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

type TabIconProps = Readonly<{
  name: Parameters<typeof IconImage>[0]["name"];
  focused?: boolean;
}>;

function TabIcon({ name, focused }: TabIconProps) {
  return (
    <IconImage name={name} size={24} style={{ opacity: focused ? 1 : 0.45 }} />
  );
}

function CenterTabIcon() {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.centerButton}>
      <IconImage name="agregar" tone="white" size={24} />
    </View>
  );
}

function renderTabIcon(name: TabIconProps["name"]) {
  return ({ focused }: Readonly<{ focused: boolean }>) => (
    <TabIcon name={name} focused={focused} />
  );
}

function renderCenterTabIcon() {
  return () => <CenterTabIcon />;
}

export default function TabsLayout() {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.primary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: renderTabIcon("home"),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          tabBarIcon: renderTabIcon("registros"),
        }}
      />
      <Tabs.Screen
        name="health-control"
        options={{
          title: "Registrar",
          tabBarIcon: renderCenterTabIcon(),
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{
          title: "Prestadores",
          tabBarIcon: renderTabIcon("md-del-usuario"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: renderTabIcon("usuario"),
        }}
      />
    </Tabs>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
    tabBar: {
      height: 68,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      borderTopWidth: 0,
      backgroundColor: theme.colors.surface,
      paddingTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      ...theme.shadow.card,
    },
    label: {
      fontSize: 11,
      fontFamily: theme.typography.fontFamily,
      marginBottom: 2,
    },
    centerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginTop: -10,
      ...theme.shadow.button,
    },
  });
}
