import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Sliders } from "lucide-react";
import {
  useIdCardSettings,
  useUpdateIdCardSettings,
  IdCardSettings,
} from "@/hooks/useIdCardSettings";
import { useToast } from "@/hooks/use-toast";

type Surface = "report" | "id";

interface Props {
  /** Which surface's controls to show */
  surface: Surface;
  /** Optional title override */
  title?: string;
  /** Show as compact (no Card wrapper) */
  compact?: boolean;
}

const DEFAULTS: Pick<
  IdCardSettings,
  | "logo_size_report"
  | "logo_size_id"
  | "signature_height_report"
  | "signature_height_id"
  | "stamp_size_report"
> = {
  logo_size_report: 96,
  logo_size_id: 44,
  signature_height_report: 32,
  signature_height_id: 22,
  stamp_size_report: 80,
};

/**
 * Live size controls for the school logo / signatures / stamp used on
 * Report Cards and ID Cards. Changes are debounced and persisted to
 * `id_card_settings` so the preview updates instantly everywhere.
 */
export const AssetSizeControls = ({ surface, title, compact }: Props) => {
  const { data: settings } = useIdCardSettings();
  const update = useUpdateIdCardSettings();
  const { toast } = useToast();

  const [local, setLocal] = useState<IdCardSettings | null>(settings ?? null);

  // Sync from server on first load
  useEffect(() => {
    if (settings && !local) setLocal(settings);
  }, [settings, local]);

  // Debounced auto-save
  useEffect(() => {
    if (!local || !settings) return;
    // Only save if something actually changed
    const changed =
      local.logo_size_report !== settings.logo_size_report ||
      local.logo_size_id !== settings.logo_size_id ||
      local.signature_height_report !== settings.signature_height_report ||
      local.signature_height_id !== settings.signature_height_id ||
      local.stamp_size_report !== settings.stamp_size_report;
    if (!changed) return;
    const t = setTimeout(() => {
      update.mutate(local);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    local?.logo_size_report,
    local?.logo_size_id,
    local?.signature_height_report,
    local?.signature_height_id,
    local?.stamp_size_report,
  ]);

  if (!local) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading sizes…
      </div>
    );
  }

  const set = <K extends keyof IdCardSettings>(key: K, value: IdCardSettings[K]) =>
    setLocal((p) => (p ? { ...p, [key]: value } : p));

  const reset = () => {
    if (!local) return;
    setLocal({ ...local, ...DEFAULTS });
    toast({ title: "Sizes reset to default" });
  };

  const Inner = (
    <div className="space-y-4">
      {surface === "report" ? (
        <>
          <SliderRow
            label="School logo"
            value={local.logo_size_report}
            min={48}
            max={180}
            onChange={(v) => set("logo_size_report", v)}
          />
          <SliderRow
            label="Headteacher signature"
            value={local.signature_height_report}
            min={16}
            max={90}
            onChange={(v) => set("signature_height_report", v)}
          />
          <SliderRow
            label="Official stamp"
            value={local.stamp_size_report}
            min={40}
            max={180}
            onChange={(v) => set("stamp_size_report", v)}
          />
        </>
      ) : (
        <>
          <SliderRow
            label="School logo"
            value={local.logo_size_id}
            min={28}
            max={90}
            onChange={(v) => set("logo_size_id", v)}
          />
          <SliderRow
            label="Signature height"
            value={local.signature_height_id}
            min={14}
            max={60}
            onChange={(v) => set("signature_height_id", v)}
          />
        </>
      )}

      <div className="flex items-center justify-between pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          {update.isPending ? "Saving…" : "Auto-saved"}
        </p>
        <Button variant="ghost" size="sm" onClick={reset} className="h-8">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>
      </div>
    </div>
  );

  if (compact) return Inner;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Sliders className="h-4 w-4" />
          {title ?? "Asset sizes"}
        </CardTitle>
      </CardHeader>
      <CardContent>{Inner}</CardContent>
    </Card>
  );
};

const SliderRow = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <span className="text-xs font-mono text-muted-foreground">{value}px</span>
    </div>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={1}
      onValueChange={([v]) => onChange(v)}
    />
  </div>
);
