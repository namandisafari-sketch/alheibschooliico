
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle2 } from "lucide-react";

export const HostelLogisticsTab = () => {
  const inventory = [
    { name: "Buckets", stock: 120, status: "Good" },
    { name: "Cleaning Soap", stock: 15, status: "Low" },
    { name: "Brooms", stock: 45, status: "Good" },
    { name: "Disinfectant", stock: 8, status: "Critical" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {inventory.map((item) => (
          <Card key={item.name} className="border-none shadow-sm">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${
                  item.status === 'Critical' ? 'bg-destructive/10 text-destructive' : 
                  item.status === 'Low' ? 'bg-amber-100 text-amber-700' : 'bg-success/10 text-success'
                }`}>
                  <Package className="h-5 w-5" />
                </div>
                <Badge variant={
                  item.status === 'Critical' ? 'destructive' : 
                  item.status === 'Low' ? 'secondary' : 'default'
                }>{item.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground font-medium">{item.name}</p>
              <p className="text-2xl font-bold">{item.stock}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Hostel Inventory Movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Cleaning Soap</TableCell>
                <TableCell><Badge variant="outline">Restock</Badge></TableCell>
                <TableCell className="text-success font-bold">+20</TableCell>
                <TableCell>Matron Akinah</TableCell>
                <TableCell className="text-sm text-muted-foreground">Yesterday</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
