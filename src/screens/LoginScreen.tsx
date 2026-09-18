import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandMark } from "../components/BrandMark";
import { useAuth } from "../state/AuthContext";
import { colors, radius, spacing } from "../theme";

export function LoginScreen() {
  const { state, error, pendingDevice, login, retrySession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy || !email.trim() || !password) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch {
    } finally {
      setBusy(false);
    }
  };
  if (state === "checking")
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.blue} />
          <Text style={styles.note}>Checking secure session…</Text>
        </View>
      </SafeAreaView>
    );
  if (state === "pending")
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <BrandMark />
          <View style={styles.card}>
            <Text style={styles.kicker}>DEVICE APPROVAL REQUIRED</Text>
            <Text style={styles.title}>Request submitted</Text>
            <Text style={styles.note}>
              “{pendingDevice ?? "This device"}” is pending approval. An admin
              or owner must approve it from the Another Game More web dashboard
              before this app can receive monitoring data.
            </Text>
            <Pressable
              onPress={() => void retrySession()}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Check approval</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <BrandMark />
        <View style={styles.hero}>
          <Text style={styles.kicker}>SECURE REMOTE ACCESS</Text>
          <Text style={styles.title}>Sign in to monitor</Text>
          <Text style={styles.note}>
            Use your Another Game More account. New devices require one-time
            approval by an administrator.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={colors.subtle}
            style={styles.input}
          />
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            accessibilityLabel="Contraseña"
            onSubmitEditing={() => void submit()}
            autoComplete="password"
            placeholder="••••••••"
            placeholderTextColor={colors.subtle}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            disabled={busy}
            onPress={() => void submit()}
            style={[styles.button, busy && { opacity: 0.7 }]}
          >
            {busy ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.buttonText}>Request access</Text>
            )}
          </Pressable>
        </View>
        <Text style={styles.footer}>
          Tokens are stored in your device’s secure storage. They are never
          written into app configuration.
        </Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.xl,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  hero: { gap: 8 },
  kicker: {
    color: colors.blue,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "600",
    letterSpacing: -0.8,
  },
  note: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: 9,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  input: {
    minHeight: 45,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.terminal,
    paddingHorizontal: 12,
  },
  button: {
    minHeight: 46,
    marginTop: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.bg, fontSize: 13, fontWeight: "600" },
  error: { color: colors.red, fontSize: 12, lineHeight: 17, marginTop: 3 },
  footer: {
    color: colors.subtle,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },
});
