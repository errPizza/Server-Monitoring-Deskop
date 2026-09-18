import { Alert, DashboardData, DockerContainer, ErrorStatistics, LogEntry, RequestStatistics } from '../../models';

const now = new Date();
const chart = (base: number, spread: number, count = 20) => Array.from({ length: count }, (_, i) => Math.max(1, Math.round(base + Math.sin(i * 0.72) * spread + ((i * 13) % 9))));

export const dashboardMock: DashboardData = {
  server: { name: 'rpi-web-01', host: '192.168.1.42', health: 'online', uptime: '14d 07h 22m', lastUpdated: now },
  metrics: { cpu: 37, cores: [31, 42, 29, 46], ramUsed: 4.3, ramTotal: 8, temperature: 48, frequency: '1.80 GHz', diskUsed: 39.7, diskTotal: 64, download: '18.4 Mbps', upload: '4.2 Mbps' },
  power: { watts: 6.8, averageWatts: 6.4, peakWatts: 8.1, minimumWatts: 5.7, voltage: null, current: null, energyKwh: null, history: chart(6.5, 1.1), source: 'mock' },
  requests: { perSecond: 3.1, perMinute: 184, perHour: 10_824, total: '2.84M', methods: { GET: 82, POST: 12, PUT: 3, DELETE: 1, Other: 2 }, statuses: { '2xx': 91, '3xx': 5, '4xx': 3, '5xx': 1 }, averageResponse: '124 ms', maxResponse: '842 ms', inbound: '1.8 GB', outbound: '14.2 GB', endpoints: [{ path: '/api/games', requests: '42.8k', response: '112 ms' }, { path: '/', requests: '31.2k', response: '86 ms' }, { path: '/api/auth', requests: '18.1k', response: '154 ms' }, { path: '/assets/*', requests: '13.7k', response: '42 ms' }], history: chart(150, 55) },
  errors: { total: 37, statuses: { '400': 6, '401': 4, '403': 2, '404': 14, '429': 1, '500': 7, '502': 2, '503': 1, Other: 0 }, history: chart(3, 2) },
  docker: [
    { id: 'nginx', name: 'nginx', status: 'running', cpu: 8, ram: '120 MB', network: '1.4 GB', uptime: '14d 07h', restarts: 0 },
    { id: 'web', name: 'web-app', status: 'running', cpu: 21, ram: '340 MB', network: '12.1 GB', uptime: '3d 12h', restarts: 2 },
    { id: 'database', name: 'database', status: 'running', cpu: 6, ram: '510 MB', network: '940 MB', uptime: '14d 07h', restarts: 0 },
    { id: 'worker', name: 'jobs-worker', status: 'running', cpu: 3, ram: '84 MB', network: '182 MB', uptime: '7d 02h', restarts: 1 },
    { id: 'watchtower', name: 'watchtower', status: 'running', cpu: 1, ram: '36 MB', network: '24 MB', uptime: '14d 07h', restarts: 0 },
  ],
  nginx: { health: 'online', uptime: '14d 07h', requests: '2.84M', active: 12, reading: 0, writing: 3, waiting: 9, errors: 10, responseTime: '124 ms', history: chart(175, 50) },
  events: [
    { id: 'event1', title: 'Scheduled health check passed', detail: 'All monitored services responding normally.', timestamp: '2 min ago', level: 'info' },
    { id: 'event2', title: 'Elevated HTTP 500 rate', detail: '7 responses in the selected time window.', timestamp: '18 min ago', level: 'warning' },
    { id: 'event3', title: 'web-app container restarted', detail: 'Restart count changed to 2.', timestamp: '3h ago', level: 'warning' },
  ],
};

export const logsMock: LogEntry[] = [
  { id: 'l1', timestamp: '2026-09-09 14:22:16.492', level: 'INFO', service: 'nginx', origin: 'access', message: 'GET /api/games 200 112ms', detail: 'request_id=3d8b9b remote_addr=10.0.0.14' },
  { id: 'l2', timestamp: '2026-09-09 14:21:58.031', level: 'ERROR', service: 'web-app', origin: 'api', message: 'Database connection timed out', detail: 'pool=primary timeout=5000ms operation=load-games' },
  { id: 'l3', timestamp: '2026-09-09 14:19:10.884', level: 'WARNING', service: 'docker', origin: 'daemon', message: 'Container web-app restarted (exit code 1)' },
  { id: 'l4', timestamp: '2026-09-09 14:15:43.102', level: 'INFO', service: 'system', origin: 'healthcheck', message: 'CPU temperature: 48.2°C' },
  { id: 'l5', timestamp: '2026-09-09 14:12:03.740', level: 'CRITICAL', service: 'nginx', origin: 'error', message: 'upstream prematurely closed connection', detail: 'upstream=web-app status=502' },
  { id: 'l6', timestamp: '2026-09-09 14:08:17.201', level: 'INFO', service: 'web-app', origin: 'api', message: 'POST /api/auth 201 154ms' },
];

export const alertsMock: Alert[] = [
  { id: 'a1', level: 'critical', title: 'NGINX returned 502 errors', description: '2 errors detected during the last 15 minutes.', timestamp: 'Today, 14:12', read: false },
  { id: 'a2', level: 'warning', title: 'Container restarted', description: 'web-app was restarted unexpectedly. Reason not provided by API.', timestamp: 'Today, 14:19', read: false },
  { id: 'a3', level: 'info', title: 'Health check restored', description: 'Monitoring API connection is available.', timestamp: 'Today, 13:45', read: true },
];

export const recentErrors = [
  ['14:12:03', 'GET', '/api/games', '502', '481 ms', 'Upstream connection closed'],
  ['14:21:58', 'POST', '/api/auth', '500', '842 ms', 'Database connection timed out'],
  ['13:42:19', 'GET', '/api/users/87', '404', '28 ms', 'Resource not found'],
];

export const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export const getRequestsMock = (): RequestStatistics => clone(dashboardMock.requests);
export const getErrorsMock = (): ErrorStatistics => clone(dashboardMock.errors);
