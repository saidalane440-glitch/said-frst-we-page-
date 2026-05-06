import React from "react";
import { Folder, Briefcase, StickyNote, Sparkles, TrendingUp, Clock, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface DashboardHomeProps {
  stats: {
    files: number;
    projects: number;
    notes: number;
  };
  setActiveTab: (tab: string) => void;
}

export default function DashboardHome({ stats, setActiveTab }: DashboardHomeProps) {
  const cards = [
    { id: "files", title: "Study Resources", count: stats.files, icon: Folder, color: "text-blue-500", bg: "bg-blue-500/10", label: "Files Uploaded" },
    { id: "portfolio", title: "Project Portfolio", count: stats.projects, icon: Briefcase, color: "text-brand-red", bg: "bg-brand-red/10", label: "Active Projects" },
    { id: "ai", title: "Kloppo Insights", count: stats.notes, icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10", label: "Smart Summaries" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <h1 className="text-4xl sm:text-5xl font-display font-bold text-zinc-900 dark:text-white leading-tight">
             Good morning, <span className="text-brand-red">Scholar.</span>
           </h1>
           <p className="text-zinc-500 dark:text-zinc-400 text-lg">Ready to tackle today's academic goals? SAI is synchronized and ready.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 glass-card !p-3">
           <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
           </div>
           <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Efficiency</p>
              <p className="text-sm font-bold dark:text-white">+12% vs last week</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            whileHover={{ y: -5 }}
            onClick={() => setActiveTab(card.id)}
            className="glass-card group text-left relative overflow-hidden"
          >
            <div className="flex items-start justify-between relative z-10">
               <div className={cn("p-4 rounded-2xl transition-colors", card.bg)}>
                  <card.icon className={cn("w-8 h-8", card.color)} />
               </div>
               <ArrowUpRight className="w-5 h-5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all translate-x--2 group-hover:translate-x-0" />
            </div>
            <div className="mt-8 relative z-10">
               <span className="text-4xl font-display font-bold dark:text-white">{card.count}</span>
               <p className="text-zinc-500 font-medium mt-1">{card.title}</p>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-6 relative z-10 italic opacity-60">
              {card.label}
            </p>
            
            {/* Background Glow Decor */}
            <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 blur-[60px] opacity-20 transition-all group-hover:scale-150", 
               card.id === 'files' ? 'bg-blue-500' : card.id === 'portfolio' ? 'bg-brand-red' : 'bg-amber-500')} />
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="glass-card space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-red" /> Recent Activity
               </h3>
               <button className="text-xs font-bold text-brand-red hover:underline decoration-2 underline-offset-4 uppercase tracking-widest">Real-time Sync</button>
            </div>
            <div className="space-y-4">
               {[
                 { action: "Uploaded", item: "Data_Structures_Lecture_04.pdf", time: "2 hours ago" },
                 { action: "Summarized", item: "Operating Systems Notes", time: "5 hours ago" },
                 { action: "Updated", item: "Portfolio: ML Study Case", time: "1 day ago" }
               ].map((act, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all text-sm">
                    <div className="flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full bg-brand-red"></span>
                       <span className="text-zinc-400 font-medium">{act.action}</span>
                       <span className="dark:text-zinc-200 font-semibold">{act.item}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{act.time}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="glass-card relative overflow-hidden bg-gradient-to-br from-brand-red/5 to-transparent">
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-brand-red rounded-lg">
                     <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white uppercase tracking-tight">AI Insights</h3>
               </div>
               <div className="flex-1 space-y-4">
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                    "Based on your recent uploads, I've noticed a heavy focus on Systems Architecture. Would you like me to generate a comparative study guide between your current notes and the textbook PDF?"
                  </p>
                  <button 
                     onClick={() => setActiveTab('ai')}
                     className="w-full h-12 glass border-brand-red/20 text-brand-red font-bold rounded-xl hover:bg-brand-red hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                     Review AI Suggestions <ArrowUpRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/10 blur-[80px] -translate-y-1/2 translate-x-1/2" />
         </div>
      </div>
    </div>
  );
}
