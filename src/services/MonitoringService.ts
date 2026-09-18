import { Alert, DashboardData, LogEntry, RemoteCommand } from '../models';

export interface MonitoringService {
  getDashboard(): Promise<DashboardData>;
  getLogs(): Promise<LogEntry[]>;
  getAlerts(): Promise<Alert[]>;
  sendCommand(command: RemoteCommand): Promise<{ message: string }>;
}
