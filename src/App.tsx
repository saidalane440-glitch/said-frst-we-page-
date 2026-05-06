/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import PasscodeGate from "./components/PasscodeGate";
import Layout from "./components/Layout";
import DashboardHome from "./components/DashboardHome";
import FileManagement from "./components/FileManagement";
import Portfolio from "./components/Portfolio";
import AIAssistant from "./components/AIAssistant";
import MyNotes from "./components/MyNotes";
import { auth, signInWithGoogle, db } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { LogIn, Sparkles } from "lucide-react";

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ files: 0, projects: 0, notes: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const filesUnsub = onSnapshot(collection(db, "users", user.uid, "files"), (s) => 
      setStats(prev => ({ ...prev, files: s.size }))
    );
    const projectsUnsub = onSnapshot(collection(db, "users", user.uid, "projects"), (s) => 
      setStats(prev => ({ ...prev, projects: s.size }))
    );
    const notesUnsub = onSnapshot(collection(db, "users", user.uid, "notes"), (s) => 
      setStats(prev => ({ ...prev, notes: s.size }))
    );

    return () => {
      filesUnsub();
      projectsUnsub();
      notesUnsub();
    };
  }, [user]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome stats={stats} setActiveTab={setActiveTab} />;
      case "files":
        return <FileManagement searchQuery={searchQuery} />;
      case "portfolio":
        return <Portfolio searchQuery={searchQuery} />;
      case "ai":
        return <AIAssistant />;
      case "notes":
        return <MyNotes searchQuery={searchQuery} />;
      default:
        return <DashboardHome stats={stats} setActiveTab={setActiveTab} />;
    }
  };

  if (!authorized) {
    return <PasscodeGate onSuccess={() => setAuthorized(true)} />;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white space-y-4">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs">Initializing SAI...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 p-4">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://picsum.photos/1920/1080')" }}
        />
        <div className="glass-card max-w-sm w-full text-center space-y-8 relative z-10 border-white/10 shadow-2xl">
           <div className="w-20 h-20 bg-brand-red rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-red-500/20 rotate-3">
              <Sparkles className="w-10 h-10 text-white" />
           </div>
           <div>
              <h2 className="text-3xl font-display font-bold text-white">Unlock Your Vault</h2>
              <p className="text-zinc-400 mt-2">Sign in to securely access your personal summaries and files.</p>
           </div>
           <button 
              onClick={signInWithGoogle}
              className="w-full btn-primary h-14 flex items-center justify-center gap-3 text-lg"
           >
              <LogIn className="w-5 h-5" /> Sign in with Google
           </button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onSearch={setSearchQuery}
    >
      {renderContent()}
    </Layout>
  );
}
