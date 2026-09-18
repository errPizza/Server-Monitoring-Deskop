import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Screen } from "../components/Screen";
import {
  Card,
  PageHeader,
  SectionTitle,
  StateView,
} from "../components/Primitives";
import { LogLevel } from "../models";
import { useMonitoring } from "../state/MonitoringContext";
import { colors, radius } from "../theme";
const levels: Array<LogLevel | "ALL"> = [
  "ALL",
  "INFO",
  "WARNING",
  "ERROR",
  "CRITICAL",
];
export function LogsScreen() {
  const { logs, state, error, refresh } = useMonitoring();
  const [level, setLevel] = useState<LogLevel | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [paused, setPaused] = useState(false);
  const [snapshot, setSnapshot] = useState(logs);
  const visibleLogs = paused ? snapshot : logs;
  const [expanded, setExpanded] = useState<string>();
  const filtered = useMemo(
    () =>
      visibleLogs.filter(
        (log) =>
          (level === "ALL" || log.level === level) &&
          `${log.message} ${log.service}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [visibleLogs, level, query],
  );
  if (!logs.length && state !== "loaded")
    return (
      <Screen>
        <PageHeader eyebrow="EVENT STREAM" title="Logs" />
        <StateView
          kind={state === "loading" ? "loading" : "error"}
          message={error}
          onRetry={() => void refresh()}
        />
      </Screen>
    );
  return (
    <Screen>
      <PageHeader
        eyebrow="EVENT STREAM"
        title="Logs"
        right={
          <Pressable accessibilityRole="button" onPress={() => { if (!paused) setSnapshot(logs); setPaused(!paused); }}>
            <Text style={styles.pause}>{paused ? "RESUME" : "PAUSE"}</Text>
          </Pressable>
        }
      />
      <View style={styles.search}>
        <Ionicons name="search-outline" color={colors.muted} size={17} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search logs"
          placeholderTextColor={colors.subtle}
          style={styles.input}
        />
      </View>
      <View style={styles.filters}>
        {levels.map((item) => (
          <Pressable
            key={item}
            onPress={() => setLevel(item)}
            style={[styles.filter, item === level && styles.active]}
          >
            <Text
              style={[styles.filterText, item === level && styles.activeText]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.control}>
        <Text style={styles.muted}>
          {filtered.length} entries ·{" "}
          {paused ? "Auto-refresh paused" : "Auto-refresh enabled"}
        </Text>
        <Pressable
          onPress={() => {
            setLevel("ALL");
            setQuery("");
          }}
        >
          <Text style={styles.clear}>Clear filters</Text>
        </Pressable>
      </View>
      <Card style={styles.console}>
        {filtered.map((log) => (
          <Pressable
            onPress={() =>
              setExpanded(expanded === log.id ? undefined : log.id)
            }
            key={log.id}
            style={[styles.log, expanded === log.id && styles.expanded]}
          >
            <View style={styles.line}>
              <Text style={styles.time}>{log.timestamp.split(" ")[1]}</Text>
              <Text
                style={[
                  styles.level,
                  {
                    color:
                      log.level === "INFO"
                        ? colors.green
                        : log.level === "WARNING"
                          ? colors.yellow
                          : colors.red,
                  },
                ]}
              >
                {log.level}
              </Text>
              <Text style={styles.service}>[{log.service}]</Text>
            </View>
            <Text style={styles.message}>{log.message}</Text>
            {expanded === log.id ? (
              <>
                <Text style={styles.origin}>origin: {log.origin}</Text>
                {log.detail ? (
                  <Text style={styles.detail}>{log.detail}</Text>
                ) : null}
                <Pressable
                  hitSlop={6}
                  onPress={() =>
                    void Clipboard.setStringAsync(
                      `${log.timestamp} ${log.level} [${log.service}] ${log.message}${log.detail ? `\n${log.detail}` : ""}`,
                    )
                  }
                >
                  <Text style={styles.copy}>Copy log entry</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({
  pause: { color: colors.blue, fontSize: 11, fontWeight: "800" },
  search: {
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { color: colors.text, flex: 1, fontSize: 14 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  filter: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: { backgroundColor: colors.surfaceRaised, borderColor: colors.blue },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  activeText: { color: colors.blue },
  control: { flexDirection: "row", justifyContent: "space-between" },
  muted: { color: colors.muted, fontSize: 11 },
  clear: { color: colors.blue, fontSize: 11, fontWeight: "700" },
  console: { backgroundColor: colors.terminal, padding: 0, overflow: "hidden" },
  log: {
    padding: 12,
    gap: 5,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  expanded: { backgroundColor: colors.surfaceRaised },
  line: { flexDirection: "row", gap: 7 },
  time: { color: colors.subtle, fontSize: 10, fontFamily: "monospace" },
  level: { fontSize: 10, fontWeight: "800", fontFamily: "monospace" },
  service: { color: colors.purple, fontSize: 10, fontFamily: "monospace" },
  message: {
    color: colors.text,
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
  origin: { color: colors.muted, fontFamily: "monospace", fontSize: 10 },
  detail: {
    color: colors.muted,
    fontFamily: "monospace",
    fontSize: 10,
    lineHeight: 15,
  },
  copy: { color: colors.blue, fontSize: 10, marginTop: 3 },
});
