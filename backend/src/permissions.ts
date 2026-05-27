// Role-based permissions configuration
// admin: Full access to everything
// manager: Can view/edit/delete everything except employees management
// employee: Can view/edit customers, requests, contracts (not delete)
// viewer: Read-only access

export type Role = "admin" | "manager" | "employee" | "viewer";

export type Permission =
  | "customers:view" | "customers:create" | "customers:edit" | "customers:delete"
  | "requests:view" | "requests:create" | "requests:edit" | "requests:delete"
  | "contracts:view" | "contracts:create" | "contracts:edit" | "contracts:delete"
  | "employees:view" | "employees:create" | "employees:edit" | "employees:delete"
  | "entities:view" | "entities:create" | "entities:edit" | "entities:delete"
  | "dashboard:view"
  | "calculator:view"
  | "settings:view" | "settings:edit";

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "customers:view", "customers:create", "customers:edit", "customers:delete",
    "requests:view", "requests:create", "requests:edit", "requests:delete",
    "contracts:view", "contracts:create", "contracts:edit", "contracts:delete",
    "employees:view", "employees:create", "employees:edit", "employees:delete",
    "entities:view", "entities:create", "entities:edit", "entities:delete",
    "dashboard:view",
    "calculator:view",
    "settings:view", "settings:edit",
  ],
  manager: [
    "customers:view", "customers:create", "customers:edit", "customers:delete",
    "requests:view", "requests:create", "requests:edit", "requests:delete",
    "contracts:view", "contracts:create", "contracts:edit", "contracts:delete",
    "employees:view", "employees:edit", "employees:delete", // Can manage employees
    "entities:view", "entities:create", "entities:edit",
    "dashboard:view",
    "calculator:view",
    "settings:view",
  ],
  employee: [
    "customers:view", "customers:create", "customers:edit",
    "requests:view", "requests:create", "requests:edit",
    "contracts:view", "contracts:create", "contracts:edit",
    "employees:view",
    "entities:view",
    "dashboard:view",
    "calculator:view",
  ],
  viewer: [
    "customers:view",
    "requests:view",
    "contracts:view",
    "employees:view",
    "entities:view",
    "dashboard:view",
    "calculator:view",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

export function canAccess(role: Role, resource: string, action: string): boolean {
  const permission = `${resource}:${action}` as Permission;
  return hasPermission(role, permission);
}
