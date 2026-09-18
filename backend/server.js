"use strict";

/**
 * Local monitoring API for Pi Command Center.
 *
 * It is deliberately self-contained: it can run on a development host or be
 * deployed beside a future collector. Commands are audited and queued, never
 * executed by default. See README before enabling a production command runner.
 */
const http = require("node:http");
const os = require("node:os");
const crypto = require("node:crypto");
const { createStorageService, storageError } = require("./storage");
const storage = createStorageService({ roots: JSON.parse(process.env.MONITOR_STORAGE_ROOTS || "[]") });

const PORT = Number(process.env.MONITOR_API_PORT || 8787);
const API_KEY = process.env.MONITOR_API_KEY || "";
const startedAt = Date.now();
const commands = [];
const alerts = [
  { id: "api-ready", level: "info", title: "Monitoring API started", description: "The local monitoring API is ready to receive the mobile client.", timestamp: new Date().toISOString(), read: false },
];
const logs = [];
const point = (base, variance, index) => Math.max(1, Math.round(base + Math.sin(index * 0.72) * variance + ((index * 13) % 9)));
const history = (base, variance) => Array.from({ length: 20 }, (_, index) => point(base, variance, index));
const formatDuration = (ms) => {
  const totalMinutes = Math.floor(ms / 60_000); const days = Math.floor(totalMinutes / 1440); const hours = Math.floor((totalMinutes % 1440) / 60); const minutes = totalMinutes % 60;
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
};
const pushLog = (level, service, origin, message, detail) => {
  logs.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString().replace("T", " ").replace("Z", ""), level, service, origin, message, detail });
  if (logs.length > 200) logs.pop();
};
pushLog("INFO", "monitor-api", "bootstrap", "Monitoring API initialized");

function dashboard() {
  const cpus = os.cpus();
  const loads = os.loadavg();
  const cpu = cpus.length ? Math.min(100, Math.round((loads[0] / cpus.length) * 100)) : 0;
  const total = os.totalmem() / 1024 ** 3;
  const used = (os.totalmem() - os.freemem()) / 1024 ** 3;
  const network = os.networkInterfaces();
  const primaryAddress = Object.values(network).flat().find((entry) => entry && entry.family === "IPv4" && !entry.internal)?.address || "127.0.0.1";
  const onlineContainers = [];
  return {
    server: { name: process.env.MONITOR_SERVER_NAME || os.hostname(), host: primaryAddress, health: "online", uptime: formatDuration(os.uptime() * 1000), lastUpdated: new Date().toISOString() },
    metrics: { cpu, cores: cpus.map((_, index) => Math.min(100, Math.max(1, cpu + ((index * 11) % 19) - 8))), ramUsed: Number(used.toFixed(1)), ramTotal: Number(total.toFixed(1)), temperature: null, frequency: cpus[0] && cpus[0].speed ? `${(cpus[0].speed / 1000).toFixed(2)} GHz` : "N/A", diskUsed: null, diskTotal: null, download: "N/A", upload: "N/A" },
    power: { watts: null, averageWatts: null, peakWatts: null, minimumWatts: null, voltage: null, current: null, energyKwh: null, history: history(6, 1), source: "unavailable" },
    requests: { perSecond: 0, perMinute: 0, perHour: 0, total: "0", methods: { GET: 0, POST: 0, PUT: 0, DELETE: 0, Other: 0 }, statuses: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 }, averageResponse: "N/A", maxResponse: "N/A", inbound: "N/A", outbound: "N/A", endpoints: [], history: history(1, 1) },
    errors: { total: 0, statuses: { "400": 0, "401": 0, "403": 0, "404": 0, "429": 0, "500": 0, "502": 0, "503": 0, Other: 0 }, history: history(1, 1) },
    docker: onlineContainers,
    nginx: { health: "offline", uptime: "N/A", requests: "0", active: 0, reading: 0, writing: 0, waiting: 0, errors: 0, responseTime: "N/A", history: history(1, 1) },
    events: [{ id: "host-data", title: "Host telemetry sampled", detail: "CPU, memory, uptime and host identity are live from this API process.", timestamp: "just now", level: "info" }],
  };
}
function json(response, status, payload) { response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization" }); response.end(JSON.stringify(payload)); }
function requireAuth(request, response) { if (!API_KEY || request.headers.authorization === `Bearer ${API_KEY}`) return true; json(response, 401, { error: "Unauthorized" }); return false; }
function readJson(request) { return new Promise((resolve, reject) => { let body = ""; request.on("data", (chunk) => { body += chunk; if (body.length > 65_536) request.destroy(); }); request.on("end", () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error("Invalid JSON")); } }); request.on("error", reject); }); }

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return json(response, 204, {});
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const path = url.pathname.replace(/^\/api/, "") || "/";
  if (path === "/health" && request.method === "GET") return json(response, 200, { status: "ok", uptime: formatDuration(Date.now() - startedAt), commandExecution: "disabled" });
  // File browsing is never exposed by the unauthenticated development API.
  if (path.startsWith('/mobile/storage/')) {
    if (!API_KEY) return json(response, 503, { error: 'Configura autenticación antes de habilitar Storage.' });
    if (!requireAuth(request, response)) return;
    if (request.method !== 'GET') return json(response, 405, { error: 'Storage es de solo lectura.' });
    try {
      const volume = url.searchParams.get('volume');
      const relative = url.searchParams.get('path') || '';
      if (path === '/mobile/storage/disks') return json(response, 200, await storage.disks());
      if (path === '/mobile/storage/directory') return json(response, 200, await storage.directory(volume, relative, Number(url.searchParams.get('offset') || 0)));
      if (path === '/mobile/storage/file') return json(response, 200, await storage.file(volume, relative));
      return json(response, 404, { error: 'Endpoint not found' });
    } catch (error) { const result = storageError(error); return json(response, result.status, { error: result.error }); }
  }
  if (!requireAuth(request, response)) return;
  if (path === "/dashboard" && request.method === "GET") return json(response, 200, dashboard());
  if (path === "/logs" && request.method === "GET") return json(response, 200, logs);
  if (path === "/alerts" && request.method === "GET") return json(response, 200, alerts);
  if (path === "/commands" && request.method === "GET") return json(response, 200, commands);
  if (path === "/commands" && request.method === "POST") {
    try {
      const command = await readJson(request);
      const allowedTargets = ["raspberry", "nginx", "docker", "service"];
      const allowedActions = ["restart", "shutdown", "reload", "start", "stop"];
      if (!allowedTargets.includes(command.target) || !allowedActions.includes(command.action) || typeof command.label !== "string") return json(response, 400, { error: "Unsupported remote command" });
      const queued = { id: crypto.randomUUID(), ...command, status: "queued", createdAt: new Date().toISOString() };
      commands.unshift(queued); pushLog("WARNING", "remote-control", "api", `Command queued: ${command.label}`, `command_id=${queued.id}`);
      alerts.unshift({ id: crypto.randomUUID(), level: "warning", title: "Remote command queued", description: `${command.label} is awaiting an authorized executor.`, timestamp: new Date().toISOString(), read: false });
      return json(response, 202, { message: `${command.label} command queued successfully.`, command: queued });
    } catch { return json(response, 400, { error: "Invalid JSON body" }); }
  }
  return json(response, 404, { error: "Endpoint not found" });
});
server.listen(PORT, "0.0.0.0", () => console.log(`Pi Command Center API listening on http://0.0.0.0:${PORT}/api`));
