import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";

export type Permission =
  | "customers:view" | "customers:create" | "customers:edit" | "customers:delete"
  | "requests:view" | "requests:create" | "requests:edit" | "requests:delete"
  | "contracts:view" | "contracts:create" | "contracts:edit" | "contracts:delete"
  | "employees:view" | "employees:create" | "employees:edit" | "employees:delete"
  | "entities:view" | "entities:create" | "entities:edit" | "entities:delete"
  | "dashboard:view"
  | "calculator:view"
  | "settings:view" | "settings:edit";

export type Role = "admin" | "manager" | "employee" | "viewer";

interface PermissionsContextType {
  role: Role;
  permissions: Permission[];
  hiddenPages: Set<string>;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [role, setRole] = useState<Role>("viewer");
  const [hiddenPages, setHiddenPages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.get<{ role: Role; permissions: Permission[]; hiddenPages?: string }>("/api/me/permissions");
        console.log("Permissions loaded:", data);
        setRole(data.role);
        setPermissions(data.permissions);
        setHiddenPages(new Set((data.hiddenPages || "").split(",").filter(Boolean)));
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        // Fallback: If user exists, give them basic permissions based on role from session
        const userRole = (session.user as { role?: string }).role as Role || "viewer";
        setRole(userRole);
        // Grant all permissions for admin as fallback
        if (userRole === "admin") {
          setPermissions([
            "customers:view", "customers:create", "customers:edit", "customers:delete",
            "requests:view", "requests:create", "requests:edit", "requests:delete",
            "contracts:view", "contracts:create", "contracts:edit", "contracts:delete",
            "employees:view", "employees:create", "employees:edit", "employees:delete",
            "entities:view", "entities:create", "entities:edit", "entities:delete",
            "dashboard:view", "calculator:view", "settings:view", "settings:edit",
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchPermissions();
  }, [session?.user]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const canAccess = (resource: string, action: string): boolean => {
    const permission = `${resource}:${action}` as Permission;
    return hasPermission(permission);
  };

  return (
    <PermissionsContext.Provider value={{ role, permissions, hiddenPages, hasPermission, canAccess, isLoading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}

// Component to conditionally render based on permissions
export function Can({
  permission,
  children,
  fallback = null
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!hasPermission(permission)) return fallback;

  return <>{children}</>;
}

// Component to conditionally render based on resource/action
export function CanAccess({
  resource,
  action,
  children,
  fallback = null
}: {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { canAccess, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!canAccess(resource, action)) return fallback;

  return <>{children}</>;
}
