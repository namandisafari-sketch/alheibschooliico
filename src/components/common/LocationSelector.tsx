
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useGeoRegions, useGeoDistricts } from "@/hooks/useGeoNames";
import { Loader2 } from "lucide-react";

interface LocationSelectorProps {
  districtValue?: string;
  onDistrictChange: (value: string) => void;
  label?: string;
  useId?: boolean;
}

export function LocationSelector({ districtValue, onDistrictChange, label = "District", useId = false }: LocationSelectorProps) {
  const { data: regions = [], isLoading: isLoadingRegions } = useGeoRegions();
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const { data: districts = [], isLoading: isLoadingDistricts } = useGeoDistricts(selectedRegionId);

  // If we have an initial district value, we might want to find its region
  // But GeoNames API doesn't easily reverse lookup without more calls
  // For simplicity in this UI, we'll let the user pick region then district

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Region</Label>
        <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
          <SelectTrigger className="rounded-xl border-2">
            <SelectValue placeholder={isLoadingRegions ? "Loading..." : "Select Region"} />
          </SelectTrigger>
          <SelectContent>
            {regions.map((r) => (
              <SelectItem key={r.geonameId} value={String(r.geonameId)}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</Label>
        <Select 
          value={districtValue} 
          onValueChange={onDistrictChange}
          disabled={!selectedRegionId || isLoadingDistricts}
        >
          <SelectTrigger className="rounded-xl border-2">
            {isLoadingDistricts && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            <SelectValue placeholder={!selectedRegionId ? "Select region first" : "Select District"} />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.geonameId} value={useId ? String(d.geonameId) : d.name}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
