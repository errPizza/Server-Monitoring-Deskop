import { AlertLevel } from '../models';

/** Isolated notification boundary. Connect Expo Notifications/APNs/FCM here later. */
export interface NotificationService { configure(): Promise<void>; setCategoryEnabled(level: AlertLevel, enabled: boolean): Promise<void>; }
export class DisabledNotificationService implements NotificationService {
  async configure() { /* Deliberately no provider in mock mode. */ }
  async setCategoryEnabled(_level: AlertLevel, _enabled: boolean) { /* Persist with a secure/preferences adapter when configured. */ }
}
