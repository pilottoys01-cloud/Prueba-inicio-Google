import React, { useState, useEffect } from "react";
import { User, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { Note } from "../types";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Calendar, 
  User as UserIcon, 
  Check, 
  X, 
  Sparkles, 
  ShieldAlert,
  Save,
  CheckSquare,
  FlaskConical
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  user: User;
}

const NOTE_COLORS = [
  { name: "Emerald", class: "bg-emerald-950/40 border-emerald-500/20 text-emerald-300", accent: "bg-emerald-500" },
  { name: "Teal", class: "bg-teal-950/40 border-teal-500/20 text-teal-300", accent: "bg-teal-500" },
  { name: "Indigo", class: "bg-indigo-950/40 border-indigo-500/20 text-indigo-300", accent: "bg-indigo-500" },
  { name: "Violet", class: "bg-violet-950/40 border-violet-500/20 text-violet-300", accent: "bg-violet-500" },
  { name: "Amber", class: "bg-amber-950/40 border-amber-500/20 text-amber-300", accent: "bg-amber-500" },
  { name: "Rose", class: "bg-rose-950/40 border-rose-500/20 text-rose-300", accent: "bg-rose-500" },
  { name: "Slate", class: "bg-slate-800/40 border-slate-700/30 text-slate-300", accent: "bg-slate-500" }
];

export default function Dashboard({ user }: DashboardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Note Form State
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("Emerald");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editContent, setEditContent] = useState<string>("");

  // Salt Shaker Interactive States
  const [saltLevel, setSaltLevel] = useState<number>(0);
  const [isSalted, setIsSalted] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [localParticles, setLocalParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [bgSaltGrains, setBgSaltGrains] = useState<{ id: number; left: number; delay: number; duration: number; size: number }[]>([]);

  // Real-time listener for user salt state in Firestore
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSaltLevel(data.saltLevel || 0);
        setIsSalted(data.isSalted || false);
      }
    }, (err) => {
      console.error("Error al escuchar estado del salero:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // Generate background falling salt grains when the state is active
  useEffect(() => {
    if (isSalted && saltLevel > 0) {
      const grains = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 5 + Math.random() * 7,
        size: 1.5 + Math.random() * 2.5
      }));
      setBgSaltGrains(grains);
    } else {
      setBgSaltGrains([]);
    }
  }, [isSalted, saltLevel]);

  const handleShakeSalero = async () => {
    setIsShaking(true);
    
    // Spawn falling salt grains near the shaker
    const newParticles = Array.from({ length: 14 }).map((_, i) => ({
      id: Date.now() + i,
      x: -45 + Math.random() * 90,
      y: 50 + Math.random() * 70
    }));
    
    setLocalParticles(prev => [...prev, ...newParticles]);
    
    setTimeout(() => {
      setLocalParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1200);

    setTimeout(() => {
      setIsShaking(false);
    }, 600);

    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        saltLevel: saltLevel + 1,
        isSalted: true
      }, { merge: true });
    } catch (err) {
      console.error("Error al actualizar salero:", err);
    }
  };

  const getSaltStatus = (level: number) => {
    if (level === 0) return { text: "Sabor Neutro 🍲", desc: "¡Agita el salero para sazonar tu panel!", color: "text-slate-400" };
    if (level <= 3) return { text: "Toque de Sazón ✨", desc: "Unos pocos granos de sal en tu tablero.", color: "text-emerald-400 font-semibold" };
    if (level <= 7) return { text: "Sabor Perfecto 🧂", desc: "La proporción justa de sal de mesa.", color: "text-teal-400 font-semibold" };
    if (level <= 12) return { text: "¡Bien Salado! 💥", desc: "¡Sabor robusto e intenso en tu sesión!", color: "text-amber-400 font-semibold" };
    if (level <= 18) return { text: "¡Océano Atlántico! 🌊", desc: "¡Mucha sal! Agua marina purísima en todo tu tablero.", color: "text-violet-400 font-semibold" };
    return { text: "¡Sodio Extremo! ☢️", desc: "¡Has saturado las leyes de la física culinaria!", color: "text-rose-400 font-bold" };
  };

  // Synchronize User profile info with Firestore users collection (Durable storage & compliance)
  useEffect(() => {
    if (!user) return;

    const syncUserProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          lastSignIn: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error al sincronizar perfil de usuario:", err);
      }
    };

    syncUserProfile();
  }, [user]);

  // Real-time Firestore Notes synchronization
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const notesCollectionRef = collection(db, "users", user.uid, "notes");
    const q = query(notesCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesList: Note[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notesList.push({
          id: docSnap.id,
          userId: data.userId,
          title: data.title,
          content: data.content,
          createdAt: data.createdAt,
          color: data.color
        });
      });
      setNotes(notesList);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error en onSnapshot de notas:", err);
      setError("No se pudieron cargar tus notas. Comprueba tus reglas de seguridad.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    try {
      // Clear the salt shaker state in Firestore upon active logout as requested by the user
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        saltLevel: 0,
        isSalted: false
      });
      await signOut(auth);
    } catch (err) {
      console.error("Error al restablecer salero o cerrar sesión:", err);
      // Fallback sign out if doc update fails
      try {
        await signOut(auth);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const noteId = Math.random().toString(36).substring(2, 15);
      const noteDocRef = doc(db, "users", user.uid, "notes", noteId);

      const notePayload = {
        id: noteId,
        userId: user.uid,
        title: title.trim() || "Nota sin título",
        content: content.trim(),
        createdAt: new Date().toISOString(),
        color: selectedColor
      };

      await setDoc(noteDocRef, notePayload);

      // Reset form
      setTitle("");
      setContent("");
      setSelectedColor("Emerald");
    } catch (err: any) {
      console.error("Error al guardar la nota:", err);
      setError(`Vulnerabilidad de esquema o regla bloqueada: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const noteDocRef = doc(db, "users", user.uid, "notes", noteId);
      await deleteDoc(noteDocRef);
    } catch (err: any) {
      console.error("Error al eliminar nota:", err);
      setError(`No se pudo eliminar: ${err.message}`);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title || "");
    setEditContent(note.content);
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const noteDocRef = doc(db, "users", user.uid, "notes", noteId);
      await updateDoc(noteDocRef, {
        title: editTitle.trim() || "Nota sin título",
        content: editContent.trim()
      });
      setEditingNoteId(null);
    } catch (err: any) {
      console.error("Error al actualizar nota:", err);
      setError(`No se pudo actualizar: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 relative overflow-hidden">
      {/* Falling Salt Grains Background */}
      {isSalted && bgSaltGrains.map((grain) => (
        <motion.div
          key={grain.id}
          className="absolute rounded-full bg-white/70 pointer-events-none z-0"
          style={{
            left: `${grain.left}%`,
            width: grain.size,
            height: grain.size,
            top: -10,
          }}
          animate={{
            y: ["0vh", "105vh"],
            x: ["0px", `${(grain.id % 2 === 0 ? 1 : -1) * 35}px`, "0px"],
            opacity: [0, 0.75, 0.75, 0],
          }}
          transition={{
            duration: grain.duration,
            repeat: Infinity,
            delay: grain.delay,
            ease: "linear",
          }}
        />
      ))}

      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
              Google Secure Panel
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/30 hover:border-slate-700/80 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: User Profile & Quick Creation */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* User Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "Avatar"} 
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <UserIcon className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {user.displayName || "Usuario"}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800/60 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-2xl">
                <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  Acceso
                </span>
                <span className="text-xs font-semibold text-emerald-400 mt-1 block">
                  Redirect Flow
                </span>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-2xl">
                <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  Firebase ID
                </span>
                <span className="text-xs font-semibold text-teal-400 mt-1 block truncate max-w-full">
                  {user.uid.slice(0, 8)}...
                </span>
              </div>
            </div>
          </motion.div>

          {/* Interactive Salt Shaker Card (El Salero Mágico) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-xl"
          >
            {/* Top decorative shaker background light */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex flex-col items-center text-center">
              {/* Shaker container */}
              <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                
                {/* Simulated falling salt particles from shaker when clicked */}
                <AnimatePresence>
                  {localParticles.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                      animate={{ opacity: 0, y: p.y, x: p.x, scale: 0.4 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute w-1.5 h-1.5 bg-white rounded-full pointer-events-none shadow-xs shadow-white"
                      style={{ top: "60%" }}
                    />
                  ))}
                </AnimatePresence>

                {/* Shaker shaker bottle */}
                <motion.div
                  animate={isShaking ? {
                    rotate: [0, -35, -55, -25, -55, -20, 0],
                    y: [0, -10, 8, -5, 6, -2, 0],
                  } : {
                    rotate: 0,
                    y: 0,
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl bg-linear-to-b from-slate-700/30 to-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-inner relative group cursor-pointer"
                  onClick={handleShakeSalero}
                >
                  {/* Salt level fill visual inside the shaker */}
                  <div 
                    className="absolute bottom-1 left-1 right-1 rounded-b-xl bg-white/10 border-t border-white/20 transition-all duration-300"
                    style={{ height: `${Math.max(15, 60 - saltLevel * 2.5)}%` }}
                  />

                  {/* Metal Grid cap on top */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-slate-600 rounded-t-md border-b border-slate-700 flex items-center justify-center gap-0.5">
                    <div className="w-1 h-1 bg-slate-900 rounded-full" />
                    <div className="w-1 h-1 bg-slate-900 rounded-full" />
                    <div className="w-1 h-1 bg-slate-900 rounded-full" />
                  </div>

                  <FlaskConical className="w-8 h-8 text-white relative z-10 drop-shadow-md group-hover:scale-105 transition-transform" />
                </motion.div>
              </div>

              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                Salero Mágico
              </span>
              
              <h4 className={`text-sm mt-1.5 ${getSaltStatus(saltLevel).color}`}>
                {getSaltStatus(saltLevel).text}
              </h4>
              
              <p className="text-xs text-slate-400 mt-1 max-w-xs px-2 leading-relaxed">
                {getSaltStatus(saltLevel).desc}
              </p>

              <div className="w-full mt-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">Pizcas esparcidas:</span>
                <span className="text-xs font-bold text-white font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                  {saltLevel}
                </span>
              </div>

              <button
                onClick={handleShakeSalero}
                disabled={isShaking}
                className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/50 py-2 px-4 rounded-xl font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                ¡Agitar Salero!
              </button>
            </div>
          </motion.div>

          {/* Quick Note Creation Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Nueva Nota Sincronizada
            </h3>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Título (opcional)
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Ej: Pendiente urgente" 
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Contenido
                </label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={2000}
                  required
                  placeholder="Escribe el contenido de tu nota aquí..." 
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">
                  Paleta de Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        selectedColor === color.name 
                          ? "border-white ring-2 ring-emerald-500/30 scale-105" 
                          : "border-slate-800 hover:border-slate-600"
                      }`}
                      style={{ backgroundColor: color.name === "Slate" ? "#334155" : undefined }}
                    >
                      <span className={`w-3 h-3 rounded-full ${color.accent}`} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Guardar en la Nube
                  </>
                )}
              </button>
            </form>
          </motion.div>

        </div>

        {/* Right Column: Dynamic Notes Board */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Tablero de Notas
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {notes.length} {notes.length === 1 ? "nota" : "notas"} guardadas
            </span>
          </div>

          {error && (
            <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-2xl flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Cargando notas sincronizadas...</p>
            </div>
          ) : notes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300 mb-1">
                No hay notas en la nube
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crea tu primera nota en el panel izquierdo. Se guardará de manera segura en Cloud Firestore asociada únicamente a tu UID de Google.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {notes.map((note) => {
                  const colorConfig = NOTE_COLORS.find(c => c.name === note.color) || NOTE_COLORS[0];
                  const isEditing = editingNoteId === note.id;

                  return (
                    <motion.div
                      layout
                      key={note.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`p-5 rounded-2xl border flex flex-col justify-between shadow-xs transition-colors ${colorConfig.class}`}
                    >
                      {isEditing ? (
                        <div className="space-y-3 w-full">
                          <input 
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            maxLength={100}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-hidden"
                          />
                          <textarea 
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            maxLength={2000}
                            rows={3}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden resize-none"
                          />
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateNote(note.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                              title="Guardar"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <h4 className="text-sm font-semibold text-white tracking-tight line-clamp-1">
                                {note.title || "Nota sin título"}
                              </h4>
                              
                              <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditing(note)}
                                  className="p-1 rounded-md hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1 rounded-md hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                              {note.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/30 text-[10px] text-slate-500 font-mono">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(note.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
