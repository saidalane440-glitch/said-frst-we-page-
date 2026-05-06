import React, { useState, useEffect } from "react";
import { Plus, ExternalLink, Image as ImageIcon, Trash2, Edit3, Briefcase, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PortfolioProject } from "../types";
import { cn } from "../lib/utils";
import { db, auth } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";

interface PortfolioProps {
  searchQuery?: string;
}

export default function Portfolio({ searchQuery = "" }: PortfolioProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", imageUrl: "", link: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = auth.currentUser?.uid;
  const projectsRef = userId ? collection(db, "users", userId, "projects") : null;

  useEffect(() => {
    if (!projectsRef) return;
    const q = query(projectsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PortfolioProject[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProject = async () => {
    if (!projectsRef || !userId || !formData.title) return;
    setIsSubmitting(true);
    console.log("Adding project to Firestore...", formData);
    try {
      await addDoc(projectsRef, {
        ...formData,
        userId,
        createdAt: Date.now()
      });
      console.log("Project added successfully");
      setShowAddModal(false);
      setFormData({ title: "", description: "", imageUrl: "", link: "" });
    } catch (err) {
      console.error("Add Project Error:", err);
      console.log("Exact error details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!projectsRef) return;
    try {
      await deleteDoc(doc(projectsRef, id));
    } catch (err) {
      console.error("Delete Project Error:", err);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-zinc-900 dark:text-white">Project Showcase</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Curate and display your academic achievements</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center text-center p-20 space-y-4 opacity-50">
           <Briefcase className="w-16 h-16" />
           <div>
             <h3 className="text-xl font-bold">No Projects Found</h3>
             <p>Start by adding your first academic project to your portfolio</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div
                layout
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card !p-0 overflow-hidden group flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden">
                  {project.imageUrl ? (
                    <img 
                      src={project.imageUrl} 
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-red/10 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-brand-red/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                     <div className="flex gap-2">
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 bg-red-500/40 backdrop-blur-md rounded-lg hover:bg-red-500/60 transition-all text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                </div>

                <div className="p-6 space-y-3 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-brand-red transition-colors">{project.title}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed flex-1 line-clamp-3">
                    {project.description}
                  </p>
                  
                  <div className="pt-4 flex items-center justify-between border-t border-white/10 mt-auto">
                     <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Project #{project.id.slice(0, 4)}</span>
                     {project.link && (
                       <a 
                        href={project.link} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-red hover:underline"
                       >
                          View Project <ExternalLink className="w-3.5 h-3.5" />
                       </a>
                     )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="glass-card w-full max-w-lg relative z-10"
           >
              <div className="flex items-center gap-3 mb-6">
                 <Briefcase className="w-6 h-6 text-brand-red" />
                 <h3 className="text-2xl font-bold dark:text-white">Add New Project</h3>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Project Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-red/40" 
                      placeholder="e.g. Thesis Research" 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-red/40 h-32" 
                      placeholder="Tell us about the project..." 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Image URL (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-red/40" 
                      placeholder="https://..." 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Project Link (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-red/40" 
                      placeholder="https://github.com/..." 
                    />
                 </div>
                 <div className="flex gap-4 mt-8">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 px-6 rounded-xl font-bold bg-zinc-800 text-white hover:bg-zinc-700 transition-all">Cancel</button>
                    <button 
                      onClick={handleAddProject}
                      disabled={isSubmitting || !formData.title}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Project"}
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}
