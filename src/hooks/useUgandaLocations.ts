import { useState, useEffect } from "react";

export function useUgandaLocations() {
  const [loading, setLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState<Record<string, Record<string, Record<string, string[]>>>>({});
  const [districtsMap, setDistrictsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        // Load data asynchronously to keep bundle size small and load on-demand
        const [hierarchyData, districtsData] = await Promise.all([
          import("@/data/uganda-locations/hierarchy.json"),
          import("@/data/uganda-locations/districts.json")
        ]);

        if (!active) return;

        // Build a quick lookup map for regions
        const regions: Record<string, string> = {};
        for (const item of districtsData.default) {
          regions[item.district_name.toUpperCase().trim()] = item.region_name;
        }

        setHierarchy(hierarchyData.default);
        setDistrictsMap(regions);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load Uganda geographical data:", err);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const getDistricts = () => {
    return Object.keys(hierarchy);
  };

  const getSubcounties = (district: string) => {
    if (!district) return [];
    const dUpper = district.toUpperCase().trim();
    return hierarchy[dUpper] ? Object.keys(hierarchy[dUpper]) : [];
  };

  const getParishes = (district: string, subcounty: string) => {
    if (!district || !subcounty) return [];
    const dUpper = district.toUpperCase().trim();
    const sUpper = subcounty.toUpperCase().trim();
    if (!hierarchy[dUpper] || !hierarchy[dUpper][sUpper]) return [];
    return Object.keys(hierarchy[dUpper][sUpper]);
  };

  const getVillages = (district: string, subcounty: string, parish: string) => {
    if (!district || !subcounty || !parish) return [];
    const dUpper = district.toUpperCase().trim();
    const sUpper = subcounty.toUpperCase().trim();
    const pUpper = parish.toUpperCase().trim();
    if (!hierarchy[dUpper] || !hierarchy[dUpper][sUpper] || !hierarchy[dUpper][sUpper][pUpper]) return [];
    return hierarchy[dUpper][sUpper][pUpper];
  };

  const getRegion = (district: string) => {
    if (!district) return "";
    return districtsMap[district.toUpperCase().trim()] || "";
  };

  return {
    loading,
    districts: getDistricts(),
    getSubcounties,
    getParishes,
    getVillages,
    getRegion
  };
}
