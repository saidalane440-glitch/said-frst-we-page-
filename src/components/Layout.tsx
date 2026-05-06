import React, { useState, useEffect } from "react";
import { Sun, Moon, Search, Bell, User, LayoutDashboard, FolderOpen, Briefcase, FileText, Settings, LogOut, Menu, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { auth } from "../lib/firebase";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearch: (query: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab, onSearch }: LayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [bgImage, setBgImage] = useState("");

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Home" },
    { id: "files", icon: FolderOpen, label: "Resources" },
    { id: "portfolio", icon: Briefcase, label: "Projects" },
    { id: "ai", icon: Sparkles, label: "Kloppo AI" },
    { id: "notes", icon: FileText, label: "Manual Notes" },
  ];

  useEffect(() => {
    // Picsum provides a random image every time it's hit
    setBgImage(`https://picsum.photos/1920/1080?t=${Date.now()}`); 
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen relative overflow-hidden flex transition-colors duration-500 bg-zinc-50 dark:bg-zinc-950">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center transition-all duration-1000 z-0 scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 z-0 bg-white/40 dark:bg-black/70 backdrop-blur-[1px]" />

      {/* Overlay for mobile when sidebar is open */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 80,
          x: isSidebarOpen ? 0 : (window.innerWidth < 768 ? -280 : 0)
        }}
        className={cn(
          "fixed md:relative z-40 h-[calc(100vh-2rem)] flex flex-col m-4 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300",
          "bg-white dark:bg-zinc-950 backdrop-blur-2xl border border-zinc-200 dark:border-white/10",
          !isSidebarOpen && "md:w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-display font-bold text-brand-red flex items-center gap-2">
              <span className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center text-white text-xs">SAI</span>
              SAI Dashboard
            </motion.span>
          ) : (
            <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center text-white text-[10px] mx-auto">SAI</div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all relative group",
                activeTab === item.id 
                  ? "bg-brand-red text-white shadow-lg shadow-red-500/30" 
                  : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-95"
              )}
            >
              <item.icon className={cn("w-6 h-6 shrink-0", activeTab === item.id ? "text-white" : "text-zinc-600 dark:text-zinc-400 group-hover:text-brand-red")} />
              {isSidebarOpen && <span className="font-bold whitespace-nowrap">{item.label}</span>}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 px-3 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all mb-4 text-zinc-500"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          </button>
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut className={cn("w-6 h-6", isSidebarOpen ? "" : "mx-auto")} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 h-screen relative z-10 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 mt-4 mx-4 glass rounded-2xl">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-brand-red transition-colors" />
              <input 
                type="text"
                placeholder="Search resources, files, or notes..."
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-white/5 border-white/10 border py-2.5 pl-12 pr-4 rounded-xl focus:outline-none focus:border-brand-red/50 transition-all text-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-8">
            <div className="hidden sm:flex flex-col items-end border-r border-zinc-200 dark:border-white/10 pr-4">
              <span className="text-xs font-bold text-brand-red uppercase tracking-wider">Ready for Launch</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Welcome, Student</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-red/20 border border-brand-red/30 p-1">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-red to-red-600 flex items-center justify-center text-white text-xs font-bold">
                SA
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 glass-card !p-2 block"
            >
              <Menu className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </header>

        {/* Dash Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
