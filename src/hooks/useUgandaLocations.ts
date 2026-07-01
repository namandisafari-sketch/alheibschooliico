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
    
    // Village names are extracted from polling station data, which records the
    // polling station name/landmark at the leaf level (e.g. "BUNAMWAMBA POLLING
    // STATION", "ANINATA PRIMARY SCHOOL"). Polling stations are typically named
    // after the village they serve, so this heuristic strips facility-type
    // suffixes to recover the underlying village name.
    const raw = hierarchy[dUpper][sUpper][pUpper];

    const suffixPatterns = [
      / POLLING STATION\s*$/,
      / PRIMARY SCHOOL\s*$/,
      / RPIMARY SCHOOL\s*$/,
      / PRI\. SCHOOL\s*$/,
      / PRI\.SCH\.?\s*$/,
      / PRIMARY SCH\.?\s*$/,
      / P\/SCH(OOL)?\s*$/,
      / P\/S\s*$/,
      / P\.S\.?\s*$/,
      / CPS\s*$/,
      / P\.7 SCHOOL\s*$/,
      / P7 SCHOOL\s*$/,
      / PR SCH\.?\s*$/,
      / PRI SCH\.?\s*$/,
      / NURSERY SCHOOL\s*$/,
      / COMMUNITY SEN\.? SCHOOL\s*$/,
      / COMMUNITY SCHOOL\s*$/,
      / SECONDARY SCHOOL\s*$/,
      / SEC\. SCHOOL\s*$/,
      / S\.S\.S\.?\s*$/,
      / SCHOOL\s*$/,
      / TECHNICAL INSTITUTE\s*$/,
      / INSTITUTE\s*$/,
      / HEALTH CENTRE\s*$/,
      / HEALTH CENTER\s*$/,
      / H\/C\s*$/,
      / CATHOLIC CHURCH\s*$/,
      / CHURCH OF UGANDA\s*$/,
      / C\.O\.U\.?\s*$/,
      / MOSQUE\s*$/,
      / CHURCH\s*$/,
      / TRADING CENTRE\s*$/,
      / T\/C\s*$/,
      / T\.C\s*$/,
      / MARKET\s*$/,
      / PLAYGROUND\s*$/,
      / COMMUNITY CENTRE\s*$/,
      / COMMUNITY CENTER\s*$/,
      / POLICE BARRACKS\s*$/,
      / BARRACKS\s*$/,
      / BARRACK\s*$/,
      / CONTAINER\s*$/,
      / TOWN COUNCIL HQTRS\s*$/,
      / TOWN COUNCIL HEADQUARTERS\s*$/,
      / TOWN COUNCIL\s*$/,
      / SUBCOUNTY HQTRS\s*$/,
      / SUB-COUNTY HQTRS\s*$/,
      / SUBCOUNTY\s*$/,
      / SUB-COUNTY\s*$/,
      / HQTRS\s*$/,
      / HEADQUARTERS\s*$/,
      / CENTRE\s*$/,
      / CENTER\s*$/,
      / CENTRAL\s*$/,
      / BOARDING\s*$/,
      / STORE\s*$/,
      / HALL\s*$/,
      / COURT\s*$/,
      / OFFICE\s*$/,
      / BOYS\s*$/,
      / GIRLS\s*$/,
      / BOREHOLE\s*$/,
      / \s*\([^)]*\)\s*$/,
    ];
    
    const genericTerms = new Set([
      "HALL", "CENTRE", "CENTER", "COURT", "OFFICE", "SCHOOL", "STATION",
      "CHURCH", "MOSQUE", "MARKET", "PLAYGROUND", "BARRACKS", "BARRACK",
      "STORE", "HOSPITAL", "CLINIC", "UNIVERSITY", "INSTITUTE", "COLLEGE",
      "SEMINARY", "CONTAINER", "HEADQUARTERS", "HQTRS", "CPS", "POLICE",
      "HEALTH", "BOYS", "GIRLS", "WARD"
    ]);
    
    const villages = raw.map(v => {
      let cleaned = v.toUpperCase().trim();
      
      let prev = "";
      while (prev !== cleaned) {
        prev = cleaned;
        for (const pattern of suffixPatterns) {
          cleaned = cleaned.replace(pattern, "");
        }
        cleaned = cleaned.trim();
      }
      
      cleaned = cleaned.replace(/\s+[IVXLCDM]+\s*$/, "").trim();
      cleaned = cleaned.replace(/\s+NO\.?\s*\d+\s*$/, "").trim();
      cleaned = cleaned.replace(/\s+\d+\s*$/, "").trim();
      cleaned = cleaned.replace(/\s+(WARD|ROAD|STREET|LANE|VILLAGE)\s*$/, "").trim();
      cleaned = cleaned.replace(/\s+[A-Z]\s*$/, "").trim();
      cleaned = cleaned.replace(/\s+/g, " ").trim();
      cleaned = cleaned.replace(/^[\s.,-]+|[\s.,-]+$/g, "").trim();
      
      return cleaned;
    }).filter(v => {
      if (v.length < 3) return false;
      if (genericTerms.has(v)) return false;
      return true;
    });

    return Array.from(new Set(villages)).sort();
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
