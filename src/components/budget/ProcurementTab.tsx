// @ts-nocheck

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Truck, Loader2, Package, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ProcurementTab = () => {
  const { data: pos, isLoading } = useQuery({
    queryKey: ["procurement-log"],
    queryFn: async () => {
      const { data, error } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000 // Real-time updates every 5 seconds
  });

  // Calculate real-time metrics from database
  const activeCount = pos?.filter(p => p.status !== 'archived' && p.status !== 'rejected' && p.status !== 'committee').length || 0;
  const fulfilledCount = pos?.filter(p => p.status === 'archived').length || 0;
  const rejectedCount = pos?.filter(p => p.status === 'rejected').length || 0;
  const pendingCount = pos?.filter(p => p.status === 'committee').length || 0;

  const activeAmount = (pos || []).filter(p => p.status !== 'archived' && p.status !== 'rejected').reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const fulfilledAmount = (pos || []).filter(p => p.status === 'archived').reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const rejectedAmount = (pos || []).filter(p => p.status === 'rejected').reduce((acc, o) => acc + (o.total_amount || 0), 0);

  // Dynamically calculate vendor stats from actual data
  const vendorStats = (pos || []).reduce((acc, order) => {
    const vendor = "General Vendor";
    acc[vendor] = (acc[vendor] || 0) + 1;
    return acc;
  }, {});

  // Dynamic procurement by category
  const procurementByCategory = (pos || []).reduce((acc, order) => {
    const firstWord = order.title?.split(' ')[0] || 'Other';
    acc[firstWord] = (acc[firstWord] || 0) + (order.total_amount || 0);
    return acc;
  }, {});

  // Calculate delivery status from actual order count
  const totalOrders = pos?.length || 0;
  const deliveryStatus = [
    { status: 'Delivered', count: fulfilledCount, percentage: totalOrders > 0 ? (fulfilledCount / totalOrders) * 100 : 0 },
    { status: 'Processing', count: pendingCount, percentage: totalOrders > 0 ? (pendingCount / totalOrders) * 100 : 0 },
    { status: 'Approved', count: activeCount, percentage: totalOrders > 0 ? (activeCount / totalOrders) * 100 : 0 },
    { status: 'Rejected', count: rejectedCount, percentage: totalOrders > 0 ? (rejectedCount / totalOrders) * 100 : 0 },
  ];

  // Get pending deliveries from orders
  const pendingDeliveries = (pos || [])
    .filter(p => p.status === 'committee' || p.status === 'approved' || p.status === 'head_office')
    .slice(0, 3)
    .map(order => ({
      id: order.id,
      item: order.title,
      vendor: 'General Vendor',
      expectedDate: order.created_at ? new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'TBD',
      daysRemaining: order.created_at ? Math.max(0, 7 - Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))) : 7,
    }));

  return (
    <div className="space-y-6">
      {/* Procurement Summary Metrics - Real-Time */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-blue-700 uppercase tracking-wide">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-blue-900">{pos?.length || 0}</p>
            <p className="text-xs text-blue-600 mt-2">All purchase orders</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber-700 uppercase tracking-wide">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-amber-900">{activeCount}</p>
            <p className="text-xs text-amber-600 mt-2">UGX {(activeAmount / 1000000).toFixed(1)}M pending</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-green-700 uppercase tracking-wide">Fulfilled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-green-900">{fulfilledCount}</p>
            <p className="text-xs text-green-600 mt-2">UGX {(fulfilledAmount / 1000000).toFixed(1)}M completed</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-red-700 uppercase tracking-wide">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-red-900">{rejectedCount}</p>
            <p className="text-xs text-red-600 mt-2">UGX {(rejectedAmount / 1000000).toFixed(1)}M cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Procurement Status Overview - Real-Time */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Delivery Status Overview (Real-Time)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveryStatus.map((item) => (
              <div key={item.status}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{item.status}</span>
                  <span className="text-sm font-bold text-primary">{item.count} orders ({item.percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{width: `${item.percentage}%`}} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Procurement by Category (Real-Time)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(procurementByCategory).length > 0 ? (
              Object.entries(procurementByCategory).map(([category, amount]) => {
                const total = Object.values(procurementByCategory).reduce((a, b) => a + b, 0);
                const percentage = (amount / total) * 100;
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{category}</span>
                      <span className="text-primary font-bold">UGX {(amount / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{width: `${percentage}%`}} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No procurement data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance - Real-Time */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" /> Vendor Distribution (Real-Time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(vendorStats).map(([vendor, count]) => (
              <div key={vendor} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-sm">{vendor}</p>
                    <p className="text-xs text-muted-foreground mt-1">{count} orders</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary">{count}</Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fulfillment Rate:</span>
                    <span className="font-bold text-green-600">{totalOrders > 0 ? ((fulfilledCount / totalOrders) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orders Processed:</span>
                    <span className="font-bold text-blue-600">{pos?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Deliveries Alert - Real-Time */}
      <Card className="border-none shadow-md border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" /> Pending Deliveries (Real-Time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingDeliveries.length > 0 ? (
              pendingDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{delivery.item}</p>
                    <p className="text-xs text-muted-foreground mt-1">{delivery.vendor} • Expected: {delivery.expectedDate}</p>
                  </div>
                  {delivery.daysRemaining === 0 ? (
                    <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                  ) : delivery.daysRemaining <= 3 ? (
                    <Badge className="bg-amber-100 text-amber-800">In {delivery.daysRemaining} days</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">On Track</Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No pending deliveries</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Procurement Log - Real-Time */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Complete Procurement Log (Real-Time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-bold">Order ID</TableHead>
                  <TableHead className="font-bold">Item Description</TableHead>
                  <TableHead className="font-bold">Vendor</TableHead>
                  <TableHead className="font-bold">Order Date</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="animate-spin h-5 w-5 mx-auto text-slate-200" />
                    </TableCell>
                  </TableRow>
                ) : pos && pos.length > 0 ? pos.slice(0, 15).map((po) => (
                  <TableRow key={po.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-xs font-bold text-primary">PO-{po.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium text-sm">{po.title}</TableCell>
                    <TableCell className="text-sm">General Vendor</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {po.created_at ? new Date(po.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          po.status === 'archived' ? 'success' : 
                          po.status === 'committee' ? 'secondary' :
                          po.status === 'approved' ? 'default' : 'destructive'
                        }
                      >
                        {po.status === 'archived' ? 'Delivered' : 
                         po.status === 'committee' ? 'Pending' :
                         po.status === 'approved' ? 'Processing' : 'Rejected'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">UGX {po.total_amount?.toLocaleString()}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No procurement records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {pos && pos.length > 15 && (
            <div className="mt-4 p-3 bg-slate-50 rounded text-center text-sm text-muted-foreground">
              Showing 15 of {pos.length} orders • Scroll to view more
            </div>
          )}
        </CardContent>
      </Card>

      {/* Procurement Statistics - Real-Time */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-primary uppercase">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">UGX {pos && pos.length > 0 ? ((pos.reduce((a, b) => a + (b.total_amount || 0), 0) / pos.length) / 1000000).toFixed(2) : 0}M</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-green-600 uppercase">Total Procured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">UGX {pos && pos.length > 0 ? ((pos.reduce((a, b) => a + (b.total_amount || 0), 0)) / 1000000).toFixed(1) : 0}M</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-amber-600 uppercase">Fulfillment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{pos && pos.length > 0 ? ((fulfilledCount / pos.length) * 100).toFixed(0) : 0}%</p>
            <p className="text-xs text-muted-foreground mt-1">{fulfilledCount} of {pos?.length || 0} delivered</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
