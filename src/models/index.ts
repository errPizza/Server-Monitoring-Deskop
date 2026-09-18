export type Health = "online" | "warning" | "critical" | "offline";
export type AlertLevel = "info" | "warning" | "error" | "critical";
export type LogLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface ServerStatus {
  name: string;
  host: string;
  health: Health;
  uptime: string;
  lastUpdated: Date | string;
}
export interface SystemMetrics {
  cpu: number | null;
  cores: number[];
  ramUsed: number;
  ramTotal: number;
  temperature: number | null;
  frequency: string;
  diskUsed: number | null;
  diskTotal: number | null;
  download: string;
  upload: string;
}
export interface PowerMetrics {
  watts: number | null;
  averageWatts: number | null;
  peakWatts: number | null;
  minimumWatts: number | null;
  voltage?: number | null;
  current?: number | null;
  energyKwh?: number | null;
  history: number[];
  source: "mock" | "api" | "unavailable";
}
export interface RequestStatistics {
  perSecond: number;
  perMinute: number;
  perHour: number;
  total: string;
  methods: Record<string, number>;
  statuses: Record<string, number>;
  averageResponse: string;
  maxResponse: string;
  inbound: string;
  outbound: string;
  endpoints: { path: string; requests: string; response: string }[];
  history: number[];
}
export interface ErrorStatistics {
  total: number;
  statuses: Record<string, number>;
  history: number[];
}
export interface DockerContainer {
  id: string;
  name: string;
  status: "running" | "stopped";
  cpu: number;
  ram: string;
  network: string;
  uptime: string;
  restarts: number;
}
export interface NginxStatus {
  health: Health;
  uptime: string;
  requests: string;
  active: number;
  reading: number;
  writing: number;
  waiting: number;
  errors: number;
  responseTime: string;
  history: number[];
}
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  origin: string;
  message: string;
  detail?: string;
}
export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}
export interface ServerEvent {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  level: AlertLevel;
}
export interface RemoteCommand {
  id: string;
  target: "raspberry" | "nginx" | "docker" | "service";
  action: "restart" | "shutdown" | "reload" | "start" | "stop";
  label: string;
  destructive: boolean;
  containerId?: string;
}
export interface DashboardData {
  server: ServerStatus;
  metrics: SystemMetrics;
  power: PowerMetrics;
  requests: RequestStatistics;
  errors: ErrorStatistics;
  docker: DockerContainer[];
  nginx: NginxStatus;
  events: ServerEvent[];
}
