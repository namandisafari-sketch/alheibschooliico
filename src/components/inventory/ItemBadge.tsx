
import { QRCodeSVG } from "qrcode.react";
import { format, formatDistanceToNow } from "date-fns";
import { Shield, MapPin, Calendar, Tag, Wallet, History, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemBadgeProps {
  item: any;
  type: "stock" | "asset";
  schoolName: string;
}

export function ItemBadge({ item, type, schoolName }: ItemBadgeProps) {
  const trackingNumber = type === "stock" ? item.sku : (item.asset_tag_id || item.serial_number);
  const purchaseDate = item.purchase_date || item.created_at;
  const value = type === "asset" ? item.purchase_cost : null;
  const age = formatDistanceToNow(new Date(purchaseDate), { addSuffix: false });
  
  return (
    <div className="w-[350px] bg-white border-2 border-slate-900 rounded-xl overflow-hidden shadow-2xl p-0 font-sans print:shadow-none print:border-slate-300">
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{schoolName}</span>
        </div>
        <div className="bg-emerald-500 text-slate-900 text-[8px] font-black px-2 py-0.5 rounded uppercase">
          {type === "asset" ? "Fixed Asset" : "Inventory"}
        </div>
      </div>

      <div className="p-4 flex gap-4">
        {/* QR CODE */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-1 border-2 border-slate-100 rounded-lg bg-white">
            <QRCodeSVG 
              value={`ALHEIB:${type.toUpperCase()}:${item.id}`} 
              size={100}
              level="H"
            />
          </div>
          <span className="font-mono text-[9px] font-black text-slate-400 uppercase tracking-tighter">
            Scan to Verify
          </span>
        </div>

        {/* MAIN INFO */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
             <h3 className="text-sm font-black text-slate-900 uppercase leading-tight line-clamp-2">
               {item.name}
             </h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase">
               {item.brand || item.manufacturer || "General Supply"}
             </p>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-2">
            <div className="flex items-center gap-2">
               <Tag className="h-3 w-3 text-slate-400" />
               <span className="text-[9px] font-black uppercase tracking-tight text-slate-700">
                 ID: <span className="font-mono text-emerald-600">{trackingNumber || "NO-TAG"}</span>
               </span>
            </div>
            
            <div className="flex items-center gap-2">
               <Calendar className="h-3 w-3 text-slate-400" />
               <span className="text-[9px] font-bold text-slate-600">
                 Acquired: {format(new Date(purchaseDate), "MMM yyyy")}
               </span>
            </div>

            <div className="flex items-center gap-2">
               <History className="h-3 w-3 text-slate-400" />
               <span className="text-[9px] font-bold text-slate-600">
                 In School: {age}
               </span>
            </div>

            {value && (
              <div className="flex items-center gap-2">
                <Wallet className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-bold text-slate-600">
                  Value: {new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(value)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER / CONDITION */}
      <div className="bg-slate-50 border-t flex items-center justify-between px-3 py-2">
         <div className="flex items-center gap-1.5">
           <AlertCircle className={cn(
             "h-3 w-3",
             item.condition === 'poor' ? "text-red-500" : "text-emerald-500"
           )} />
           <span className="text-[9px] font-black uppercase text-slate-500">
             Condition: <span className={cn(
               "text-slate-900",
               item.condition === 'poor' && "text-red-600"
             )}>{item.condition || "Good"}</span>
           </span>
         </div>
         <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
           <MapPin className="h-2.5 w-2.5" />
           {item.location || item.storage_location || "Central Store"}
         </div>
      </div>
    </div>
  );
}
