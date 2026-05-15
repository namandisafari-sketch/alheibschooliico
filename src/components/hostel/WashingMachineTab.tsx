
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wind, User, Droplets, Zap, Plus } from "lucide-react";

export const WashingMachineTab = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-none shadow-lg bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Wind className="h-5 w-5 text-primary" /> Active Load</span>
            <Badge className="bg-success text-white animate-pulse">Running</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-10">
            <div className="relative">
              <div className="h-40 w-40 rounded-full border-8 border-primary/20 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full border-8 border-primary border-t-transparent animate-spin"></div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-black text-primary">24m</p>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Remaining</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-background border shadow-sm">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Operator</p>
              <p className="font-bold flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Akinah A.</p>
            </div>
            <div className="p-3 rounded-xl bg-background border shadow-sm">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Detergent</p>
              <p className="font-bold flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" /> 250ml Liquid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Stats Today</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-black text-primary">12</p>
              <p className="text-xs font-medium">Total Loads</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-amber-500">3.2kg</p>
              <p className="text-xs font-medium">Soap Used</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="text-sm font-bold">Maintenance Schedule</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-success/5 border border-success/20">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Filter Cleaning</span>
              </div>
              <Badge variant="outline" className="text-[10px] border-success text-success">DONE</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Drum Descaling</span>
              </div>
              <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-500">IN 4 DAYS</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Button className="w-full gap-2 shadow-lg shadow-primary/20 py-6 text-lg font-bold">
          <Plus className="h-5 w-5" /> Start New Load
        </Button>
      </div>
    </div>
  );
};
