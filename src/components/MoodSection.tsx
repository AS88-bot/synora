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
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { Activity, Award, Moon, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { MoodLog } from "../types";

interface MoodSectionProps {
  user: any;
  isMock: boolean;
}

export default function MoodSection({ user, isMock }: MoodSectionProps) {
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(7);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MoodLog[]>([]);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [user.uid]);

  const fetchHistory = async () => {
    if (isMock) {
      setHistory([
        {
          id: "m_mock_1",
          userId: user.uid,
          moodValue: 4,
          energyValue: 3,
          sleepHours: 7.5,
          notes: "Steady state achieved.",
          createdAt: { toDate: () => new Date() }
        }
      ]);
      return;
    }

    const logsPath = `users/${user.uid}/moodLogs`;
    try {
      const q = query(collection(db, logsPath), orderBy("createdAt", "desc"), limit(10));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MoodLog));
      setHistory(list);
    } catch (err) {
      // handleFirestoreError(err, OperationType.GET, logsPath);
    }
  };

  const handleSaveLogs = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSystemAlert(null);
    setSuccess(false);

    try {
      const logId = `log_${Date.now()}`;
      const payload = {
        id: logId,
        userId: user.uid,
        moodValue: mood,
        energyValue: energy,
        sleepHours: sleep,
        notes: notes.trim(),
        createdAt: isMock ? new Date() : serverTimestamp()
      };

      if (isMock) {
        setHistory([{ ...payload, createdAt: { toDate: () => new Date() } } as any, ...history]);
      } else {
        await setDoc(doc(db, "users", user.uid, "moodLogs", logId), payload);
        await fetchHistory();
      }

      setSuccess(true);
      setNotes("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setSystemAlert("Database commit failed. Network desync detected.");
    } finally {
      setLoading(false);
    }
  };

  const getMoodSmiley = (val: number) => {
    switch (val) {
      case 1: return "😔 Low";
      case 2: return "😐 Flat";
      case 3: return "🙂 Balanced";
      case 4: return "😊 Positive";
      case 5: return "✨ Peak";
      default: return "🙂 Balanced";
    }
  };

  const getEnergyText = (val: number) => {
    switch (val) {
      case 1: return "💤 Lethargic";
      case 2: return "📉 Fatigued";
      case 3: return "⚖️ Solid";
      case 4: return "🚀 Dynamic";
      case 5: return "🔋 Fully Charged";
      default: return "⚖️ Solid";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-8 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Input sliders card */}
        <div className="lg:col-span-5 glass-panel rounded-[2rem] p-8 shadow-lg" id="mood-logger-card">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-white border border-indigo-100 rounded-2xl shadow-xl shadow-indigo-100/50">
              <Activity className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-zinc-900">
                Rhythm Check
              </h1>
              <p className="text-xs text-zinc-400 font-medium">
                Log your current state
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveLogs} className="space-y-10">
            {/* Mood Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-700">How are you feeling?</span>
                <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100 uppercase tracking-wider">{getMoodSmiley(mood)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="w-full h-2.5 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all"
                id="mood-scale-slider"
              />
            </div>

            {/* Energy Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-700">Energy Level</span>
                <span className="text-[11px] font-bold text-violet-500 bg-violet-50 px-3 py-1 rounded-xl border border-violet-100 uppercase tracking-wider">{getEnergyText(energy)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full h-2.5 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-violet-500 hover:accent-violet-600 transition-all"
                id="energy-scale-slider"
              />
            </div>

            {/* Sleep Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-zinc-400" /> Rest
                </span>
                <span className="text-[11px] font-bold text-sky-500 bg-sky-50 px-3 py-1 rounded-xl border border-sky-100 uppercase tracking-wider">{sleep} Hours</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="0.5"
                value={sleep}
                onChange={(e) => setSleep(Number(e.target.value))}
                className="w-full h-2.5 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-sky-500 hover:accent-sky-600 transition-all"
                id="sleep-scale-slider"
              />
            </div>

            {/* Tags / Notes text */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-zinc-700">
                Reflection
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={400}
                placeholder="Briefly describe your state..."
                className="w-full glass-input rounded-2xl p-4 text-sm text-zinc-700 placeholder-zinc-400 font-medium h-24 resize-none transition-all"
              />
            </div>

            {systemAlert && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2 text-xs text-red-600 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{systemAlert}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in shadow-sm shadow-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Rhythm committed successfully</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xl shadow-indigo-100"
              id="commit-mood-logs-btn"
            >
              <span>{loading ? "Re-verifying..." : "Commit Rhythm"}</span>
            </button>
          </form>
        </div>

        {/* Ledger logs sidebar info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold font-sans tracking-[0.2em] text-zinc-400 uppercase">
              Recent Activity
            </h2>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar p-1">
            {history.map((log) => (
              <div key={log.id} className="glass-panel rounded-[1.5rem] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 transition-all hover:scale-[1.01]">
                <div className="space-y-4">
                  <div className="flex items-center flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-xs font-bold text-zinc-700">Mood {log.moodValue}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-400" />
                      <span className="text-xs font-bold text-zinc-700">Energy {log.energyValue}/5</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sky-400" />
                      <span className="text-xs font-bold text-zinc-700">{log.sleepHours}h rest</span>
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-xs text-zinc-500 font-medium italic border-l-2 border-zinc-100 pl-3">
                      {log.notes}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100 block">
                    {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="glass-panel rounded-[2rem] p-16 text-center text-zinc-400">
                <Award className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
                <p className="text-sm font-bold text-zinc-900">Your activity ledger is empty.</p>
              </div>
            )}
          </div>

          {/* Clinical encouragement card */}
          <div className="glass-panel rounded-[2rem] p-8 flex gap-5 items-start shadow-md">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-2">
                Insight
              </h2>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Consistent rest (7-8 hours) is mathematically correlated with higher mood stability. Synora uses these metrics to build your personal wellness matrix.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
