import React, { useState, useEffect } from "react";
import { FolderPlus, FileText, LayoutGrid, List, Search, MoreVertical, Trash2, Download as DownloadIcon, Loader2, Sparkles, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UploadedFile } from "../types";
import { cn } from "../lib/utils";
import { db, auth, storage, signInWithGoogle, getDriveToken } from "../lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";

export default function FileManagement({ searchQuery = "" }: { searchQuery?: string }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'image' | 'pdf' | 'other'>('all');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(getDriveToken());

  useEffect(() => {
    setDriveToken(getDriveToken());
  }, []);

  const userId = auth.currentUser?.uid;
  const filesRef = userId ? collection(db, "users", userId, "files") : null;

  useEffect(() => {
    if (!filesRef) return;
    const q = query(filesRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeFiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UploadedFile[];
      setFiles(activeFiles);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Listen Error:", err);
      setError("Failed to sync files. Please check your connection.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'image' && f.type.startsWith('image/')) ||
                         (filter === 'pdf' && f.type.includes('pdf')) ||
                         (filter === 'other' && !f.type.startsWith('image/') && !f.type.includes('pdf'));
    return matchesSearch && matchesFilter;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !filesRef) return;

    setUploading(true);
    setError(null);
    try {
      const timestamp = Date.now();
      
      const currentToken = getDriveToken();
      
      if (currentToken) {
        console.log("Uploading to Google Drive...", file.name);
        const metadata = {
          name: file.name,
          mimeType: file.type,
          description: "Uploaded via Kloppo Dashboard"
        };
        
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);

        const driveResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
          body: formData
        });

        if (!driveResponse.ok) {
          if (driveResponse.status === 401) {
             setError("Drive session expired. Please re-connect.");
             localStorage.removeItem('google_drive_token');
             localStorage.removeItem('google_drive_token_expiry');
             setDriveToken(null);
          }
          const errData = await driveResponse.json();
          throw new Error(errData.error?.message || "Google Drive upload failed");
        }

        const driveFile = await driveResponse.json();
        
        await addDoc(filesRef, {
          name: file.name,
          type: file.type,
          url: driveFile.webViewLink,
          driveId: driveFile.id,
          size: file.size,
          createdAt: timestamp,
          userId: userId,
          storageSource: 'google_drive'
        });
      } else {
        const sPath = `users/${userId}/files/${timestamp}_${file.name}`;
        const sRef = storageRef(storage, sPath);
        console.log("Starting Firebase upload:", file.name);
        
        const result = await uploadBytes(sRef, file);
        const downloadURL = await getDownloadURL(result.ref);

        await addDoc(filesRef, {
          name: file.name,
          type: file.type,
          url: downloadURL,
          storagePath: sPath,
          size: file.size,
          createdAt: timestamp,
          userId: userId,
          storageSource: 'firebase'
        });
      }
      
      console.log("Upload complete and cataloged in Firestore.");

    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (file: any) => {
    if (!filesRef || !userId) return;
    try {
      if (file.storageSource === 'firebase' && file.storagePath) {
        await deleteObject(storageRef(storage, file.storagePath));
      } else if (file.storageSource === 'google_drive' && file.driveId && driveToken) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${file.driveId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${driveToken}` }
        });
      }
      await deleteDoc(doc(filesRef, file.id));
    } catch (err) {
      console.error("Delete File Error:", err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-zinc-900 dark:text-white">Cloud Workspace</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Securely store and manage your study materials</p>
        </div>
        <div className="relative">
          <input 
            type="file" 
            id="file-upload-main" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label 
            htmlFor="file-upload-main"
            className={cn(
              "btn-primary flex items-center justify-center gap-2 h-12 cursor-pointer w-full sm:w-auto",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FolderPlus className="w-5 h-5" />}
            {uploading ? "Uploading..." : "Upload Files"}
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!driveToken && (
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center sm:text-left">Power up with Google Drive</p>
              <p className="text-xs text-zinc-500">Syncing to Drive enables better file organization and diagram analysis.</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              try {
                await signInWithGoogle();
                setDriveToken(getDriveToken());
                setError(null);
              } catch (err) {
                setError("Failed to connect to Google Drive. Please allow popups.");
              }
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Connect My Drive
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'all', label: 'All Files' },
          { id: 'image', label: 'Images' },
          { id: 'pdf', label: 'PDFs' },
          { id: 'other', label: 'Other' },
        ].map(tf => (
          <button
            key={tf.id}
            onClick={() => setFilter(tf.id as any)}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              filter === tf.id 
                ? "bg-brand-red text-white shadow-lg shadow-red-500/20" 
                : "bg-white/5 dark:bg-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="glass-card !p-2 flex items-center justify-between">
        <div className="flex items-center gap-3 pl-4">
           {searchQuery ? (
             <div className="flex items-center gap-2">
               <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Search:</span>
               <span className="text-sm font-semibold text-brand-red">{searchQuery}</span>
               <button onClick={() => {/* App searches are handled in layout */}} className="text-zinc-400 hover:text-zinc-600">
                 <X className="w-3 h-3" />
               </button>
             </div>
           ) : (
             <div className="flex items-center gap-2 text-zinc-500">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Use the top search bar to find files</span>
             </div>
           )}
        </div>
        <div className="flex items-center gap-1 p-1">
          <button 
             onClick={() => setViewMode('grid')}
             className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-brand-red/10 text-brand-red" : "text-zinc-500 hover:bg-white/10")}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
             onClick={() => setViewMode('list')}
             className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-brand-red/10 text-brand-red" : "text-zinc-500 hover:bg-white/10")}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <label 
              htmlFor="file-upload-main"
              className="border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-brand-red/50 hover:bg-brand-red/5 transition-all cursor-pointer group"
            >
               <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderPlus className="w-6 h-6 text-zinc-400 group-hover:text-brand-red" />
               </div>
               <div>
                  <span className="block font-semibold text-zinc-700 dark:text-zinc-200">New Upload</span>
                  <span className="text-xs text-zinc-500">Max size 25MB</span>
               </div>
            </label>

            {filteredFiles.map((file) => (
              <motion.div 
                layout
                key={file.id}
                className="glass-card group relative p-4 flex flex-col items-center text-center"
              >
                <div className="mb-4">
                   <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red group-hover:rotate-6 transition-transform">
                      <FileText className="w-8 h-8" />
                   </div>
                </div>
                <div className="w-full truncate px-2">
                  <h4 className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">{file.name}</h4>
                  <p className="text-xs text-zinc-500 mt-1">{formatSize(file.size)} • {new Date(file.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDeleteFile(file)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-4 w-full flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                   <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all text-center"
                  >
                    Open
                  </a>
                   <a 
                    href={file.url} 
                    download={file.name}
                    className="p-1.5 bg-brand-red/10 hover:bg-brand-red text-brand-red hover:text-white rounded-lg transition-all"
                  >
                    <DownloadIcon className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card !p-0 overflow-hidden"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-semibold">Name</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-semibold">Size</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-semibold">Modified</th>
                  <th className="px-6 py-4 text-right px-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-brand-red" />
                        <span className="font-medium text-zinc-800 dark:text-zinc-100">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{formatSize(file.size)}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{new Date(file.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-lg text-zinc-500"><DownloadIcon className="w-4 h-4" /></a>
                         <button onClick={() => handleDeleteFile(file)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
