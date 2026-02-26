import { describe, it, expect, beforeEach } from "vitest";
import {
  hasPermission,
  hasRole,
  requirePermission,
  requireRole,
  requireAdmin,
  requireBranchAccess,
  ROLE_PERMISSIONS,
} from "./auth";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

describe("Role-Based Access Control", () => {
  describe("hasPermission", () => {
    it("should return true for admin with any permission", () => {
      expect(hasPermission("admin", "products", "view")).toBe(true);
      expect(hasPermission("admin", "products", "edit")).toBe(true);
      expect(hasPermission("admin", "products", "delete")).toBe(true);
      expect(hasPermission("admin", "products", "create")).toBe(true);
    });

    it("should return true for manager with allowed permissions", () => {
      expect(hasPermission("manager", "products", "view")).toBe(true);
      expect(hasPermission("manager", "products", "edit")).toBe(true);
      expect(hasPermission("manager", "products", "create")).toBe(true);
    });

    it("should return false for cashier with edit permission", () => {
      expect(hasPermission("cashier", "products", "edit")).toBe(false);
      expect(hasPermission("cashier", "products", "delete")).toBe(false);
    });

    it("should return true for cashier with view permission", () => {
      expect(hasPermission("cashier", "products", "view")).toBe(true);
    });

    it("should return true for cashier with transaction create permission", () => {
      expect(hasPermission("cashier", "transactions", "create")).toBe(true);
    });

    it("should return false for warehouse_staff with settings edit", () => {
      expect(hasPermission("warehouse_staff", "settings", "edit")).toBe(false);
    });

    it("should return true for warehouse_staff with products view", () => {
      expect(hasPermission("warehouse_staff", "products", "view")).toBe(true);
    });
  });

  describe("hasRole", () => {
    it("should return true if user role is in allowed roles", () => {
      expect(hasRole("admin", ["admin", "manager"])).toBe(true);
      expect(hasRole("manager", ["admin", "manager"])).toBe(true);
    });

    it("should return false if user role is not in allowed roles", () => {
      expect(hasRole("cashier", ["admin", "manager"])).toBe(false);
      expect(hasRole("warehouse_staff", ["admin"])).toBe(false);
    });
  });

  describe("requirePermission", () => {
    const createContext = (role: string) => ({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: role as any,
        loginMethod: "oauth",
        branchId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { headers: {} } as any,
      res: {} as any,
    }) as TrpcContext;

    it("should not throw for admin with any permission", () => {
      const ctx = createContext("admin");
      expect(() => requirePermission(ctx, "products", "delete")).not.toThrow();
    });

    it("should throw for cashier without edit permission", () => {
      const ctx = createContext("cashier");
      expect(() => requirePermission(ctx, "products", "edit")).toThrow(TRPCError);
    });

    it("should throw for user without authentication", () => {
      const ctx = { user: null, req: {}, res: {} } as TrpcContext;
      expect(() => requirePermission(ctx, "products", "view")).toThrow(TRPCError);
    });
  });

  describe("requireRole", () => {
    const createContext = (role: string) => ({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: role as any,
        loginMethod: "oauth",
        branchId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { headers: {} } as any,
      res: {} as any,
    }) as TrpcContext;

    it("should not throw for admin in allowed roles", () => {
      const ctx = createContext("admin");
      expect(() => requireRole(ctx, ["admin", "manager"])).not.toThrow();
    });

    it("should throw for cashier not in allowed roles", () => {
      const ctx = createContext("cashier");
      expect(() => requireRole(ctx, ["admin", "manager"])).toThrow(TRPCError);
    });
  });

  describe("requireAdmin", () => {
    const createContext = (role: string) => ({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: role as any,
        loginMethod: "oauth",
        branchId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { headers: {} } as any,
      res: {} as any,
    }) as TrpcContext;

    it("should not throw for admin", () => {
      const ctx = createContext("admin");
      expect(() => requireAdmin(ctx)).not.toThrow();
    });

    it("should throw for non-admin roles", () => {
      expect(() => requireAdmin(createContext("manager"))).toThrow(TRPCError);
      expect(() => requireAdmin(createContext("cashier"))).toThrow(TRPCError);
    });
  });

  describe("requireBranchAccess", () => {
    const createContext = (role: string, branchId: number) => ({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: role as any,
        loginMethod: "oauth",
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { headers: {} } as any,
      res: {} as any,
    }) as TrpcContext;

    it("should allow admin to access any branch", () => {
      const ctx = createContext("admin", 1);
      expect(() => requireBranchAccess(ctx, 999)).not.toThrow();
    });

    it("should allow user to access their own branch", () => {
      const ctx = createContext("manager", 1);
      expect(() => requireBranchAccess(ctx, 1)).not.toThrow();
    });

    it("should throw when user tries to access different branch", () => {
      const ctx = createContext("manager", 1);
      expect(() => requireBranchAccess(ctx, 2)).toThrow(TRPCError);
    });
  });

  describe("ROLE_PERMISSIONS structure", () => {
    it("should have all required roles", () => {
      expect(ROLE_PERMISSIONS).toHaveProperty("admin");
      expect(ROLE_PERMISSIONS).toHaveProperty("manager");
      expect(ROLE_PERMISSIONS).toHaveProperty("cashier");
      expect(ROLE_PERMISSIONS).toHaveProperty("warehouse_staff");
      expect(ROLE_PERMISSIONS).toHaveProperty("user");
    });

    it("should have all required resources", () => {
      const resources = ["users", "products", "branches", "transactions", "reports", "settings", "audit"];
      resources.forEach((resource) => {
        expect(ROLE_PERMISSIONS.admin).toHaveProperty(resource);
      });
    });

    it("admin should have all permissions for most resources", () => {
      // Admin has full CRUD for most resources
      expect(ROLE_PERMISSIONS.admin.users).toContain("view");
      expect(ROLE_PERMISSIONS.admin.users).toContain("edit");
      expect(ROLE_PERMISSIONS.admin.users).toContain("delete");
      expect(ROLE_PERMISSIONS.admin.users).toContain("create");
      
      expect(ROLE_PERMISSIONS.admin.products).toContain("view");
      expect(ROLE_PERMISSIONS.admin.products).toContain("edit");
      expect(ROLE_PERMISSIONS.admin.products).toContain("delete");
      expect(ROLE_PERMISSIONS.admin.products).toContain("create");
    });

    it("user should have minimal or no permissions", () => {
      // User role should have no permissions for critical resources
      expect(ROLE_PERMISSIONS.user.users).toHaveLength(0);
      expect(ROLE_PERMISSIONS.user.products).toHaveLength(0);
      expect(ROLE_PERMISSIONS.user.transactions).toHaveLength(0);
    });
  });
});
