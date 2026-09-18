import { useMonitoring } from "../state/MonitoringContext";
import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import {
  Card,
  PageHeader,
  SectionTitle,
} from "../components/Primitives";
import { colors, radius } from "../theme";
import { environment } from "../config/environment";
import { useAuth } from "../state/AuthContext";

export function SettingsScreen() {
  const { logout } = useAuth();
  const { autoRefresh, setAutoRefresh } = useMonitoring();
  return (
    <Screen>
      <PageHeader eyebrow="PREFERENCES" title="Settings" />
      <SectionTitle title="Monitoring API" />
      <Card style={styles.settings}>
        <Setting
          label="Connection"
          value={
            environment.bypassAuth || environment.mode === "mock"
              ? "Datos simulados · sin conexión a RPi"
              : environment.apiBaseUrl
          }
        />
        <Setting
          label="API URL"
          value={
            environment.mode === "mock"
              ? "Configura AGM_MODE y AGM_API_URL al iniciar"
              : environment.apiBaseUrl
          }
        />
        <Setting label="Authentication" value={environment.bypassAuth ? "Temporarily bypassed for development" : "Secure session storage ready"} />
        <Setting label="Session" value={environment.bypassAuth || environment.mode === "mock" ? "Development session" : "Authenticated device session"} />
      </Card>
      <SectionTitle title="Notificaciones" />
      <Card><Text style={{ color: colors.muted }}>Consulta las alertas en el menú lateral. Las notificaciones del sistema todavía no están habilitadas.</Text></Card>
      <SectionTitle title="Refresh" />
      <Card style={styles.settings}>
        <Toggle
          label="Automatic refresh"
          value={autoRefresh}
          setValue={setAutoRefresh}
        />
        <Setting
          label="Interval"
          value={autoRefresh ? "30 seconds" : "Manual"}
        />
      </Card>
      <SectionTitle title="About" />
      <Card style={styles.settings}>
        <Setting label="Theme" value="Negro / gris carbón" />
        <Setting label="Version" value="1.0.0" />
        <Setting label="Build" value="Desktop monitoring client" />
      </Card>
      {environment.mode === "production" && !environment.bypassAuth ? <Pressable onPress={() => void logout()} style={styles.signOut}><Ionicons name="log-out-outline" size={18} color={colors.red} /><Text style={styles.signOutText}>Sign out and revoke this device session</Text></Pressable> : null}
    </Screen>
  );
}
function Setting({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.setting}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
function Toggle({
  label,
  value,
  setValue,
}: {
  label: string;
  value: boolean;
  setValue: (value: boolean) => void;
}) {
  return (
    <View style={styles.setting}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={setValue}
        trackColor={{ false: colors.subtle, true: "#238636" }}
        thumbColor={colors.text}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  settings: { paddingVertical: 0 },
  setting: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  settingValue: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "right",
    flex: 1,
  },
  signOut: { minHeight: 46, borderWidth: 1, borderColor: "#f8514955", borderRadius: radius.sm, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  signOutText: { color: colors.red, fontSize: 12, fontWeight: "800" },
});
