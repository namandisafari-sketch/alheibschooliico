import { useAuth } from "./useAuth";
import type { PermissionKey } from "@/lib/roleConfig";

export const usePermission = (key: PermissionKey | string): boolean => {
  const { permissions, role } = useAuth();
  if (role === "admin" || role === "center_director") return true;
  return permissions.includes(key);
};
