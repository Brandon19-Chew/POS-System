import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

/**
 * Role-based permission definitions
 */
export const ROLE_PERMISSIONS = {
  admin: {
    users: ["view", "edit", "delete", "create"],
    products: ["view", "edit", "delete", "create"],
    branches: ["view", "edit", "delete", "create"],
    transactions: ["view", "edit", "delete", "create"],
    reports: ["view", "export"],
    settings: ["view", "edit"],
    audit: ["view"],
  },
  manager: {
    users: ["view"],
    products: ["view", "edit", "create"],
    branches: ["view"],
    transactions: ["view"],
    reports: ["view", "export"],
    settings: ["view"],
    audit: ["view"],
  },
  cashier: {
    users: [],
    products: ["view"],
    branches: ["view"],
    transactions: ["view", "create"],
    reports: [],
    settings: [],
    audit: [],
  },
  warehouse_staff: {
    users: [],
    products: ["view"],
    branches: ["view"],
    transactions: ["view"],
    reports: ["view"],
    settings: [],
    audit: [],
  },
  user: {
    users: [],
    products: [],
    branches: [],
    transactions: [],
    reports: [],
    settings: [],
    audit: [],
  },
} as const;

export type UserRole = keyof typeof ROLE_PERMISSIONS;
export type ResourceType = keyof typeof ROLE_PERMISSIONS.admin;
export type PermissionType = "view" | "edit" | "delete" | "create" | "export";

/**
 * Check if user has permission for a resource
 */
export function hasPermission(
  role: UserRole,
  resource: ResourceType,
  permission: PermissionType
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;
  
  const resourcePerms = (rolePerms as unknown as Record<string, PermissionType[]>)[resource];
  if (!resourcePerms) return false;
  
  return resourcePerms.includes(permission);
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Verify user has permission or throw error
 */
export function requirePermission(
  ctx: TrpcContext,
  resource: ResourceType,
  permission: PermissionType
): void {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!hasPermission(ctx.user.role as UserRole, resource, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `User does not have ${permission} permission for ${resource}`,
    });
  }
}

/**
 * Verify user has one of the specified roles or throw error
 */
export function requireRole(ctx: TrpcContext, allowedRoles: UserRole[]): void {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!hasRole(ctx.user.role as UserRole, allowedRoles)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `User role not authorized. Allowed roles: ${allowedRoles.join(", ")}`,
    });
  }
}

/**
 * Verify user is admin or throw error
 */
export function requireAdmin(ctx: TrpcContext): void {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
}

/**
 * Verify user has branch access
 */
export function requireBranchAccess(ctx: TrpcContext, branchId: number): void {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Admin can access any branch
  if (ctx.user.role === "admin") {
    return;
  }

  // Other roles must have matching branchId
  if (ctx.user.branchId !== branchId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User does not have access to this branch",
    });
  }
}
