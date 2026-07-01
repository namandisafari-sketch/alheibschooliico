import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { checkWhatsAppConnection, sendLowStockAlert } from "@/services/inventoryWhatsAppService";
import { toast } from "@/hooks/use-toast";

interface LowStockItem {
  name: string;
  qty: number;
  minStock: number;
  unit: string;
}

interface InventoryWhatsAppPanelProps {
  lowStockItems?: LowStockItem[];
}

export function InventoryWhatsAppPanel({ lowStockItems = [] }: InventoryWhatsAppPanelProps) {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("+256");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkWhatsAppConnection().then((status) => {
      setConnected(status.connected);
      setChecking(false);
    });
  }, []);

  const handleSendAlert = async () => {
    if (lowStockItems.length === 0) {
      toast({ title: "No alerts", description: "No low stock items to report." });
      return;
    }
    setSending(true);
    let sent = 0;
    for (const item of lowStockItems) {
      const result = await sendLowStockAlert(item.name, item.qty, item.minStock, item.unit);
      if (result.success) sent++;
    }
    setSending(false);
    toast({
      title: `Sent ${sent}/${lowStockItems.length} alerts`,
      description: sent > 0 ? "Low stock alerts delivered via WhatsApp." : "Failed to send alerts.",
      variant: sent > 0 ? "default" : "destructive",
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm">WhatsApp Notifications</span>
        </div>
        {checking ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : connected ? (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
            <XCircle className="h-3 w-3" /> Disconnected
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Alert Phone Number</Label>
        <div className="flex gap-2">
          <Input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+256..."
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={handleSendAlert}
          disabled={sending || lowStockItems.length === 0}
        >
          {sending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          Send Low Stock Alert ({lowStockItems.length})
        </Button>
      </div>
    </Card>
  );
}
