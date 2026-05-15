import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useFeeStructures, useDeleteFeeStructure, formatUGX, FeeStructure } from "@/hooks/useFees";
import { AddFeeStructureDialog } from "./AddFeeStructureDialog";
import { useState } from "react";

export const FeeStructuresTab = () => {
  const { data: structures, isLoading } = useFeeStructures();
  const del = useDeleteFeeStructure();
  const [editing, setEditing] = useState<FeeStructure | null>(null);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-display text-lg font-semibold">Fee Structures</h3>
          <p className="text-sm text-muted-foreground">Define fee types and amounts by level</p>
        </div>
        <AddFeeStructureDialog
          trigger={<Button><Plus className="h-4 w-4 mr-1" /> Add Fee</Button>}
        />
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : !structures?.length ? (
        <p className="text-center text-muted-foreground py-8">No fee structures yet. Add one above.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {structures.map((s) => (
            <div key={s.id} className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {s.applies_to === "all" ? "All" : `P${s.class_level}`} • {s.category}
                  </p>
                </div>
                <Badge variant={s.is_active ? "default" : "secondary"} className="shrink-0">
                  {s.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xl font-bold mt-3">{formatUGX(s.amount)}</p>
              <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                <Button variant="ghost" size="icon" onClick={() => setEditing(s)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <AddFeeStructureDialog initial={editing} onClose={() => setEditing(null)} />
      )}
    </Card>
  );
};
