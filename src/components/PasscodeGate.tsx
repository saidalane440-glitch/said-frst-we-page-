import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";

interface PasscodeGateProps {
  onSuccess: () => void;
}

export default function PasscodeGate({ onSuccess }: PasscodeGateProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const CORRECT_PASSCODE = "2024"; // Simple default or from env if sensitive

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === CORRECT_PASSCODE) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
      setPasscode("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm"
        style={{ backgroundImage: "url('https://picsum.photos/1920/1080')" }}
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md relative z-10 border-white/20 bg-black/40"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-brand-red/20 rounded-full">
            <Lock className="w-10 h-10 text-brand-red" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Access Control</h1>
            <p className="text-zinc-400 mt-2">Enter the SAI passcode to continue to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative group">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Passcode"
                className={`w-full bg-white/5 border-2 ${error ? 'border-red-500 animate-shake' : 'border-white/10 group-focus-within:border-brand-red/50'} rounded-xl py-4 px-6 text-xl text-center text-white placeholder-white/20 focus:outline-none transition-all tracking-widest`}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary h-14 text-lg flex items-center justify-center gap-2"
            >
              Enter Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Student Access</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
