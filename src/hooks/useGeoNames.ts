
import { useQuery } from "@tanstack/react-query";

const GEONAMES_USER = "JAGONIX";
const UGANDA_GEONAME_ID = "226074";

export interface GeoLocation {
  geonameId: number;
  name: string;
  adminName1?: string;
  fcode?: string;
}

export const useGeoRegions = () => {
  return useQuery({
    queryKey: ["geonames", "regions"],
    queryFn: async () => {
      const response = await fetch(
        `https://secure.geonames.org/childrenJSON?geonameId=${UGANDA_GEONAME_ID}&username=${GEONAMES_USER}`
      );
      const data = await response.json();
      return (data.geonames || []) as GeoLocation[];
    },
    staleTime: Infinity,
  });
};

export const useGeoDistricts = (regionId?: string | number) => {
  return useQuery({
    queryKey: ["geonames", "districts", regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const response = await fetch(
        `https://secure.geonames.org/childrenJSON?geonameId=${regionId}&username=${GEONAMES_USER}`
      );
      const data = await response.json();
      return (data.geonames || []) as GeoLocation[];
    },
    enabled: !!regionId,
    staleTime: Infinity,
  });
};

/**
 * Search specifically for Districts (ADM2) across all of Uganda
 */
export const useAllUgandaDistricts = () => {
  return useQuery({
    queryKey: ["geonames", "all-districts"],
    queryFn: async () => {
      // search for ADM2 in UG
      const response = await fetch(
        `https://secure.geonames.org/searchJSON?country=UG&featureCode=ADM2&maxRows=200&username=${GEONAMES_USER}`
      );
      const data = await response.json();
      return (data.geonames || []) as GeoLocation[];
    },
    staleTime: Infinity,
  });
};
