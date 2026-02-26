import { describe, it, expect } from "vitest";
import {
  getSystemSettings,
  updateSystemSettings,
  logAuditEvent,
  getAuditLogs,
  getAuditLogStats,
  createSystemBackup,
  getBackupHistory,
  getSystemHealth,
  exportSettingsAsJSON,
  importSettingsFromJSON,
} from "./db-settings";

describe("System Settings & Configuration", () => {
  describe("System Settings", () => {
    it("should get system settings", async () => {
      const settings = await getSystemSettings();
      // Settings may or may not exist initially
      if (settings) {
        expect(settings).toBeDefined();
        expect(settings.id).toBeDefined();
      }
    });

    it("should update system settings", async () => {
      const updates = {
        taxRate: 10,
        taxName: "GST",
        currencyCode: "SGD",
        currencySymbol: "S$",
        timezone: "Asia/Singapore",
        businessName: "Test Business",
      };

      const result = await updateSystemSettings(updates);
      expect(result).toBeDefined();
    });
  });

  describe("Audit Logging", () => {
    it("should log audit event", async () => {
      const result = await logAuditEvent(
        1,
        "CREATE",
        "PRODUCT",
        123,
        { name: "Test Product" },
        "127.0.0.1"
      );
      expect(result).toBeDefined();
    });

    it("should get audit logs", async () => {
      const logs = await getAuditLogs(10, 0);
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should get audit log stats", async () => {
      const stats = await getAuditLogStats();
      if (stats) {
        expect(stats.totalLogs).toBeGreaterThanOrEqual(0);
        expect(stats.actionStats).toBeDefined();
        expect(stats.entityStats).toBeDefined();
        expect(stats.userStats).toBeDefined();
      }
    });
  });

  describe("Backup & Restore", () => {
    it("should create system backup", async () => {
      const backup = await createSystemBackup();
      expect(backup).toBeDefined();
      expect(backup?.backupId).toBeDefined();
      expect(backup?.status).toBe("completed");
    });

    it("should get backup history", async () => {
      const history = await getBackupHistory();
      expect(Array.isArray(history)).toBe(true);
      if (history.length > 0) {
        expect(history[0].backupId).toBeDefined();
        expect(history[0].timestamp).toBeDefined();
        expect(history[0].status).toBe("completed");
      }
    });
  });

  describe("System Health", () => {
    it("should get system health", async () => {
      const health = await getSystemHealth();
      expect(health).toBeDefined();
      expect(health?.status).toBeDefined();
      expect(health?.database).toBeDefined();
    });
  });

  describe("Export/Import", () => {
    it("should export settings as JSON", async () => {
      const exported = await exportSettingsAsJSON();
      expect(exported).toBeDefined();
      expect(exported.exportDate).toBeDefined();
      expect(exported.version).toBe("1.0");
    });

    it("should import settings from JSON", async () => {
      const data = {
        settings: {
          taxRate: 15,
          currencyCode: "USD",
        },
        exportDate: new Date().toISOString(),
        version: "1.0",
      };

      const result = await importSettingsFromJSON(data);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should handle invalid import data", async () => {
      const result = await importSettingsFromJSON({ invalid: "data" });
      expect(result.success).toBe(false);
    });
  });
});
