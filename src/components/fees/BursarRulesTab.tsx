import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ShieldAlert, Check } from "lucide-react";
import { useBursarRules, useToggleBursarRule, useDeleteBursarRule, useOverrideRequests, formatUGX } from "@/hooks/useFees";
import { AddBursarRuleDialog } from "./AddBursarRuleDialog";

export const BursarRulesTab = () => {
  const { data: rules, isLoading } = useBursarRules();
  const { data: requests } = useOverrideRequests();
  const toggle = useToggleBursarRule();
  const del = useDeleteBursarRule();

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive mt-1" />
            <div>
              <h3 className="font-display text-lg font-semibold">Bursar Red List Rules</h3>
              <p className="text-sm text-muted-foreground">Define rules to automatically block students at the gate</p>
            </div>
          </div>
          <AddBursarRuleDialog trigger={<Button><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>} />
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : !rules?.length ? (
          <p className="text-center text-muted-foreground py-8">No rules defined yet</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2 px-2">Rule</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Condition</th>
                  <th className="text-left py-2 px-2">Class</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-right py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-3 px-2 font-medium">{r.name}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-destructive border-destructive/30">
                        <ShieldAlert className="h-3 w-3 mr-1" /> Balance Threshold
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-mono">Balance ≥ {formatUGX(r.balance_threshold)}</td>
                    <td className="py-3 px-2">
                      {r.applies_to_all_classes ? <Badge variant="secondary">All Classes</Badge> : r.classes?.name}
                    </td>
                    <td className="py-3 px-2">
                      <Switch checked={r.is_active} onCheckedChange={(v) => toggle.mutate({ id: r.id, is_active: v })} />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-warning mt-1" />
          <div>
            <h3 className="font-display text-lg font-semibold">Override Requests</h3>
            <p className="text-sm text-muted-foreground">Students blocked by bursar rules requesting entry</p>
          </div>
        </div>
        {!requests?.length ? (
          <div className="text-center py-8">
            <Check className="h-8 w-8 mx-auto text-success mb-2" />
            <p className="text-muted-foreground">No pending override requests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{r.learners?.full_name}</p>
                  <p className="text-xs text-muted-foreground">Balance: {formatUGX(r.outstanding_balance || 0)} • {r.reason}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Approve</Button>
                  <Button size="sm" variant="ghost">Deny</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
