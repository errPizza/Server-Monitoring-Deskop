import { apiFetch } from "./Desktop";
import { StorageDisk, StorageDirectory, StorageFile } from '../models/storage';
import { environment } from "../config/environment";
import {
  Alert,
  DashboardData,
  DockerContainer,
  LogEntry,
  RemoteCommand,
} from "../models";
import { authService, tokenStore } from "./AuthService";
import { MonitoringService } from "./MonitoringService";

const gb = (bytes: unknown) =>
  typeof bytes === "number" ? Math.round((bytes / 1024 ** 3) * 10) / 10 : null;
const date = (value: unknown) =>
  typeof value === "number"
    ? new Date(value * 1000).toISOString().replace("T", " ").replace("Z", "")
    : String(value ?? "");
const duration = (seconds: unknown) => {
  const total = Number(seconds) || 0;
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
};
const level = (value: unknown): LogEntry["level"] =>
  ["INFO", "WARNING", "ERROR", "CRITICAL"].includes(String(value).toUpperCase())
    ? (String(value).toUpperCase() as LogEntry["level"])
    : "INFO";
const alertLevel = (value: unknown): Alert["level"] =>
  (({
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    CRITICAL: "critical",
    FATAL: "critical",
  })[String(value).toUpperCase()] ?? "info") as Alert["level"];

/** Adapter for the authenticated /api/mobile contract in Discord-RobloxPurchsAlerts. */
export class HttpMonitoringService implements MonitoringService {
  private async request<T>(
    path: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      environment.requestTimeoutMs,
    );
    try {
      const accessToken = tokenStore.getAccessToken();
      const response = await apiFetch(`${environment.apiBaseUrl}/mobile${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...options.headers,
        },
      });
      if (response.status === 401 && retry && (await authService.refresh()))
        return this.request<T>(path, options, false);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          response.status === 404 && path === '/storage/disks' ? 'La API del servidor todavía no tiene Storage habilitado.' : payload.error ?? `Monitoring API returned ${response.status}`,
        );
      return payload as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async getStorageDisks(): Promise<StorageDisk[]> {
    return this.request('/storage/disks');
  }
  async getStorageDirectory(volume: string, path: string, offset = 0): Promise<StorageDirectory> {
    return this.request(`/storage/directory?volume=${encodeURIComponent(volume)}&path=${encodeURIComponent(path)}&offset=${offset}`);
  }
  async getStorageFile(volume: string, path: string): Promise<StorageFile> {
    return this.request(`/storage/file?volume=${encodeURIComponent(volume)}&path=${encodeURIComponent(path)}`);
  }

  async getDashboard(): Promise<DashboardData> {
    const [
      system,
      power,
      requests,
      errors,
      docker,
      nginx,
      application,
      server,
    ] = await Promise.all([
      this.request<any>("/system"),
      this.request<any>("/power"),
      this.request<any>("/requests"),
      this.request<any>("/errors?limit=100"),
      this.request<any>("/docker"),
      this.request<any>("/nginx"),
      this.request<any>("/application"),
      this.request<any>("/server/status"),
    ]);
    const snapshot = server.system ?? system;
    const address =
      snapshot.network
        ?.flatMap((item: any) => item.addresses ?? [])
        .find((item: any) => item.family === "IPv4")?.address ??
      snapshot.hostname ??
      "Unknown host";
    const requestRows = requests.lastHour ?? [];
    const history = requestRows.reduce(
      (acc: Record<string, number>, row: any) => {
        const key = String(row.bucketStart);
        acc[key] = (acc[key] ?? 0) + Number(row.count ?? 0);
        return acc;
      },
      {},
    );
    const requestHistory = Object.values(history).slice(-20).map(Number);
    const errorsList = errors.errors ?? [];
    const containers: DockerContainer[] = (docker.containers ?? []).map(
      (item: any) => ({
        id: item.id,
        name: item.name ?? item.id,
        status: item.state === "running" ? "running" : "stopped",
        cpu: item.cpuPercent ?? 0,
        ram: item.memoryBytes
          ? `${Math.round(item.memoryBytes / 1024 ** 2)} MB`
          : "N/A",
        network: item.network?.join(", ") || "N/A",
        uptime: item.startedAt
          ? new Date(item.startedAt).toLocaleDateString()
          : "N/A",
        restarts: item.restartCount ?? 0,
      }),
    );
    return {
      server: {
        name: application.name ?? snapshot.hostname,
        host: address,
        health: "online",
        uptime: duration(snapshot.uptimeSeconds),
        lastUpdated: new Date(),
      },
      metrics: {
        cpu: snapshot.cpu?.usagePercent ?? null,
        cores: [],
        ramUsed: gb(snapshot.memory?.used) ?? 0,
        ramTotal: gb(snapshot.memory?.total) ?? 0,
        temperature: snapshot.temperature?.celsius ?? null,
        frequency: snapshot.cpu?.model ?? "N/A",
        diskUsed: gb(snapshot.storage?.used),
        diskTotal: gb(snapshot.storage?.total),
        download: "N/A",
        upload: "N/A",
      },
      power: {
        watts: power.watts ?? null,
        averageWatts: null,
        peakWatts: null,
        minimumWatts: null,
        voltage: power.voltage ?? null,
        current: power.current ?? null,
        energyKwh: power.energyKwh ?? null,
        history: [],
        source: power.available ? "api" : "unavailable",
      },
      requests: {
        perSecond: 0,
        perMinute: Math.round(Number(requests.requestsPerMinute ?? 0)),
        perHour: requestRows.reduce(
          (sum: number, row: any) => sum + Number(row.count ?? 0),
          0,
        ),
        total: String(requests.totalRequests ?? 0),
        methods: { GET: 0, POST: 0, PUT: 0, DELETE: 0, Other: 0 },
        statuses: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
        averageResponse: "N/A",
        maxResponse: "N/A",
        inbound: "N/A",
        outbound: "N/A",
        endpoints: [],
        history: requestHistory.length ? requestHistory : [0],
      },
      errors: {
        total: errorsList.length,
        statuses: {
          "400": 0,
          "401": 0,
          "403": 0,
          "404": 0,
          "429": 0,
          "500": 0,
          "502": 0,
          "503": 0,
          Other: errorsList.length,
        },
        history: errorsList.map(() => 1).slice(-20),
      },
      docker: containers,
      nginx: {
        health: nginx.available ? "online" : "warning",
        uptime: "N/A",
        requests: "N/A",
        active: 0,
        reading: 0,
        writing: 0,
        waiting: 0,
        errors: 0,
        responseTime: "N/A",
        history: [0],
      },
      events: (server.events ?? []).map((event: any, index: number) => ({
        id: `${event.createdAt ?? index}-${event.type ?? "event"}`,
        title: event.type ?? "Server event",
        detail: event.message ?? "",
        timestamp: date(event.createdAt),
        level: event.type?.includes("SHUTDOWN") ? "critical" : "info",
      })),
    };
  }
  async getLogs(): Promise<LogEntry[]> {
    const result = await this.request<any>("/logs?limit=100");
    return (result.logs ?? []).map((item: any) => ({
      id: String(item.id),
      timestamp: date(item.createdAt),
      level: level(item.level),
      service: item.service ?? "app",
      origin: item.requestId ?? "api",
      message: item.message ?? "",
      detail: item.metadata ?? undefined,
    }));
  }
  async getAlerts(): Promise<Alert[]> {
    const result = await this.request<any>("/alerts?limit=100");
    return (result.alerts ?? []).map((item: any) => ({
      id: String(item.id),
      level: alertLevel(item.severity),
      title: item.type ?? "Monitoring alert",
      description: item.message ?? "",
      timestamp: date(item.timestamp),
      read: Boolean(item.acknowledgedAt),
    }));
  }
  async sendCommand(command: RemoteCommand): Promise<{ message: string }> {
    const endpoint =
      command.target === "raspberry"
        ? `/server/${command.action}`
        : command.target === "nginx"
          ? `/nginx/${command.action}`
          : command.target === "docker" && command.containerId
            ? `/docker/${encodeURIComponent(command.containerId)}/${command.action}`
            : null;
    if (!endpoint)
      throw new Error("This command is not supported by the monitoring API.");
    await this.request(endpoint, {
      method: "POST",
      body: JSON.stringify({ data: {} }),
    });
    return { message: `${command.label} request accepted by monitoring API.` };
  }
}
