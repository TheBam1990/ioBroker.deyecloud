"use strict";

const crypto = require("node:crypto");
const utils = require("@iobroker/adapter-core");

const BASE_URLS = {
  eu: "https://eu1-developer.deyecloud.com",
  us: "https://us1-developer.deyecloud.com",
  india: "https://india-developer.deyecloud.com",
};

class DeyeCloudAdapter extends utils.Adapter {
  constructor(options = {}) {
    super({ ...options, name: "deyecloud" });
    this.accessToken = "";
    this.tokenValidUntil = 0;
    this.pollTimer = null;
    this.running = false;
    this.on("ready", () => this.onReady());
    this.on("unload", callback => this.onUnload(callback));
  }

  async onReady() {
    this.config.pollInterval = Math.max(Number(this.config.pollInterval) || 300, 60);
    await this.setStateAsync("info.connection", false, true);
    await this.setStateAsync("info.lastError", "", true);
    const missing = ["appId", "appSecret", "account", "password"].filter(key => !String(this.config[key] || "").trim());
    if (missing.length) {
      await this.setError(`Missing configuration: ${missing.join(", ")}`);
      return;
    }
    await this.updateAll();
    this.pollTimer = this.setInterval(() => void this.updateAll(), this.config.pollInterval * 1000);
  }

  get baseUrl() {
    return BASE_URLS[this.config.dataCenter] || BASE_URLS.eu;
  }

  async login() {
    const body = {
      appSecret: String(this.config.appSecret),
      password: crypto.createHash("sha256").update(String(this.config.password)).digest("hex"),
    };
    const loginType = ["email", "username", "mobile"].includes(this.config.loginType) ? this.config.loginType : "email";
    body[loginType] = String(this.config.account).trim();
    if (loginType === "mobile") body.countryCode = String(this.config.countryCode || "49").replace(/^\+/, "");
    if (String(this.config.companyId || "").trim()) body.companyId = Number(this.config.companyId);
    const result = await this.request(`/v1.0/account/token?appId=${encodeURIComponent(this.config.appId)}`, body, false);
    if (!result.accessToken) throw new Error("DeyeCloud did not return an access token");
    this.accessToken = result.accessToken;
    const expires = Math.max(Number(result.expiresIn) || 3600, 300);
    this.tokenValidUntil = Date.now() + (expires - 120) * 1000;
  }

  async request(path, body, authenticated = true) {
    if (authenticated && (!this.accessToken || Date.now() >= this.tokenValidUntil)) await this.login();
    const controller = new AbortController();
    const timeout = this.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(authenticated ? { authorization: `Bearer ${this.accessToken}` } : {}),
        },
        body: JSON.stringify(body || {}),
        signal: controller.signal,
      });
      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(`Invalid JSON response from ${path} (${response.status})`); }
      if (!response.ok || data.success === false) {
        if (authenticated && response.status === 401) { this.accessToken = ""; this.tokenValidUntil = 0; }
        throw new Error(`DeyeCloud ${path}: ${data.msg || data.message || response.statusText || response.status}`);
      }
      return data;
    } finally {
      this.clearTimeout(timeout);
    }
  }

  async updateAll() {
    if (this.running) return;
    this.running = true;
    try {
      const stations = await this.loadStations();
      const stationIds = [];
      for (const station of stations) {
        const id = station.id ?? station.stationId;
        if (id === undefined || id === null) continue;
        stationIds.push(Number(id));
        await this.writeTree(`stations.${this.safeId(id)}.info`, station);
        const latest = await this.request("/v1.0/station/latest", { stationId: Number(id) });
        await this.writeTree(`stations.${this.safeId(id)}.latest`, this.unwrap(latest));
      }
      const devices = await this.loadDevices(stationIds);
      for (const device of devices) {
        const sn = device.deviceSn ?? device.sn ?? device.deviceSN;
        if (sn === undefined || sn === null) continue;
        await this.writeTree(`devices.${this.safeId(sn)}.info`, device);
      }
      const serials = devices.map(d => d.deviceSn ?? d.sn ?? d.deviceSN).filter(Boolean).map(String);
      for (let index = 0; index < serials.length; index += 10) {
        const latest = await this.request("/v1.0/device/latest", { deviceList: serials.slice(index, index + 10) });
        const rows = this.asArray(this.unwrap(latest));
        for (const row of rows) {
          const sn = row.deviceSn ?? row.sn ?? row.deviceSN;
          if (sn) await this.writeTree(`devices.${this.safeId(sn)}.latest`, row);
        }
      }
      await this.setStateAsync("info.connection", true, true);
      await this.setStateAsync("info.lastError", "", true);
      await this.setStateAsync("info.lastUpdate", new Date().toISOString(), true);
      this.log.info(`Updated ${stations.length} station(s) and ${devices.length} device(s)`);
    } catch (error) {
      await this.setStateAsync("info.connection", false, true);
      await this.setError(error instanceof Error ? error.message : String(error));
    } finally {
      this.running = false;
    }
  }

  async loadStations() {
    const all = [];
    for (let page = 1; page <= 100; page++) {
      const response = await this.request("/v1.0/station/list", { page, size: 200 });
      const rows = this.asArray(this.unwrap(response));
      all.push(...rows);
      if (rows.length < 200) break;
    }
    return all;
  }

  async loadDevices(stationIds) {
    const all = [];
    for (let offset = 0; offset < stationIds.length; offset += 10) {
      const ids = stationIds.slice(offset, offset + 10);
      for (let page = 1; page <= 100; page++) {
        const response = await this.request("/v1.0/station/device", { stationIds: ids, page, size: 200 });
        const rows = this.asArray(this.unwrap(response));
        all.push(...rows);
        if (rows.length < 200) break;
      }
    }
    return all;
  }

  unwrap(value) {
    for (const key of ["data", "result"]) if (value && value[key] !== undefined) return value[key];
    return value;
  }

  asArray(value) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    for (const key of ["list", "stationList", "deviceList", "records", "items", "rows"]) if (Array.isArray(value[key])) return value[key];
    for (const nested of Object.values(value)) if (Array.isArray(nested)) return nested;
    return [];
  }

  safeId(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  async writeTree(base, value, depth = 0) {
    if (depth > 8) return;
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) await this.writeTree(`${base}.${i}`, value[i], depth + 1);
      return;
    }
    if (typeof value === "object") {
      if (Object.prototype.hasOwnProperty.call(value, "value") && (typeof value.value !== "object" || value.value === null)) {
        await this.writeValue(base, value.value, value.unit, value.name || value.key || base.split(".").at(-1));
        for (const [key, nested] of Object.entries(value)) if (!["value", "unit"].includes(key)) await this.writeTree(`${base}.${this.safeId(key)}`, nested, depth + 1);
        return;
      }
      for (const [key, nested] of Object.entries(value)) await this.writeTree(`${base}.${this.safeId(key)}`, nested, depth + 1);
      return;
    }
    await this.writeValue(base, value, undefined, base.split(".").at(-1));
  }

  async writeValue(id, value, unit, name) {
    const type = typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string";
    const role = type === "number" ? "value" : type === "boolean" ? "indicator" : "text";
    await this.extendObjectAsync(id, { type: "state", common: { name: String(name || id), type, role, read: true, write: false, ...(unit ? { unit: String(unit) } : {}) }, native: {} });
    await this.setStateAsync(id, type === "string" ? String(value) : value, true);
  }

  async setError(message) {
    this.log.error(message);
    await this.setStateAsync("info.lastError", message, true);
  }

  onUnload(callback) {
    if (this.pollTimer) this.clearInterval(this.pollTimer);
    callback();
  }
}

if (require.main !== module) module.exports = options => new DeyeCloudAdapter(options);
else new DeyeCloudAdapter();
