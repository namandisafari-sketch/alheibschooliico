import { useUgandaLocations } from "@/hooks/useUgandaLocations";
import { SearchableSelectField } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface AddressData {
  district: string;
  sub_county: string;
  parish: string;
  village: string;
  street: string;
}

interface AddressFormProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  showStreet?: boolean;
}

export function AddressForm({ value, onChange, showStreet = false }: AddressFormProps) {
  const { loading, districts, getSubcounties, getParishes, getVillages, getRegion } = useUgandaLocations();

  const subcounties = value.district ? getSubcounties(value.district) : [];
  const parishes = value.district && value.sub_county ? getParishes(value.district, value.sub_county) : [];
  const villages = value.district && value.sub_county && value.parish
    ? getVillages(value.district, value.sub_county, value.parish)
    : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Region</Label>
          <Input
            value={value.district ? getRegion(value.district) : ""}
            className="rounded-xl border-2 bg-slate-50 font-semibold h-10 text-xs"
            readOnly
            placeholder="Auto"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">District *</Label>
          <SearchableSelectField
            value={value.district}
            onValueChange={(v) => onChange({ district: v, sub_county: "", parish: "", village: "", street: value.street })}
            options={districts.map((d) => ({ value: d, label: d }))}
            placeholder={loading ? "Loading..." : "Select District"}
            disabled={loading}
            className="rounded-xl border-2 h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sub-county *</Label>
          <SearchableSelectField
            value={value.sub_county}
            onValueChange={(v) => onChange({ ...value, sub_county: v, parish: "", village: "" })}
            options={subcounties.map((d) => ({ value: d, label: d }))}
            placeholder={!value.district ? "Select District first" : "Select Sub-county"}
            disabled={!value.district}
            className="rounded-xl border-2 h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Parish *</Label>
          <SearchableSelectField
            value={value.parish}
            onValueChange={(v) => onChange({ ...value, parish: v, village: "" })}
            options={parishes.map((d) => ({ value: d, label: d }))}
            placeholder={!value.sub_county ? "Select Sub-county first" : "Select Parish"}
            disabled={!value.sub_county}
            className="rounded-xl border-2 h-10"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Village *</Label>
          <SearchableSelectField
            value={value.village}
            onValueChange={(v) => onChange({ ...value, village: v })}
            options={villages.map((d) => ({ value: d, label: d }))}
            placeholder={!value.parish ? "Select Parish first" : "Select Village"}
            disabled={!value.parish}
            className="rounded-xl border-2 h-10"
          />
        </div>
        {showStreet && (
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Street / Landmark</Label>
            <Input
              value={value.street}
              onChange={(e) => onChange({ ...value, street: e.target.value })}
              className="rounded-xl border-2 h-10"
              placeholder="Optional"
              maxLength={200}
            />
          </div>
        )}
      </div>
    </div>
  );
}
