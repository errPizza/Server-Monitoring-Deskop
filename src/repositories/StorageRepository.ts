import { environment } from '../config/environment';
import { HttpMonitoringService } from '../services/HttpMonitoringService';
import { mockStorage } from '../services/mock/storageMock';
export const storageRepository = environment.mode === 'mock' || environment.bypassAuth ? mockStorage : new HttpMonitoringService();
