import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import {
  Card,
  MetricCard,
  PageHeader,
  SectionTitle,
  StateView,
} from "../components/Primitives";
import { MiniChart } from "../components/Chart";
import { useMonitoring } from "../state/MonitoringContext";
import { colors, spacing } from "../theme";

export function HardwareScreen() {
  const { dashboard: d, state, error, refresh } = useMonitoring();
  if (!d)
    return (
      <Screen>
        <PageHeader eyebrow="HOST" title="Raspberry Pi" />
        <StateView
          kind={state === "loading" ? "loading" : "error"}
          message={error}
          onRetry={() => void refresh()}
        />
      </Screen>
    );
  const m = d.metrics,
    p = d.power;
  return (
    <Screen>
      <PageHeader eyebrow="HOST TELEMETRY" title="Raspberry Pi" />
      <View style={styles.grid}>
        <MetricCard
          icon="speedometer-outline"
          percent={m.cpu}
          label="CPU USAGE"
          value={m.cpu === null ? "N/A" : `${m.cpu}%`}
          detail={`${m.frequency} · ${m.cores.length} cores`}
        />
        <MetricCard
          icon="thermometer-outline"
          luminous
          label="TEMPERATURE"
          value={m.temperature === null ? "N/A" : `${m.temperature}°C`}
          detail={
            m.temperature === null
              ? "Sensor unavailable"
              : "Within normal range"
          }
          color={colors.green}
        />
        <MetricCard
          icon="hardware-chip-outline"
          percent={m.ramTotal > 0 ? m.ramUsed / m.ramTotal * 100 : null}
          label="MEMORY"
          value={`${m.ramUsed} GB`}
          detail={`${(m.ramTotal - m.ramUsed).toFixed(1)} GB available`}
          color={colors.purple}
        />
        <MetricCard
          icon="save-outline"
          label="DISK"
          value={m.diskUsed === null ? "N/A" : `${m.diskUsed} GB`}
          detail={
            m.diskUsed === null || m.diskTotal === null
              ? "Collector unavailable"
              : `${(m.diskTotal - m.diskUsed).toFixed(1)} GB available`
          }
          color={colors.orange}
        />
      </View>
      <SectionTitle title="CPU cores" />
      <Card>
        <View style={styles.cores}>
          {m.cores.map((core, i) => (
            <View key={i} style={styles.core}>
              <Text style={styles.coreName}>CORE {i + 1}</Text>
              <Text style={styles.coreValue}>{core}%</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${core}%` }]} />
              </View>
            </View>
          ))}
        </View>
      </Card>
      <SectionTitle title="Power consumption" />
      <Card>
        <View style={styles.powerTop}>
          <View>
            <Text style={styles.power}>
              {p.watts === null ? "N/A" : `${p.watts} W`}
            </Text>
            <Text style={styles.caption}>
              {p.source === "mock"
                ? "Mock telemetry — connect a compatible meter/API for live values"
                : "Current draw"}
            </Text>
          </View>
          <Text style={styles.source}>{p.source.toUpperCase()}</Text>
        </View>
        <MiniChart
          data={p.history}
          color={colors.yellow}
          labels={["20 min ago", "Now"]}
        />
        <View style={styles.powerStats}>
          <Info
            label="AVERAGE"
            value={p.averageWatts === null ? "N/A" : `${p.averageWatts} W`}
          />
          <Info
            label="PEAK"
            value={p.peakWatts === null ? "N/A" : `${p.peakWatts} W`}
          />
          <Info
            label="MINIMUM"
            value={p.minimumWatts === null ? "N/A" : `${p.minimumWatts} W`}
          />
        </View>
      </Card>
      <SectionTitle title="Network" />
      <Card style={styles.network}>
        <Info label="DOWNLOAD" value={m.download} />
        <Info label="UPLOAD" value={m.upload} />
        <Info label="UPTIME" value={d.server.uptime} />
      </Card>
    </Screen>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  cores: { gap: 14 },
  core: { gap: 6 },
  coreName: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  coreValue: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
    position: "absolute",
    right: 0,
    top: 0,
  },
  track: {
    height: 5,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 6,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: colors.blue, borderRadius: 6 },
  powerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  power: { color: colors.text, fontSize: 30, fontWeight: "800" },
  caption: { color: colors.muted, fontSize: 10, marginTop: 2, maxWidth: 245 },
  source: { color: colors.yellow, fontSize: 10, fontWeight: "800" },
  powerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 13,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  network: { flexDirection: "row", justifyContent: "space-between" },
});
