import { environment } from '../config/environment';
import { HttpMonitoringService } from '../services/HttpMonitoringService';
import { MockMonitoringService } from '../services/MockMonitoringService';

// Bypass mode intentionally uses simulated telemetry so development does not
// send unauthenticated requests to the production monitoring endpoint.
const service = environment.mode === 'mock' || environment.bypassAuth
  ? new MockMonitoringService()
  : new HttpMonitoringService();
export const monitoringRepository = {
  getDashboard: () => service.getDashboard(), getLogs: () => service.getLogs(), getAlerts: () => service.getAlerts(), sendCommand: (command: Parameters<typeof service.sendCommand>[0]) => service.sendCommand(command),
};
