import { Alert, DashboardData, LogEntry, RemoteCommand } from '../models';
import { MonitoringService } from './MonitoringService';
import { alertsMock, clone, dashboardMock, logsMock } from './mock/monitoringMock';

const delay = (ms = 420) => new Promise(resolve => setTimeout(resolve, ms));
export class MockMonitoringService implements MonitoringService {
  async getDashboard(): Promise<DashboardData> { await delay(); return clone({ ...dashboardMock, server: { ...dashboardMock.server, lastUpdated: new Date() } }); }
  async getLogs(): Promise<LogEntry[]> { await delay(280); return clone(logsMock); }
  async getAlerts(): Promise<Alert[]> { await delay(280); return clone(alertsMock); }
  async sendCommand(command: RemoteCommand): Promise<{ message: string }> { await delay(700); return { message: `${command.label} command sent successfully.` }; }
}
