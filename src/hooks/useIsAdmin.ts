
import { useAuth } from "./useAuth";

export const useIsAdmin = () => {
  const { role, profile } = useAuth();
  
  const isAdmin = role === "admin" || role === "director" || role === "center_director";
  const isGlobalAdmin = (role === "admin" || role === "center_director") && profile?.scope === "global";
  const isDistrictAdmin = isAdmin && profile?.scope === "district";
  const isSchoolAdmin = isAdmin && profile?.scope === "school";
  
  return {
    isAdmin,
    isGlobalAdmin,
    isDistrictAdmin,
    isSchoolAdmin,
    scope: profile?.scope,
    districtId: profile?.district_id,
    schoolId: profile?.school_id,
  };
};
