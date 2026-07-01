import { Kpi, Section } from "@/components/role/RolePage";
import { Package, AlertTriangle, Truck, ClipboardCheck, ScanBarcode, Boxes } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const StorekeeperDashboard = () => {
  const { items: itemsQ } = useInventory();
  const items = itemsQ.data as any[] | undefined;
  const total = items?.length ?? 0;
  const low = items?.filter((i: any) => (i.quantity ?? 0) <= (i.min_threshold ?? 0)).length ?? 0;
  const out = items?.filter((i: any) => (i.quantity ?? 0) === 0).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi label="Items in Store" value={total} icon={Boxes} tone="primary" />
        <Kpi label="Low Stock" value={low} hint="At or below reorder level" icon={AlertTriangle} tone="warning" />
        <Kpi label="Out of Stock" value={out} icon={Package} tone="warning" />
        <Kpi label="Open POs" value={"—"} hint="From procurement" icon={Truck} tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Quick Actions" description="Day-to-day store operations">
          <div className="grid gap-3">
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/store/receiving"><ScanBarcode className="mr-2 h-4 w-4" />Receive Goods (Scan)</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/inventory"><Boxes className="mr-2 h-4 w-4" />Browse Inventory</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/inventory/tracking"><ClipboardCheck className="mr-2 h-4 w-4" />Issuance Requests</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/store/low-stock"><AlertTriangle className="mr-2 h-4 w-4" />Low-Stock Alerts</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
              <Link to="/store/suppliers"><Truck className="mr-2 h-4 w-4" />Supplier Ledger</Link>
            </Button>
          </div>
        </Section>

        <Section title="Replenishment Watchlist" description="Items needing reorder">
          <div className="space-y-2 max-h-72 overflow-auto">
            {(items ?? [])
              .filter((i: any) => (i.quantity ?? 0) <= (i.min_threshold ?? 0))
              .slice(0, 8)
              .map((i: any) => (
                <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{i.name}</p>
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{i.category ?? "—"}</p>
                  </div>
                  <span className="text-sm font-black text-amber-700">{i.quantity ?? 0}</span>
                </div>
              ))}
            {low === 0 && <p className="text-xs text-muted-foreground py-6 text-center">All stocks healthy</p>}
          </div>
        </Section>

        <Section title="Recent Issuances" description="Latest stock movements">
          <p className="text-xs text-muted-foreground py-6 text-center">Connect inventory_transactions feed</p>
        </Section>
      </div>
    </div>
  );
};
