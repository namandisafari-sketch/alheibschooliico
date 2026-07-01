// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Users, Home, ChevronRight, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const DormitoryStatusWidget = () => {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dormitory-stats"],
    queryFn: async () => {
      const [dormRes, residentRes] = await Promise.all([
        supabase.from("dormitories").select("id, name, gender, capacity"),
        supabase.from("dormitory_residents").select("id, dormitory_id, is_active").eq("is_active", true),
      ]);

      const dorms = dormRes.data || [];
      const residents = residentRes.data || [];
      const totalCapacity = dorms.reduce((sum, d) => sum + (d.capacity || 0), 0);
      const totalOccupied = residents.length;
      const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

      const dormsByGender = { boys: dorms.filter(d => d.gender === "boys").length, girls: dorms.filter(d => d.gender === "girls").length, mixed: dorms.filter(d => d.gender === "mixed").length };

      return { totalDorms: dorms.length, totalCapacity, totalOccupied, occupancyRate, dormsByGender };
    },
    refetchInterval: 60000,
  });

  const totalDorms = stats?.totalDorms ?? 0;
  const occupancyRate = stats?.occupancyRate ?? 0;
  const totalOccupied = stats?.totalOccupied ?? 0;
  const totalCapacity = stats?.totalCapacity ?? 0;
  const overCapacity = occupancyRate > 95;

  return (
    <Card className="p-4 md:p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-teal-50/50 rounded-full -mr-12 md:-mr-16 -mt-12 md:-mt-16 transition-transform group-hover:scale-110" />
      
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Residential Life</h4>
          <p className="text-xl md:text-2xl font-black text-slate-900">Dormitories</p>
        </div>
        <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-teal-100 flex items-center justify-center">
          <Bed className="h-4 w-4 md:h-5 md:w-5 text-teal-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm relative group/item overflow-hidden">
          <div className="absolute inset-0 bg-teal-600 opacity-0 group-hover/item:opacity-[0.03] transition-opacity" />
          <Home className="w-4 h-4 md:w-5 md:h-5 text-teal-600 mb-2 md:mb-3" />
          <p className="text-lg md:text-2xl font-black text-slate-900 truncate">{totalDorms}</p>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight">Dormitories</p>
        </div>
        
        <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm relative group/item overflow-hidden">
          <div className="absolute inset-0 bg-amber-600 opacity-0 group-hover/item:opacity-[0.03] transition-opacity" />
          <Users className="w-4 h-4 md:w-5 md:h-5 text-amber-600 mb-2 md:mb-3" />
          <p className="text-lg md:text-2xl font-black text-slate-900 truncate">{totalOccupied}/{totalCapacity}</p>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight">Occupancy</p>
        </div>
      </div>

      {overCapacity && (
        <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <span className="text-[10px] font-bold text-red-700">Near full capacity!</span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Badge variant="outline" className="text-[8px] md:text-[10px] rounded-lg">{stats?.dormsByGender?.boys || 0} Boys</Badge>
        <Badge variant="outline" className="text-[8px] md:text-[10px] rounded-lg">{stats?.dormsByGender?.girls || 0} Girls</Badge>
        <Badge variant="outline" className="text-[8px] md:text-[10px] rounded-lg">{stats?.dormsByGender?.mixed || 0} Mixed</Badge>
        <Badge className={`text-[8px] md:text-[10px] rounded-lg ${occupancyRate >= 80 ? 'bg-amber-100 text-amber-700' : occupancyRate >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {occupancyRate}% Full
        </Badge>
      </div>

      <Button 
        variant="ghost" 
        className="w-full mt-3 md:mt-4 h-8 md:h-10 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-teal-600 hover:bg-teal-50 group/btn"
        onClick={() => navigate("/hostel")}
      >
        Manage Dormitories
        <ChevronRight className="w-3 h-3 ml-1 md:ml-2 transition-transform group-hover/btn:translate-x-1" />
      </Button>
    </Card>
  );
};
