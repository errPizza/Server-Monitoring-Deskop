import { DesktopAlert as NativeAlert } from "../services/Desktop";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Screen } from "../components/Screen";
import {
  ActionButton,
  Card,
  MetricCard,
  PageHeader,
  SectionTitle,
  StateView,
  StatusBadge,
} from "../components/Primitives";
import { MiniChart } from "../components/Chart";
import { RemoteCommand } from "../models";
import { useMonitoring } from "../state/MonitoringContext";
import { colors, radius, spacing } from "../theme";
import { environment } from "../config/environment";

const ready = (state: string) => state === "loaded";
export function ErrorsScreen() {
  const { dashboard: d, logs, state, error, refresh } = useMonitoring();
  if (!d)
    return (
      <BasicState
        title="Errors"
        state={state}
        message={error}
        refresh={refresh}
      />
    );
  return (
    <Screen>
      <PageHeader eyebrow="HTTP RELIABILITY" title="Errors" />
      <View style={styles.grid}>
        <MetricCard
          icon="alert-circle-outline"
          label="TOTAL"
          value={`${d.errors.total}`}
          detail="Selected period"
          color={colors.red}
        />
        <MetricCard
          icon="trending-down-outline"
          label="TREND"
          value={environment.mode === "mock" ? "−18%" : "N/A"}
          detail="vs previous period"
          color={colors.green}
        />
      </View>
      <SectionTitle title="Error trend" />
      <Card>
        <MiniChart
          data={d.errors.history}
          color={colors.red}
          height={100}
          labels={["15 min ago", "Now"]}
        />
      </Card>
      <SectionTitle title="HTTP status distribution" />
      <Card>
        {Object.entries(d.errors.statuses).map(([status, count], i) => (
          <View key={status} style={[styles.row, i > 0 && styles.border]}>
            <Text
              style={[
                styles.statusCode,
                status.startsWith("5") && { color: colors.red },
              ]}
            >
              {status}
            </Text>
            <Text style={styles.rowValue}>{count}</Text>
          </View>
        ))}
      </Card>
      <SectionTitle title="Recent errors" />
      <Card>
        {logs.filter((entry) => entry.level === "ERROR" || entry.level === "CRITICAL").slice(0, 20).map((entry, i) => (
          <View
            key={entry.id}
            style={[styles.error, i > 0 && styles.border]}
          >
            <View>
              <Text style={styles.errorEndpoint}>
                {entry.service}
              </Text>
              <Text style={styles.small}>
                {entry.timestamp} · {entry.message}
              </Text>
            </View>
            <Text style={styles.errorCode}>{entry.level}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
export function DockerScreen() {
  const { dashboard: d, state, error, refresh, sendCommand } = useMonitoring();
  if (!d)
    return (
      <BasicState
        title="Docker"
        state={state}
        message={error}
        refresh={refresh}
      />
    );
  return (
    <Screen>
      <PageHeader
        eyebrow="CONTAINERS"
        title="Docker"
        right={
          <StatusBadge
            status="running"
            label={`${d.docker.filter((c) => c.status === "running").length}/${d.docker.length} RUNNING`}
          />
        }
      />
      <Text style={styles.small}>
        Container actions are dispatched only to the monitoring API.
      </Text>
      {d.docker.map((container) => (
        <Card key={container.id}>
          <View style={styles.containerHead}>
            <View>
              <Text style={styles.containerName}>{container.name}</Text>
              <StatusBadge status={container.status} />
            </View>
            <Text style={styles.uplink}>{container.uptime}</Text>
          </View>
          <View style={styles.containerStats}>
            <Info label="CPU" value={`${container.cpu}%`} />
            <Info label="RAM" value={container.ram} />
            <Info label="NETWORK" value={container.network} />
            <Info label="RESTARTS" value={`${container.restarts}`} />
          </View>
          <View style={styles.actions}>
            <ActionButton
              title="Restart"
              icon="refresh-outline"
              onPress={() =>
                commandPrompt(
                  {
                    id: `restart-${container.id}`,
                    target: "docker",
                    action: "restart",
                    label: `Restart ${container.name}`,
                    destructive: false,
                    containerId: container.id,
                  },
                  sendCommand,
                )
              }
            />
            <ActionButton
              title="Stop"
              icon="stop-circle-outline"
              danger
              onPress={() =>
                commandPrompt(
                  {
                    id: `stop-${container.id}`,
                    target: "docker",
                    action: "stop",
                    label: `Stop ${container.name}`,
                    destructive: true,
                    containerId: container.id,
                  },
                  sendCommand,
                )
              }
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
export function NginxScreen() {
  const { dashboard: d, state, error, refresh, sendCommand } = useMonitoring();
  if (!d)
    return (
      <BasicState
        title="Nginx"
        state={state}
        message={error}
        refresh={refresh}
      />
    );
  const n = d.nginx;
  return (
    <Screen>
      <PageHeader
        eyebrow="WEB SERVER"
        title="Nginx"
        right={<StatusBadge status={n.health} />}
      />
      <View style={styles.grid}>
        <MetricCard
          icon="people-outline"
          label="ACTIVE"
          value={`${n.active}`}
          detail="connections"
          color={colors.green}
        />
        <MetricCard
          icon="time-outline"
          label="RESPONSE"
          value={n.responseTime}
          detail="average"
          color={colors.blue}
        />
        <MetricCard
          icon="git-network-outline"
          label="REQUESTS"
          value={n.requests}
          detail="all time"
          color={colors.purple}
        />
        <MetricCard
          icon="warning-outline"
          label="ERRORS"
          value={`${n.errors}`}
          detail="selected period"
          color={colors.red}
        />
      </View>
      <SectionTitle title="Requests / minute" />
      <Card>
        <MiniChart
          data={n.history}
          color={colors.green}
          height={108}
          labels={["20 min ago", "Now"]}
        />
      </Card>
      <SectionTitle title="Connection states" />
      <Card style={styles.connection}>
        <Info label="READING" value={`${n.reading}`} />
        <Info label="WRITING" value={`${n.writing}`} />
        <Info label="WAITING" value={`${n.waiting}`} />
        <Info label="UPTIME" value={n.uptime} />
      </Card>
      <View style={styles.actions}>
        <ActionButton
          title="Reload Nginx"
          icon="reload-outline"
          onPress={() =>
            commandPrompt(
              {
                id: "reload-nginx",
                target: "nginx",
                action: "reload",
                label: "Reload Nginx",
                destructive: false,
              },
              sendCommand,
            )
          }
        />
        <ActionButton
          title="Restart"
          icon="refresh-outline"
          danger
          onPress={() =>
            commandPrompt(
              {
                id: "restart-nginx",
                target: "nginx",
                action: "restart",
                label: "Restart Nginx",
                destructive: true,
              },
              sendCommand,
            )
          }
        />
      </View>
    </Screen>
  );
}
export function StatisticsScreen() {
  const { dashboard: d, state, error, refresh } = useMonitoring();
  const [range, setRange] = useState("24h");
  if (!d)
    return (
      <BasicState
        title="Statistics"
        state={state}
        message={error}
        refresh={refresh}
      />
    );
  const sets = [
    ["Requests", d.requests.history, colors.green],
    ["Errors", d.errors.history, colors.red],
    [
      "CPU utilization",
      environment.mode === "mock" ? d.requests.history.map((v) => Math.min(95, Math.round(v / 4))) : [],
      colors.blue,
    ],
    ["Power consumption", d.power.history, colors.yellow],
    [
      "Network traffic",
      environment.mode === "mock" ? d.requests.history.map((v) => Math.round(v / 8)) : [],
      colors.purple,
    ],
  ] as const;
  return (
    <Screen>
      <PageHeader eyebrow="HISTORICAL DATA" title="Statistics" />
      <View style={styles.ranges}>
        {["1h", "6h", "24h", "7d", "30d"].map((item) => (
          <Pressable
            key={item}
            onPress={() => setRange(item)}
            style={[styles.range, range === item && styles.active]}
          >
            <Text
              style={[styles.filterText, range === item && styles.activeText]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      {sets.map(([title, data, color]) => (
        <View key={title}>
          <SectionTitle title={title} />
          <Card>
            <MiniChart
              data={[...data]}
              color={color}
              height={80}
              labels={[`-${range}`, "Now"]}
            />
          </Card>
        </View>
      ))}
    </Screen>
  );
}
export function AlertsScreen() {
  const { alerts, state, error, refresh } = useMonitoring();
  if (!alerts.length && !ready(state))
    return (
      <BasicState
        title="Alerts"
        state={state}
        message={error}
        refresh={refresh}
      />
    );
  return (
    <Screen>
      <PageHeader
        eyebrow="NOTIFICATION HISTORY"
        title="Alerts"
        right={
          <Text style={styles.unread}>
            {alerts.filter((a) => !a.read).length} UNREAD
          </Text>
        }
      />
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          style={[styles.alert, !alert.read && styles.unreadCard]}
        >
          <View style={styles.alertTop}>
            <StatusBadge status={alert.level} />
            <Text style={styles.small}>{alert.timestamp}</Text>
          </View>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertDescription}>{alert.description}</Text>
        </Card>
      ))}
      <Card>
        <Text style={styles.small}>
          Las notificaciones del sistema todavía no están habilitadas.
        </Text>
      </Card>
    </Screen>
  );
}
export function RemoteControlScreen() {
  const { sendCommand } = useMonitoring();
  const action = (command: RemoteCommand) => commandPrompt(command, sendCommand);
  return (
    <Screen>
      <PageHeader eyebrow="AUTHORIZED COMMANDS" title="Remote Control" />
      <Card>
        <Text style={styles.safety}>
          Remote control is API-only. No SSH connection or local server command
          is ever made from the app.
        </Text>
      </Card>
      <SectionTitle title="Raspberry Pi" />
      <View style={styles.actionStack}>
        <ActionButton
          title="Restart Raspberry Pi"
          icon="refresh-outline"
          danger
          onPress={() =>
            action({
              id: "restart-pi",
              target: "raspberry",
              action: "restart",
              label: "Restart Raspberry Pi",
              destructive: true,
            })
          }
        />
        <ActionButton
          title="Shutdown Raspberry Pi"
          icon="power-outline"
          danger
          onPress={() =>
            action({
              id: "shutdown-pi",
              target: "raspberry",
              action: "shutdown",
              label: "Shutdown Raspberry Pi",
              destructive: true,
            })
          }
        />
      </View>
      <SectionTitle title="Nginx" />
      <View style={styles.actionStack}>
        <ActionButton
          title="Reload Nginx"
          icon="reload-outline"
          onPress={() =>
            action({
              id: "reload-nginx",
              target: "nginx",
              action: "reload",
              label: "Reload Nginx",
              destructive: false,
            })
          }
        />
        <ActionButton
          title="Restart Nginx"
          icon="refresh-outline"
          danger
          onPress={() =>
            action({
              id: "restart-nginx",
              target: "nginx",
              action: "restart",
              label: "Restart Nginx",
              destructive: true,
            })
          }
        />
      </View>
      <SectionTitle title="Docker containers" />
      <Card>
        <Text style={styles.small}>
          Open Docker for individual Start, Stop, and Restart controls.
        </Text>
      </Card>
    </Screen>
  );
}
function commandPrompt(
  command: RemoteCommand,
  sendCommand: (command: RemoteCommand) => Promise<string>,
) {
  NativeAlert.alert(
    "Confirm action",
    `Are you sure you want to ${command.label.toLowerCase()}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        style: command.destructive ? "destructive" : "default",
        onPress: () =>
          void sendCommand(command)
            .then((message) => NativeAlert.alert("Command queued", message))
            .catch(() =>
              NativeAlert.alert(
                "Command failed",
                "Unable to reach the monitoring API.",
              ),
            ),
      },
    ],
  );
}
function BasicState({
  title,
  state,
  message,
  refresh,
}: {
  title: string;
  state: string;
  message?: string;
  refresh: () => Promise<void>;
}) {
  return (
    <Screen>
      <PageHeader eyebrow="MONITORING" title={title} />
      <StateView
        kind={state === "loading" ? "loading" : "error"}
        message={message}
        onRetry={() => void refresh()}
      />
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  statusCode: { color: colors.text, fontWeight: "700", fontSize: 13 },
  rowValue: { color: colors.muted, fontSize: 13 },
  error: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: 10,
  },
  errorEndpoint: { color: colors.text, fontSize: 12, fontWeight: "700" },
  errorCode: { color: colors.red, fontSize: 16, fontWeight: "800" },
  small: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  containerHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  containerName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  uplink: { color: colors.muted, fontSize: 11 },
  containerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  infoValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: 12 },
  connection: { flexDirection: "row", justifyContent: "space-between" },
  ranges: { flexDirection: "row", gap: 6 },
  range: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  active: { borderColor: colors.blue, backgroundColor: "#58a6ff18" },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  activeText: { color: colors.blue },
  alert: { gap: 9 },
  unreadCard: { borderColor: "#f8514970" },
  alertTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
  alertDescription: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  unread: { color: colors.blue, fontSize: 10, fontWeight: "800" },
  safety: { color: colors.yellow, fontSize: 12, lineHeight: 18 },
  actionStack: { gap: spacing.sm },
});
