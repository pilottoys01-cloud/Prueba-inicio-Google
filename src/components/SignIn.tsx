import React, { useState, useEffect } from "react";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { LogIn, AlertCircle, ExternalLink, Chrome, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export default function SignIn() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isIframe, setIsIframe] = useState<boolean>(false);

  useEffect(() => {
    // Detect if the app is currently running inside an iframe (like the AI Studio preview)
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }

    // Handle the redirect result when the page loads back
    setIsLoading(true);
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Sesión iniciada con éxito mediante redirección:", result.user);
        }
        setIsLoading(false);
      })
      .catch((err: any) => {
        setIsLoading(false);
        console.error("Error al obtener resultado de redirección:", err);
        if (err.code === "auth/redirect-cancelled-by-user") {
          setError("El inicio de sesión fue cancelado por el usuario.");
        } else if (err.code === "auth/network-request-failed") {
          setError("Error de red. Por favor, verifica tu conexión a internet.");
        } else if (err.code === "auth/popup-blocked" || err.code === "auth/operation-not-allowed") {
          setError("La redirección de autenticación no está permitida en este entorno.");
        } else {
          setError(`Error de autenticación: ${err.message || "Inténtalo de nuevo."}`);
        }
      });
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Execute sign in with redirect directly (no popup/new window)
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      setIsLoading(false);
      console.error("Error al iniciar signInWithRedirect:", err);
      setError(`No se pudo iniciar el proceso de redirección: ${err.message}`);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black p-4 select-none">
      {/* Decorative background lights */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2 font-sans">
            Acceso Seguro
          </h1>
          <p className="text-sm text-slate-400 font-sans max-w-xs mx-auto">
            Inicia sesión con tu cuenta de Google mediante redirección directa, asegurando que no se abrirá ninguna otra ventana.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-300 leading-relaxed font-sans">
              <span className="font-semibold block mb-0.5">Atención:</span>
              {error}
            </div>
          </motion.div>
        )}

        {isIframe ? (
          <div className="space-y-6">
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-start gap-3">
              <Chrome className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed font-sans">
                <span className="font-semibold text-white block mb-1">Entorno de AI Studio Detectado</span>
                Google bloquea los flujos de autenticación mediante redirección dentro de marcos integrados (iframes). 
                Para iniciar sesión de forma segura y sin ventanas emergentes extra, abre la aplicación en una nueva pestaña.
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenInNewTab}
              className="w-full relative flex items-center justify-center gap-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 px-4 rounded-2xl font-medium shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer text-sm font-sans"
            >
              <ExternalLink className="w-5 h-5" />
              Abrir en pestaña nueva
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full relative flex items-center justify-center gap-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 px-4 rounded-2xl font-medium shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 disabled:opacity-50 cursor-pointer text-sm font-sans"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar sesión con Google
                </>
              )}
            </motion.button>
          </div>
        )}

        <div className="mt-8 text-center border-t border-slate-800/60 pt-6">
          <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
            Autenticación Segura • Google Redirect Flow
          </p>
        </div>
      </motion.div>
    </div>
  );
}
