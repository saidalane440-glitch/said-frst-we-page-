import React, { useState, useEffect } from "react";
import { Plus, StickyNote, Trash2, Search, Calendar, ChevronRight, Save, Clock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserNote } from "../types";
import { cn } from "../lib/utils";
import { db, auth } from "../lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

interface MyNotesProps {
  searchQuery?: string;
}

export default function MyNotes({ searchQuery = "" }: MyNotesProps) {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const userId = auth.currentUser?.uid;
  const notesRef = userId ? collection(db, "users", userId, "notes") : null;

  useEffect(() => {
    if (!notesRef) return;

    const q = query(notesRef, orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserNote[];
      setNotes(notesData);
      setLoading(false);
      if (!activeNoteId && notesData.length > 0) {
        setActiveNoteId(notesData[0].id);
      }
    }, (error) => {
      console.error("Firestore Error (Notes):", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleUpdateNote = async (id: string, updates: Partial<UserNote>) => {
    if (!notesRef) return;
    setSaving(true);
    try {
      const noteDoc = doc(notesRef, id);
      await updateDoc(noteDoc, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error("Update Note Error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!notesRef || !userId) return;
    const now = Date.now();
    console.log("Adding new note to Firestore...");
    try {
      const docRef = await addDoc(notesRef, {
        title: "New Note",
        content: "",
        createdAt: now,
        updatedAt: now,
        userId: userId
      });
      console.log("Note added successfully with ID:", docRef.id);
      setActiveNoteId(docRef.id);
    } catch (err) {
      console.error("Add Note Error:", err);
      console.log("Exact error details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!notesRef) return;
    try {
      await deleteDoc(doc(notesRef, id));
      if (activeNoteId === id) {
        setActiveNoteId(notes.find(n => n.id !== id)?.id || null);
      }
    } catch (err) {
      console.error("Delete Note Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Sidebar List */}
      <div className="w-80 flex flex-col gap-4">
        <button 
          onClick={handleAddNote}
          className="btn-primary w-full flex items-center justify-center gap-2 h-14 shrink-0"
        >
          <Plus className="w-5 h-5" /> New Note
        </button>

        <div className="glass-card !p-0 flex-1 flex flex-col overflow-hidden">
           <div className="p-4 border-b border-white/10">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                 <input 
                    type="text" 
                    placeholder="Search notes..." 
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-red/30"
                 />
              </div>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {notes.length === 0 ? (
                <div className="text-center p-8 opacity-40">
                  <StickyNote className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs">No notes yet</p>
                </div>
              ) : filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all group relative",
                    activeNoteId === note.id 
                      ? "bg-brand-red text-white shadow-lg shadow-red-500/10" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-white/10 dark:hover:bg-white/5"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold truncate pr-6">{note.title || "Untitled Note"}</h4>
                    <ChevronRight className={cn("w-4 h-4 transition-transform", activeNoteId === note.id ? "rotate-90" : "opacity-0 group-hover:opacity-100")} />
                  </div>
                  <p className={cn("text-xs line-clamp-2 leading-relaxed opacity-70")}>
                    {note.content || "Empty content..."}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] opacity-60">
                    <Calendar className="w-3 h-3" />
                    {new Date(note.updatedAt || Date.now()).toLocaleDateString()}
                  </div>
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Editor Space */}
      <div className="flex-1 glass-card flex flex-col bg-white/40 dark:bg-black/20">
        <AnimatePresence mode="wait">
          {activeNote ? (
            <motion.div 
              key={activeNoteId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-8">
                 <input 
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => handleUpdateNote(activeNote.id, { title: e.target.value })}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-3xl font-display font-bold text-zinc-900 dark:text-white p-0 placeholder-zinc-300 dark:placeholder-zinc-700"
                    placeholder="Note Title"
                 />
                 <div className="flex items-center gap-4 text-zinc-400 text-xs">
                    <span className="flex items-center gap-1.5">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                      {saving ? "Saving..." : "Auto-saved"}
                    </span>
                    <button 
                      onClick={() => handleDeleteNote(activeNote.id)}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
              </div>

              <textarea 
                value={activeNote.content}
                onChange={(e) => handleUpdateNote(activeNote.id, { content: e.target.value })}
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 resize-none custom-scrollbar p-0 placeholder-zinc-300 dark:placeholder-zinc-800"
                placeholder="Start writing your thoughts..."
              />
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                 <StickyNote className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold">No Note Selected</h3>
                <p>Pick a note from the list or create a new one to begin</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
