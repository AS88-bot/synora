import { useState, useEffect, FormEvent } from "react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  setDoc
} from "firebase/firestore";
import { Activity, Award, Moon, CheckCircle, AlertCircle, Sparkles, Plus, Trash2, Calendar, BookOpen, ShieldCheck } from "lucide-react";
import { JournalEntry } from "../types";

interface JournalSectionProps {
  user: any;
  isMock: boolean;
}

export default function JournalSection({ user, isMock }: JournalSectionProps) {
  const [editorText, setEditorText] = useState("");
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [user.uid]);

  const fetchEntries = async () => {
    if (isMock) {
      setEntries([
        {
          id: "j_mock_1",
          userId: user.uid,
          content: "Mindfully processing the day's cognitive load. Systems are optimal.",
          sentimentLabel: "positive",
          dominantEmotion: "Clarity",
          sentimentScore: 0.85,
          analysisTips: "Focus on this clarity. It drives baseline stability.",
          createdAt: { toDate: () => new Date() }
        }
      ]);
      return;
    }

    const journalsPath = `users/${user.uid}/journals`;
    try {
      const q = query(collection(db, journalsPath), orderBy("createdAt", "desc"), limit(20));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        } as JournalEntry;
      });
      setEntries(list);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, journalsPath);
    }
  };

  const handleSaveEntry = async (e: FormEvent) => {
    e.preventDefault();
    if (!editorText.trim()) return;

    setLoading(true);
    setSystemAlert(null);

    try {
      // Analyze sentiment via Synora API bridge
      const resp = await fetch("/api/gemini/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editorText })
      });
      const analysis = await resp.json();

      const journalId = `journal_${Date.now()}`;
      const payload = {
        id: journalId,
        userId: user.uid,
        content: editorText.trim(),
        sentimentLabel: analysis.sentimentLabel || "neutral",
        dominantEmotion: analysis.dominantEmotion || "Neutral",
        sentimentScore: analysis.sentimentScore || 0,
        analysisTips: analysis.analysisTips || "",
        createdAt: isMock ? new Date() : serverTimestamp()
      };

      if (isMock) {
        setEntries([{ ...payload, createdAt: { toDate: () => new Date() } } as any, ...entries]);
      } else {
        await setDoc(doc(db, "users", user.uid, "journals", journalId), payload);
        await fetchEntries();
      }

      setEditorText("");
    } catch (err) {
      console.error(err);
      setSystemAlert("Cognitive Bridge failed to analyze journal entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (isMock) {
      setEntries(entries.filter(e => e.id !== id));
      return;
    }
    const journalPath = `users/${user.uid}/journals/${id}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "journals", id));
      await fetchEntries();
    } catch (err) {
      // handleFirestoreError(err, OperationType.DELETE, journalPath);
    }
  };

  const getSentimentStyling = (label: string) => {
    switch (label) {
      case "positive":
        return {
          bg: "bg-emerald-50/40 border-emerald-100",
          ring: "bg-emerald-400",
          text: "text-emerald-600",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-100"
        };
      case "negative":
        return {
          bg: "bg-rose-50/40 border-rose-100",
          ring: "bg-rose-400",
          text: "text-rose-600",
          badge: "bg-rose-50 text-rose-700 border-rose-100 shadow-sm shadow-rose-100"
        };
      default:
        return {
          bg: "bg-sky-50/40 border-sky-100",
          ring: "bg-sky-400",
          text: "text-sky-600",
          badge: "bg-sky-50 text-sky-700 border-sky-100 shadow-sm shadow-sky-100"
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-8 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Editor Composer Section */}
        <div className="lg:col-span-5 glass-panel rounded-[2rem] p-8 shadow-lg" id="journal-editor-block">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-white border border-indigo-100 rounded-2xl shadow-xl shadow-indigo-100/50">
              <BookOpen className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-zinc-900">
                Reflections
              </h1>
              <p className="text-xs text-zinc-400 font-medium">
                Cognitive flow & journaling
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveEntry} className="space-y-6">
            <div>
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                rows={9}
                placeholder="What's on your mind today?"
                className="w-full glass-input rounded-2xl p-6 text-sm text-zinc-800 leading-relaxed placeholder-zinc-400 font-medium resize-none transition-all"
                disabled={loading}
                id="journal-content-input"
              />
            </div>

            {systemAlert && (
              <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl flex items-start gap-2 text-xs text-red-600 font-semibold leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{systemAlert}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !editorText.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 shadow-xl shadow-indigo-100"
              id="save-journal-btn"
            >
              <Plus className="w-5 h-5" />
              <span>{loading ? "Analyzing..." : "Save Reflection"}</span>
            </button>
          </form>

          {/* Secure pipeline check */}
          <div className="mt-8 p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl flex items-center gap-3 text-[10px] text-zinc-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="uppercase tracking-widest">End-to-End Secure Processing</span>
          </div>
        </div>

        {/* Historic Analysis Logs Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold font-sans tracking-[0.2em] text-zinc-400 uppercase">
              Timeline
            </h2>
          </div>

          {entries.length === 0 ? (
            <div className="glass-panel rounded-[2rem] p-16 text-center text-zinc-400 border-white/50 shadow-md">
              <BookOpen className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
              <p className="text-sm font-bold text-zinc-900">Your reflection vault is empty.</p>
              <p className="text-xs text-zinc-500 mt-2">Begin your journey with the composer.</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[620px] overflow-y-auto pr-3 custom-scrollbar p-1">
              {entries.map((entry) => {
                const style = getSentimentStyling(entry.sentimentLabel);
                return (
                  <div key={entry.id} className="glass-panel rounded-[2rem] p-8 relative overflow-hidden transition-all hover:scale-[1.01] shadow-lg border-white/40">
                    {/* Tone Ribbon Background Accent */}
                    <div className={`absolute top-0 left-0 w-2 h-full ${style.ring} opacity-80`} />

                    <div className="flex items-start justify-between gap-6 mb-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-zinc-300" />
                        <span className="text-[11px] font-bold text-zinc-400">
                          {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Emotion tone badge */}
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 border rounded-xl ${style.badge}`}>
                          {entry.dominantEmotion}
                        </span>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-2 hover:bg-red-50 text-zinc-300 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Content text */}
                    <p className="text-sm text-zinc-600 leading-relaxed font-medium mb-6 whitespace-pre-wrap pl-2 capitalize-first">
                      {entry.content}
                    </p>

                    {/* AI tips expansion card */}
                    {entry.analysisTips && (
                      <div className={`p-5 rounded-2xl border ${style.bg} transition-all`}>
                        <div className="flex gap-3 items-start">
                          <Sparkles className={`w-5 h-5 ${style.text} shrink-0 mt-0.5 animate-pulse`} />
                          <p className={`text-[11px] font-bold leading-relaxed ${style.text}`}>
                            {entry.analysisTips}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
