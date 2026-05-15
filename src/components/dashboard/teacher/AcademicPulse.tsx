
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Activity, TrendingUp } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 72 },
  { name: 'Wed', score: 68 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 78 },
];

export const AcademicPulse = () => {
  const { t } = useLanguage();

  return (
    <Card className="border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Activity className="h-32 w-32 text-blue-600" />
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="font-black text-slate-900 leading-tight">{t("Class Performance Pulse")}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Term 3 Weekly Progress")}</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-600">
           <TrendingUp className="h-4 w-4" />
           <span className="text-xs font-black">+12%</span>
        </div>
      </div>

      <div className="h-[200px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
              dy={10}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
                fontWeight: 'bold'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 flex justify-between items-center relative z-10">
         <div className="flex gap-4">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">{t("Highest")}</p>
               <p className="text-sm font-black text-slate-900">92%</p>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">{t("Average")}</p>
               <p className="text-sm font-black text-slate-900">76%</p>
            </div>
         </div>
         <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">
            {t("Full Report")}
         </button>
      </div>
    </Card>
  );
};
