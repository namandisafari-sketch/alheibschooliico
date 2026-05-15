
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Send, X, Bot, User, Loader2, Minus, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Assalamu Alaikum! I am your Alheb School Assistant. How can I help you manage the school today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Simulate AI response (In a real scenario, this would call Gemini or Local Ollama)
    setTimeout(() => {
      let response = "I'm processing your request regarding Alheb School...";
      
      if (userMessage.toLowerCase().includes("inventory")) {
        response = "I can see our inventory levels are currently being tracked. Most items are within threshold, but we should check the stationery stock soon.";
      } else if (userMessage.toLowerCase().includes("attendance")) {
        response = "Daily attendance for today is being logged. Would you like me to generate a summary for the Head Teacher?";
      } else if (userMessage.toLowerCase().includes("help")) {
        response = "I can help you with: \n1. Summarizing student reports\n2. Checking inventory status\n3. Managing gate pass logs\n4. Translating Arabic communications";
      }

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsLoading(false);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-slate-900 hover:bg-black group border-4 border-white animate-bounce"
      >
        <Sparkles className="h-6 w-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 w-96 shadow-2xl border-2 border-slate-200 transition-all duration-300 z-50 overflow-hidden",
      isMinimized ? "h-14" : "h-[500px]"
    )}>
      <CardHeader className="bg-slate-900 text-white p-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Bot className="h-5 w-5 text-emerald-400" />
           </div>
           <div>
             <CardTitle className="text-sm font-black uppercase tracking-widest">Alheb AI</CardTitle>
             <CardDescription className="text-[10px] text-emerald-400/70 font-bold uppercase">Principal's Assistant</CardDescription>
           </div>
        </div>
        <div className="flex items-center gap-1">
           <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
           </Button>
           <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
           </Button>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <>
          <CardContent className="p-0 flex flex-col h-[calc(500px-56px)]">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn(
                    "flex gap-3",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "h-8 w-8 rounded-full shrink-0 flex items-center justify-center border",
                      m.role === "user" ? "bg-slate-100 border-slate-200" : "bg-slate-900 border-slate-800"
                    )}>
                      {m.role === "user" ? <User className="h-4 w-4 text-slate-600" /> : <Bot className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl p-3 text-sm font-medium leading-relaxed",
                      m.role === "user" 
                        ? "bg-slate-900 text-white rounded-tr-none" 
                        : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                    )}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center">
                       <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
                    </div>
                    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 rounded-tl-none">
                       <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-slate-50">
               <div className="relative">
                  <Input 
                    placeholder="Ask me anything..." 
                    className="pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-slate-900"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <Button 
                    size="icon" 
                    className="absolute right-1 top-1 h-9 w-9 rounded-lg bg-slate-900"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="h-4 w-4 text-emerald-400" />
                  </Button>
               </div>
               <p className="text-[9px] text-center mt-2 text-slate-400 font-bold uppercase tracking-widest">
                 Powered by Local Alheb Intelligence
               </p>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
