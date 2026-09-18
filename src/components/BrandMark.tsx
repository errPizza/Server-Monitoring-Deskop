import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";

/** Original app mark: a server rack framed by a live signal. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.mark}>
        <Ionicons
          name="server-outline"
          size={compact ? 17 : 24}
          color={colors.text}
        />
        <View style={styles.signal} />
      </View>
      {!compact ? (
        <View>
          <Text style={styles.name}>AGM SERVER</Text>
          <Text style={styles.sub}>MONITORING</Text>
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  compact: { gap: 0 },
  mark: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#58a6ff66",
    backgroundColor: "#58a6ff16",
    alignItems: "center",
    justifyContent: "center",
  },
  signal: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: colors.green,
    right: 5,
    top: 5,
    borderWidth: 1,
    borderColor: colors.bg,
  },
  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sub: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 2,
  },
});
