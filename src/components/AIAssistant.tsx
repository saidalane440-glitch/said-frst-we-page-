import React, { useState, useEffect } from "react";
import { Sparkles, Send, FileUp, Loader2, Download, Copy, CheckCircle2, FileText } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { db, auth } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { UploadedFile } from "../types";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Helper to convert file to base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export default function AIAssistant() {
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userFiles, setUserFiles] = useState<UploadedFile[]>([]);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "users", userId, "files"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UploadedFile[]);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleSummarize = async () => {
    if (!file && !textContent && !selectedFileUrl) return;
    setLoading(true);
    setSummary("");
    console.log("Starting Kloppo analysis...", { 
      hasFile: !!file, 
      hasTextContent: !!textContent, 
      hasSelectedFile: !!selectedFileUrl 
    });

    try {
      let promptParts: any[] = [
        { text: `You are Kloppo, a professional academic assistant. 
Summarize the following content into clean, bulleted notes that are easy for a student to study. 
If images or diagrams are provided, describe them and explain their significance in the context of the material.
Focus on key concepts, definitions, and actionable takeaways.` }
      ];

      if (file) {
        if (file.type.startsWith('image/')) {
          const imagePart = await fileToGenerativePart(file);
          promptParts.push(imagePart);
          promptParts.push({ text: `Please analyze this diagram/image titled "${file.name}". 
            Explain its components, the relationship between elements, and how it connects to academic concepts. 
            Include a "Visual Breakdown" section in your summary.` });
        } else if (file.type === 'application/pdf' || file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          // For text-based files, we read the content
          const text = await file.text();
          promptParts.push({ text: `Content from ${file.name}:\n${text.substring(0, 30000)}` });
        } else {
          promptParts.push({ text: `[File provided: ${file.name}. Note: I cannot read this specific binary format yet, but please suggest study tips for a file with this name.]` });
        }
      } else if (selectedFileUrl) {
        const selected = userFiles.find(f => f.url === selectedFileUrl);
        promptParts.push({ text: `Analyze the context of the user's uploaded file: ${selected?.name || "Resource"}. Search for relevant topics if possible or provide general guidance.` });
      }

      if (textContent) {
        promptParts.push({ text: `Additional context or text to summarize: ${textContent}` });
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: promptParts },
      });

      if (response.text) {
        console.log("Kloppo analysis generated successfully");
        setSummary(response.text);
      } else {
        throw new Error("Kloppo failed - empty response");
      }
    } catch (err) {
      console.error("Kloppo Error:", err);
      setSummary("Sorry, I (Kloppo) encountered an error while processing your request. Please ensure your file is valid or try again with text.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red/10 text-brand-red border border-brand-red/20 text-sm font-semibold">
          <Sparkles className="w-4 h-4" />
          Powered by Kloppo AI
        </div>
        <h2 className="text-4xl font-display font-bold text-zinc-900 dark:text-white">Kloppo Assistant</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
          Upload textbooks, lecture notes, or paste text. Kloppo will generate clean, structured study points in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Side */}
        <div className="space-y-6">
          <div className="glass-card flex flex-col h-[400px]">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 uppercase text-xs tracking-widest flex items-center gap-2">
                   <FileUp className="w-4 h-4" /> Input Content
                </h3>
             </div>
             <textarea 
                value={textContent}
                onChange={(e) => { setTextContent(e.target.value); setFile(null); }}
                placeholder="Paste your notes here or upload a file below..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-brand-red/30 resize-none"
             />
             <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                <input 
                   type="file" 
                   id="file-upload" 
                   className="hidden" 
                   onChange={(e) => {
                     if (e.target.files?.[0]) {
                       setFile(e.target.files[0]);
                       setTextContent("");
                       setSelectedFileUrl(null);
                     }
                   }}
                />
                <label 
                   htmlFor="file-upload"
                   className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-brand-red/30 hover:bg-white/5 transition-all text-zinc-500 hover:text-brand-red"
                >
                   {file ? (
                     <span className="text-brand-red font-medium">{file.name}</span>
                   ) : (
                     <>
                        <Download className="w-5 h-5 rotate-180" />
                        <span>Upload New File for Summary</span>
                     </>
                   )}
                </label>

                {userFiles.length > 0 && (
                   <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Or select already uploaded</p>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                         {userFiles.map((f) => (
                            <button
                               key={f.id}
                               onClick={() => { setSelectedFileUrl(f.url); setFile(null); setTextContent(""); }}
                               className={cn(
                                 "flex items-center gap-3 p-3 rounded-lg border border-white/10 text-left transition-all",
                                 selectedFileUrl === f.url ? "bg-brand-red/20 border-brand-red/40 text-brand-red" : "bg-white/5 hover:bg-white/10 text-zinc-400"
                               )}
                            >
                               <FileText className="w-4 h-4 shrink-0" />
                               <span className="text-sm truncate">{f.name}</span>
                            </button>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          </div>
          <button 
             onClick={handleSummarize}
             disabled={loading || (!file && !textContent && !selectedFileUrl)}
             className="w-full btn-primary h-14 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:scale-100"
          >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
             {loading ? "Kloppo is thinking..." : "Summarize with Kloppo"}
          </button>
        </div>

        {/* Output Side */}
        <div className="glass-card flex flex-col h-[480px] md:h-full relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 uppercase text-xs tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Generated Summary
            </h3>
            {summary && (
              <button 
                onClick={handleCopy}
                className="p-2 hover:bg-white/10 rounded-lg transition-all text-zinc-500 hover:text-brand-red"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar border border-white/10 rounded-xl bg-white/5 p-6 prose prose-zinc dark:prose-invert">
            {summary ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap"
              >
                {summary}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red">
                  <Sparkles className="w-10 h-10" />
                </div>
                <p>Kloppo is ready to analyze your notes</p>
              </div>
            )}
          </div>
          
          {/* Subtle Glow Decor */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-red/10 blur-[60px] pointer-events-none group-hover:bg-brand-red/20 transition-all" />
        </div>
      </div>
    </div>
  );
}
