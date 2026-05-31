import { useState, useEffect, useRef, FormEvent } from "react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { HeartHandshake, Send, Sparkles, MessageSquarePlus, History, ShieldAlert, Cpu } from "lucide-react";

interface ChatSectionProps {
  user: any;
  isMock: boolean;
}

export default function ChatSection({ user, isMock }: ChatSectionProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Generate / Fetch Conversational Sessions
  useEffect(() => {
    fetchSessions();
  }, [user.uid]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    setSystemAlert(null);
    if (isMock) {
      // Local development sandbox sessions
      const sandboxSessions = [
        {
          id: "sandbox_session_1",
          title: "Initial Therapeutic Walkthrough",
          createdAt: { toDate: () => new Date(Date.now() - 3600000) },
          updatedAt: { toDate: () => new Date() }
        }
      ];
      setSessions(sandboxSessions);
      setActiveSession(sandboxSessions[0]);
      return;
    }

    const sessionsPath = `users/${user.uid}/chatSessions`;
    try {
      const q = query(collection(db, sessionsPath), orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSessions(list);
      if (list.length > 0) {
        if (!activeSession) setActiveSession(list[0]);
      } else {
        // Auto-create first session for new users to unlock chat interface
        await triggerNewSession();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, sessionsPath);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    if (isMock) {
      setMessages([
        {
          id: "msg_init",
          sender: "ai",
          text: "Welcome to Synora client console! I am your resilient emotional analytics companion. Type any issue, emotional blockade, or stressful thoughts to begin immediate cognitive mapping.",
          createdAt: new Date()
        }
      ]);
      return;
    }

    const messagesPath = `users/${user.uid}/chatSessions/${sessionId}/messages`;
    try {
      const q = query(collection(db, messagesPath), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        };
      });
      setMessages(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, messagesPath);
    }
  };

  const triggerNewSession = async () => {
    const defaultTitle = `Therapy Session #${sessions.length + 1}`;
    if (isMock) {
      const newSess = {
        id: `sandbox_${Date.now()}`,
        title: defaultTitle,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setSessions([newSess, ...sessions]);
      setActiveSession(newSess);
      return;
    }

    const sessionId = `sess_${Date.now()}`;
    const sessionPath = `users/${user.uid}/chatSessions/${sessionId}`;
    try {
      const sessionDoc = {
        id: sessionId,
        userId: user.uid,
        title: defaultTitle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, "users", user.uid, "chatSessions", sessionId), sessionDoc);
      await fetchSessions();
      setActiveSession(sessionDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, sessionPath);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessageText = inputText.trim();
    setInputText("");
    setLoading(true);

    const tempUserMsg = {
      id: `temp_${Date.now()}`,
      sender: "user" as const,
      text: userMessageText,
      createdAt: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // 1. Post to Server Proxy to compute server-side Gemini support
      const chatApiUrl = "/api/gemini/chat";
      const response = await fetch(chatApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.concat(tempUserMsg),
          latestMessage: userMessageText
        })
      });

      if (!response.ok) {
        throw new Error("Local fullstack model companion failed to react.");
      }

      const rawResult = await response.json();
      const aiReplyText = rawResult.text || "I am reflecting on your thoughts...";
      const detectedEmotion = rawResult.detectedEmotion || "Reflective";

      if (isMock) {
        // Client side simulator response save
        setMessages(prev => [
          ...prev,
          {
            id: `temp_ai_${Date.now()}`,
            sender: "ai",
            text: aiReplyText,
            createdAt: new Date(),
            detectedEmotion
          }
        ]);
        setLoading(false);
        return;
      }

      // 2. Real Firestore Persistence
      const sessionRef = doc(db, "users", user.uid, "chatSessions", activeSession.id);
      const messagesCol = collection(db, "users", user.uid, "chatSessions", activeSession.id, "messages");

      // Save user message
      await addDoc(messagesCol, {
        id: `msg_u_${Date.now()}`,
        sessionId: activeSession.id,
        sender: "user",
        text: userMessageText,
        createdAt: serverTimestamp()
      });

      // Save AI message
      await addDoc(messagesCol, {
        id: `msg_a_${Date.now()}`,
        sessionId: activeSession.id,
        sender: "ai",
        text: aiReplyText,
        createdAt: serverTimestamp(),
        detectedEmotion
      });

      // Update Session Title dynamically if it was default
      let newTitle = activeSession.title;
      if (activeSession.title.startsWith("Therapy Session")) {
        newTitle = userMessageText.split(" ").slice(0, 4).join(" ") + "...";
      }

      await updateDoc(sessionRef, {
        title: newTitle,
        updatedAt: serverTimestamp()
      });

      await fetchSessions();
      // Ensure the active session is refreshed with local values
      setActiveSession((prev: any) => ({ ...prev, title: newTitle }));
      await fetchMessages(activeSession.id);

    } catch (err: any) {
      console.error(err);
      setSystemAlert("Failed to persist conversation nodes. Review Cloud security rules.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-8 h-[calc(100vh-140px)] flex flex-col md:flex-row gap-8 font-sans">
      
      {/* Sessions Left Sidebar */}
      <div className="w-full md:w-80 glass-panel rounded-[2rem] p-6 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] font-sans">
              Journeys
            </h2>
          </div>
          <button
            onClick={triggerNewSession}
            className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl hover:scale-110 cursor-pointer transition-all shadow-sm"
            title="Start New Journey"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {sessions.map((sess) => {
            const isActive = activeSession?.id === sess.id;
            return (
              <button
                key={sess.id}
                onClick={() => setActiveSession(sess)}
                className={`w-full text-left p-4 rounded-2xl transition-all text-xs cursor-pointer group relative ${
                  isActive
                    ? "bg-white text-indigo-700 font-bold shadow-md shadow-indigo-100/50"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-white/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-indigo-500" : "bg-zinc-200 group-hover:bg-zinc-300"}`} />
                  <div className="flex-1 truncate">{sess.title}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Session Encrypted</span>
        </div>
      </div>

      {/* Primary Conversation Canvas */}
      <div className="flex-1 glass-panel rounded-[2rem] flex flex-col overflow-hidden relative shadow-lg" id="chat-canvas">
        {/* Chat Status Bar Header */}
        <div className="bg-white/40 backdrop-blur-sm px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-[1.25rem]">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-zinc-900">
                {activeSession ? activeSession.title : "Initializing..."}
              </h1>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                AI Emotional Intelligence v3.5
              </p>
            </div>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-50/5 custom-scrollbar">
          {messages.map((msg) => {
            const isAI = msg.sender === "ai";
            return (
              <div
                key={msg.id}
                className={`flex gap-4 max-w-[80%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 font-bold shadow-sm transition-transform hover:rotate-3 ${
                  isAI
                    ? "bg-white border-white text-indigo-600"
                    : "bg-indigo-500 border-indigo-400 text-white"
                }`}>
                  {isAI ? <Sparkles className="w-4 h-4" /> : user.displayName?.[0]}
                </div>

                <div className="space-y-2">
                  <div className={`p-5 rounded-[1.5rem] text-[13px] leading-relaxed shadow-sm transition-all hover:shadow-md ${
                    isAI
                      ? "bg-white border border-white/60 text-zinc-700 rounded-tl-none"
                      : "bg-indigo-500 text-white rounded-tr-none shadow-indigo-200"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  
                  <div className={`flex items-center gap-3 text-[10px] text-zinc-400 font-medium ${isAI ? "" : "justify-end"}`}>
                    {msg.detectedEmotion && (
                      <span className="bg-white/80 px-2 py-1 border border-zinc-100 rounded-lg text-indigo-500 uppercase tracking-wider font-bold text-[9px]">
                        {msg.detectedEmotion}
                      </span>
                    )}
                    <span className="opacity-60">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 shrink-0 flex items-center justify-center text-[10px] text-indigo-600 font-bold">
                AI
              </div>
              <div className="bg-white border border-zinc-200 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-zinc-500 flex items-center gap-2 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-200" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-300" />
                <span className="font-mono text-[10px] text-zinc-400 font-bold">Synora thinking...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Security / System Notification alert */}
        {systemAlert && (
          <div className="mx-6 my-2 px-4 py-2 bg-red-50 border border-red-100 text-[10px] font-bold font-mono text-red-600 rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{systemAlert}</span>
          </div>
        )}

        {/* Interface Input Drawer */}
        <div className="p-6 bg-white/40 border-t border-white/60">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="How are you feeling today?"
              className="w-full h-14 pl-6 pr-32 glass-input rounded-2xl text-sm text-zinc-700 placeholder-zinc-400 font-medium shadow-sm transition-all"
              disabled={loading || !activeSession}
              id="chat-input-text"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim() || !activeSession}
              className="absolute right-2.5 bg-indigo-500 hover:bg-indigo-600 text-white w-24 h-9 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-lg shadow-indigo-200/50"
              id="chat-send-btn"
            >
              <span>SEND</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
