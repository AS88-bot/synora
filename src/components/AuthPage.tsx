import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { ShieldCheck, LogIn, Sparkles, Server } from "lucide-react";

interface AuthPageProps {
  onSignInSuccess: (user: any, isMock: boolean) => void;
}

export default function AuthPage({ onSignInSuccess }: AuthPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const profilePayload = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Synora Traveler",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
        role: "user" as const
      };

      if (!userSnap.exists()) {
        await setDoc(userRef, profilePayload);
      }

      onSignInSuccess(user, false);
    } catch (err: any) {
      console.error("Firebase Auth Google Popup failed: ", err);
      setError(
        err.message?.includes("popup_closed")
          ? "The login popup was closed before completion. Please try again."
          : `Auth Gateway Error: ${err.message || "Failed to reach Firebase."}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMockSignIn = (role: 'user' | 'admin') => {
    setLoading(true);
    setTimeout(() => {
      const mockUser = {
        uid: `sandbox_account_${role}`,
        email: `${role}_portfolio@synora.io`,
        displayName: role === 'admin' ? "Admissions Officer (Admin)" : "Cloud Architect Candidate",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        createdAt: new Date(),
        role: role
      };
      onSignInSuccess(mockUser, true);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-200/40 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      {/* Main Core Container */}
      <div className="w-full max-w-md glass-panel rounded-[2.5rem] p-8 sm:p-12 z-10 animate-float" id="auth-panel-card">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-white border border-indigo-100 rounded-3xl mb-6 shadow-xl shadow-indigo-100/50">
            <Sparkles className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
            Synora
          </h1>
          <p className="text-zinc-500 text-sm mt-3 font-medium">
            Cognitive Growth & AI Wellness
          </p>
        </div>

        {/* Info Highlights Card */}
        <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-5 mb-8 text-xs text-zinc-600 leading-relaxed space-y-4">
          <div className="flex gap-3 items-start">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong className="text-zinc-900">Secure Privacy:</strong> Your data is protected by high-trust cloud standards.
            </span>
          </div>
          <div className="flex gap-3 items-start">
            <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
            <span>
              <strong className="text-zinc-900">Empathetic AI:</strong> Integrated with Google Gemini for sophisticated cognitive support.
            </span>
          </div>
        </div>

        {/* Action Controls Section */}
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-red-600 font-bold leading-relaxed shadow-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-14 bg-white border border-indigo-100 hover:border-indigo-300 text-zinc-700 font-extrabold rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-indigo-100/40 relative active:scale-95 disabled:opacity-50"
            id="google-login-btn"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
            <span>Sync with Google</span>
          </button>

          <div className="flex items-center gap-3 my-8">
            <div className="h-px flex-1 bg-zinc-200/60" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">or explore safely</span>
            <div className="h-px flex-1 bg-zinc-200/60" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleMockSignIn('user')}
              disabled={loading}
              className="h-14 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-2xl text-[11px] flex flex-col items-center justify-center border border-indigo-100/50 transition-all active:scale-95 disabled:opacity-50"
              id="sandbox-user-btn"
            >
              <LogIn className="w-4 h-4 mb-0.5" />
              <span>Enter Sandbox</span>
            </button>
            <button
              onClick={() => handleMockSignIn('admin')}
              disabled={loading}
              className="h-14 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold rounded-2xl text-[11px] flex flex-col items-center justify-center border border-violet-100/50 transition-all active:scale-95 disabled:opacity-50"
              id="sandbox-admin-btn"
            >
              <Server className="w-4 h-4 mb-0.5" />
              <span>Admin Access</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
