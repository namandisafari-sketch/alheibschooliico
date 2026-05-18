import { useUgandaLocations } from "@/hooks/useUgandaLocations";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LocationSelectorProps {
  districtValue?: string;
  onDistrictChange: (value: string) => void;
  label?: string;
  useId?: boolean;
}

export function LocationSelector({ districtValue, onDistrictChange, label = "District", useId = false }: LocationSelectorProps) {
  const { districts, loading, getRegion } = useUgandaLocations();

  // If the stored value is an ID (from old GeoNames database), we display it or clear it
  // Since we migrated to offline district names, we resolve the region for district names.
  const isNameVal = districtValue && isNaN(Number(districtValue));
  const selectedRegion = isNameVal ? getRegion(districtValue) : "";

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Region</Label>
        <Input 
          value={selectedRegion} 
          className="rounded-xl border-2 bg-slate-50 font-semibold h-10" 
          readOnly 
          placeholder="Auto-populated" 
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</Label>
        <SearchableSelect
          value={isNameVal ? districtValue : ""}
          onValueChange={onDistrictChange}
          options={districts.map((d) => ({ value: d, label: d }))}
          placeholder={loading ? "Loading..." : "Select District"}
          disabled={loading}
          className="rounded-xl border-2 h-10"
        />
      </div>
    </div>
  );
}
