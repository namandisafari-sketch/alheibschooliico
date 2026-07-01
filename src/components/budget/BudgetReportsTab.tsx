// @ts-nocheck

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, PieChart, TrendingDown, TrendingUp, DollarSign, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BudgetReportsTab = () => {
  // Fetch all purchase orders for real-time calculations
  const { data: allOrders } = useQuery({
    queryKey: ["all-purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*");
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000 // Refresh every 5 seconds for real-time updates
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-for-budget"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*");
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000
  });

  // Calculate real-time metrics from database
  const budgetAllocation = 50000000; // UGX 50M total budget
  const totalSpent = (allOrders || []).filter(o => o.status === 'archived').reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const approvedTotal = (allOrders || []).filter(o => o.status === 'approved' || o.status === 'head_office').reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const committedTotal = (allOrders || []).filter(o => o.status === 'committee').reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const remainingBudget = budgetAllocation - totalSpent - approvedTotal - committedTotal;
  const budgetUtilization = (totalSpent / budgetAllocation) * 100;

  // Calculate department spending from purchase orders
  const departmentSpending = (projects || []).reduce((acc, project) => {
    const projectTotal = (allOrders || [])
      .filter(o => o.project_id === project.id)
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    if (projectTotal > 0) {
      acc[project.name] = projectTotal;
    }
    return acc;
  }, {});

  // If no project-based spending, use status-based grouping
  if (Object.keys(departmentSpending).length === 0) {
    departmentSpending['Archived Orders'] = (allOrders || []).filter(o => o.status === 'archived').reduce((sum, o) => sum + (o.total_amount || 0), 0);
    departmentSpending['Approved Orders'] = approvedTotal;
    departmentSpending['Pending Orders'] = committedTotal;
  }

  // Calculate monthly spending trend from actual dates
  const monthlyTrend = (() => {
    const months = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    (allOrders || []).forEach(order => {
      if (order.created_at) {
        const date = new Date(order.created_at);
        const monthKey = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
        months[monthKey] = (months[monthKey] || 0) + (order.total_amount || 0);
      }
    });

    // Get last 6 months of data
    const sorted = Object.entries(months).sort((a, b) => new Date(a[0]) - new Date(b[0])).slice(-6);
    return sorted.length > 0 ? sorted.map(([month, amount]) => ({ month: month.split('-')[0], amount })) : [
      { month: 'Jan', amount: 0 },
      { month: 'Feb', amount: 0 },
      { month: 'Mar', amount: 0 },
      { month: 'Apr', amount: 0 },
      { month: 'May', amount: 0 },
      { month: 'Jun', amount: 0 },
    ];
  })();

  // Calculate budget categories from actual data
  const budgetCategories = (() => {
    const categories = {
      'Archived': { allocated: 25000000, spent: totalSpent },
      'Approved': { allocated: 15000000, spent: approvedTotal },
      'Pending': { allocated: 10000000, spent: committedTotal },
    };

    return Object.entries(categories).map(([category, data]) => ({
      category,
      allocated: data.allocated,
      spent: data.spent,
      variance: ((data.spent - data.allocated) / data.allocated) * 100
    }));
  })();

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics - Real-Time */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-blue-700 uppercase tracking-wide">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-blue-900">UGX {budgetAllocation.toLocaleString()}</p>
            <p className="text-xs text-blue-600 mt-1">FY 2024/2025</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-purple-700 uppercase tracking-wide">Spent to Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-purple-900">UGX {totalSpent.toLocaleString()}</p>
            <p className="text-xs text-purple-600 mt-1">{budgetUtilization.toFixed(1)}% utilized</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber-700 uppercase tracking-wide">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-amber-900">UGX {approvedTotal.toLocaleString()}</p>
            <p className="text-xs text-amber-600 mt-1">Ready to spend</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-orange-700 uppercase tracking-wide">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-orange-900">UGX {committedTotal.toLocaleString()}</p>
            <p className="text-xs text-orange-600 mt-1">Under review</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-green-700 uppercase tracking-wide">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-green-900">UGX {remainingBudget.toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1">{((remainingBudget / budgetAllocation) * 100).toFixed(1)}% available</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Visualization */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" /> Budget Allocation Status (Real-Time)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">Spent</span>
                  <span className="text-purple-600 font-bold">{budgetUtilization.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{width: `${budgetUtilization}%`}} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">Approved</span>
                  <span className="text-amber-600 font-bold">{((approvedTotal / budgetAllocation) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{width: `${(approvedTotal / budgetAllocation) * 100}%`}} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">Pending</span>
                  <span className="text-orange-600 font-bold">{((committedTotal / budgetAllocation) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full" style={{width: `${(committedTotal / budgetAllocation) * 100}%`}} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">Remaining</span>
                  <span className="text-green-600 font-bold">{((remainingBudget / budgetAllocation) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{width: `${(remainingBudget / budgetAllocation) * 100}%`}} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Spending by Department/Project (Real-Time)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(departmentSpending).length > 0 ? (
              Object.entries(departmentSpending).map(([dept, amount]) => {
                const percentage = (amount / Object.values(departmentSpending).reduce((a, b) => a + b, 0)) * 100;
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{dept}</span>
                      <span className="font-bold text-primary">UGX {(amount / 1000000).toFixed(1)}M ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{width: `${percentage}%`}} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No spending data available yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spending Trend */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Monthly Spending Trend (Real-Time Data)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyTrend.map((item, idx) => {
              const maxAmount = Math.max(...monthlyTrend.map(m => m.amount), 1);
              const percentage = (item.amount / maxAmount) * 100;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.month}</span>
                    <span className="font-bold text-primary">UGX {item.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-8 bg-slate-100 rounded-lg overflow-hidden flex items-center">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full" style={{width: `${percentage}%`}} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Budget Categories Breakdown */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Budget Categories & Variance (Real-Time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 font-bold">Category</th>
                  <th className="text-right py-3 px-2 font-bold">Allocated</th>
                  <th className="text-right py-3 px-2 font-bold">Spent</th>
                  <th className="text-right py-3 px-2 font-bold">Variance %</th>
                  <th className="text-center py-3 px-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {budgetCategories.map((item) => (
                  <tr key={item.category} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-medium">{item.category}</td>
                    <td className="text-right py-3 px-2">UGX {(item.allocated / 1000000).toFixed(1)}M</td>
                    <td className="text-right py-3 px-2">UGX {(item.spent / 1000000).toFixed(1)}M</td>
                    <td className="text-right py-3 px-2">
                      <span className={item.variance < 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {item.variance > 0 ? '+' : ''}{item.variance.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      {item.variance < 0 ? (
                        <Badge className="bg-green-100 text-green-800">Under Budget</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Over Budget</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Financial Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-md border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" /> Under Budget Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Categories spending below allocations (Real-Time):</p>
            <div className="space-y-2">
              {budgetCategories.filter(c => c.variance < 0).length > 0 ? (
                budgetCategories.filter(c => c.variance < 0).map(c => (
                  <div key={c.category} className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="font-medium">{c.category}</span>
                    <Badge className="bg-green-100 text-green-800">Saved {Math.abs(c.variance).toFixed(1)}%</Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">All categories on or over budget</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" /> Key Metrics (Real-Time)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-xs text-muted-foreground">Average Monthly Spending</p>
              <p className="text-xl font-black text-blue-900">UGX {(monthlyTrend.reduce((a, b) => a + b.amount, 0) / (monthlyTrend.length || 1) / 1000000).toFixed(2)}M</p>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-xs text-muted-foreground">Total Purchase Orders</p>
              <p className="text-xl font-black text-blue-900">{allOrders?.length || 0} orders</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
