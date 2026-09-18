import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
import { colors, radius, spacing } from "../theme";
const periods = ["5m", "15m", "1h", "6h", "24h", "7d", "30d"];
export function TrafficScreen() {
  const { dashboard: d, state, error, refresh } = useMonitoring();
  const [period, setPeriod] = useState("15m");
  if (!d)
    return (
      <Screen>
        <PageHeader eyebrow="HTTP" title="Requests" />
        <StateView
          kind={state === "loading" ? "loading" : "error"}
          message={error}
          onRetry={() => void refresh()}
        />
      </Screen>
    );
  const r = d.requests;
  return (
    <Screen>
      <PageHeader eyebrow="HTTP TRAFFIC" title="Requests" />
      <View style={styles.periods}>
        {periods.map((item) => (
          <Pressable
            key={item}
            onPress={() => setPeriod(item)}
            style={[styles.period, item === period && styles.periodActive]}
          >
            <Text
              style={[
                styles.periodText,
                item === period && styles.periodTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.grid}>
        <MetricCard
          icon="flash-outline"
          label="PER SECOND"
          value={`${r.perSecond}`}
          detail="Requests / sec"
        />
        <MetricCard
          icon="pulse-outline"
          label="PER MINUTE"
          value={`${r.perMinute}`}
          detail="Requests / min"
          color={colors.green}
        />
        <MetricCard
          icon="time-outline"
          label="AVG RESPONSE"
          value={r.averageResponse}
          detail={`Max ${r.maxResponse}`}
          color={colors.purple}
        />
        <MetricCard
          icon="git-network-outline"
          label="TOTAL"
          value={r.total}
          detail="All time"
          color={colors.orange}
        />
      </View>
      <SectionTitle title={`Request rate · last ${period}`} />
      <Card>
        <MiniChart
          data={r.history}
          color={colors.green}
          height={108}
          labels={[`-${period}`, "Now"]}
        />
      </Card>
      <SectionTitle title="HTTP methods" />
      <Card>
        <View style={styles.methods}>
          {Object.entries(r.methods).map(([method, value]) => (
            <View key={method} style={styles.method}>
              <Text style={styles.methodValue}>{value}%</Text>
              <Text style={styles.methodName}>{method}</Text>
            </View>
          ))}
        </View>
      </Card>
      <SectionTitle title="Top endpoints" />
      <Card>
        {r.endpoints.map((endpoint, index) => (
          <View
            key={endpoint.path}
            style={[styles.endpoint, index !== 0 && styles.border]}
          >
            <View style={styles.endpointPath}>
              <Text style={styles.path}>{endpoint.path}</Text>
              <Text style={styles.muted}>{endpoint.response}</Text>
            </View>
            <Text style={styles.count}>{endpoint.requests}</Text>
          </View>
        ))}
      </Card>
      <View style={styles.io}>
        <MetricCard
          icon="arrow-down-outline"
          label="INBOUND"
          value={r.inbound}
          color={colors.blue}
        />
        <MetricCard
          icon="arrow-up-outline"
          label="OUTBOUND"
          value={r.outbound}
          color={colors.purple}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  periods: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 3,
    overflow: "hidden",
  },
  period: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 4,
  },
  periodActive: { backgroundColor: colors.surfaceRaised },
  periodText: { fontSize: 10, color: colors.muted, fontWeight: "700" },
  periodTextActive: { color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  methods: { flexDirection: "row", justifyContent: "space-between" },
  method: { alignItems: "center", gap: 4 },
  methodValue: { color: colors.text, fontWeight: "800", fontSize: 16 },
  methodName: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  endpoint: {
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  endpointPath: { gap: 4 },
  path: { color: colors.blue, fontSize: 13, fontWeight: "700" },
  muted: { color: colors.muted, fontSize: 10 },
  count: { color: colors.text, fontSize: 13, fontWeight: "700" },
  io: { flexDirection: "row", gap: spacing.sm },
});
