import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./lib/firebase";

// Importing Core Segment Components
import AuthPage from "./components/AuthPage";
import Navbar from "./components/Navbar";
import ChatSection from "./components/ChatSection";
import JournalSection from "./components/JournalSection";
import MoodSection from "./components/MoodSection";
import AnalyticsSection from "./components/AnalyticsSection";
import ArchitectureSection from "./components/ArchitectureSection";

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [isSandboxUser, setIsSandboxUser] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("chat");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sync actual Firebase Auth session
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Synora Traveler",
          photoURL: firebaseUser.photoURL || "",
          role: "user"
        });
        setIsSandboxUser(false);
      } else if (!isSandboxUser) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isSandboxUser]);

  const handleSignInSuccess = (signedUser: any, isMock: boolean) => {
    setUser(signedUser);
    setIsSandboxUser(isMock);
  };

  const handleSignOut = async () => {
    try {
      if (isSandboxUser) {
        setUser(null);
        setIsSandboxUser(false);
        setCurrentTab("chat");
        return;
      }
      await firebaseSignOut(auth);
      setUser(null);
      setCurrentTab("chat");
    } catch (err) {
      console.error("Failed to release login thread: ", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center px-4 font-mono select-none text-zinc-900">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
          <span className="text-xs text-zinc-500 tracking-widest uppercase font-bold">
            Synora Core Booting...
          </span>
        </div>
        <div className="text-[10px] text-zinc-400">Verifying DB Node Handshakes</div>
      </div>
    );
  }

  // If not authenticated, serve the professional Auth Landing card
  if (!user) {
    return <AuthPage onSignInSuccess={handleSignInSuccess} />;
  }

  return (
    <div className="min-h-screen text-zinc-800 flex flex-col selection:bg-indigo-100 selection:text-indigo-700 font-sans relative">
      
      {/* Platform Level Header Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        user={user}
        onSignOut={handleSignOut}
      />

      {/* Main Core Section Content Router */}
      <main className="flex-1 w-full relative">
        {currentTab === "chat" && (
          <ChatSection user={user} isMock={isSandboxUser} />
        )}
        {currentTab === "journal" && (
          <JournalSection user={user} isMock={isSandboxUser} />
        )}
        {currentTab === "mood" && (
          <MoodSection user={user} isMock={isSandboxUser} />
        )}
        {currentTab === "analytics" && (
          <AnalyticsSection user={user} isMock={isSandboxUser} />
        )}
        {currentTab === "devops" && (
          <ArchitectureSection />
        )}
      </main>

      {/* Sticky environment signature bar */}
      <footer className="px-8 py-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6 font-sans text-[11px] text-zinc-400 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold uppercase tracking-widest opacity-60">
            {isSandboxUser ? "Explorer Gateway" : "Production Environment"}
          </span>
        </div>
        <div className="mt-2 sm:mt-0 font-medium opacity-40">
          Synora Intelligence Platform &copy; 2026 • Cognitive Wellness Systems
        </div>
      </footer>

    </div>
  );
}
