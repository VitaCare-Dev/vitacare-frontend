import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { VitaCareTheme } from "@/theme/theme";

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: VitaCareTheme.colors.primary,
        tabBarInactiveTintColor: VitaCareTheme.colors.primary,
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

const styles = StyleSheet.create({
  tabBar: {
    height: 82,
    borderTopWidth: 0,
    backgroundColor: VitaCareTheme.colors.surface,
    paddingTop: VitaCareTheme.spacing.sm,
    paddingBottom: VitaCareTheme.spacing.md,
    paddingHorizontal: VitaCareTheme.spacing.sm,
    ...VitaCareTheme.shadow.card,
  },
  label: {
    fontSize: 11,
    fontFamily: VitaCareTheme.typography.fontFamily,
    marginBottom: 2,
  },
  centerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: VitaCareTheme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -10,
    ...VitaCareTheme.shadow.button,
  },
});
