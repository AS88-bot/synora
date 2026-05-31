import { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { 
  TrendingUp, 
  RefreshCw, 
  Sparkles, 
  Moon, 
  BarChart3, 
  Heart,
  PieChart as PieChartIcon,
  Timeline
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { MoodLog, JournalEntry } from "../types";

interface AnalyticsSectionProps {
  user: any;
  isMock: boolean;
}

export default function AnalyticsSection({ user, isMock }: AnalyticsSectionProps) {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [moodHist, setMoodHist] = useState<any[]>([]);
  const [emotionDistribution, setEmotionDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadChartData();
  }, [user.uid]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      if (isMock) {
        // Generate soft mock data
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const line = days.map(d => ({
          day: d,
          sentiment: (Math.random() * 0.8) + 0.2, // mostly positive
          sleep: Math.floor(Math.random() * 3) + 6
        }));
        setAnalyticsData(line);

        const bars = days.map(d => ({
          name: d,
          mood: Math.floor(Math.random() * 2) + 4,
          energy: Math.floor(Math.random() * 2) + 3
        }));
        setMoodHist(bars);

        setEmotionDistribution([
          { name: "Peace", count: 12 },
          { name: "Joy", count: 8 },
          { name: "Focus", count: 15 },
          { name: "Flow", count: 10 }
        ]);
        return;
      }

      // Real fetch logic would go here
      // For now we keep it minimal to focus on UI
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-8 font-sans space-y-8 animate-fade-in">
      
      {/* Header section with refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white border border-indigo-100 rounded-2.5xl shadow-xl shadow-indigo-100/50">
            <BarChart3 className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 pr-12">
              Insights
            </h1>
            <p className="text-xs font-semibold text-zinc-400 mt-1">
              Neural trends & cognitive patterns
            </p>
          </div>
        </div>

        <button
          onClick={loadChartData}
          disabled={loading}
          className="px-6 py-3 bg-white hover:bg-zinc-50 border border-zinc-100 shadow-md text-xs font-bold text-zinc-600 rounded-2xl flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-500 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sentiment Line Arc */}
        <div className="lg:col-span-8 glass-panel rounded-[2.5rem] p-8 shadow-lg border-white/40" id="sentiment-analysis-chart">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 mb-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Sentiment Arc
              </h2>
              <p className="text-xs text-zinc-400 font-medium">Emotional trajectory over time</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Optimized State</span>
            </div>
          </div>

          <div className="h-80 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#a1a1aa" 
                  fontSize={11} 
                  fontWeight="600" 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#a1a1aa" 
                  fontSize={11} 
                  fontWeight="600" 
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    fontSize: "12px",
                    fontWeight: "600",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sentiment" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: "#fff", stroke: "#6366f1", strokeWidth: 2 }}
                  activeDot={{ r: 8 }} 
                  name="Sentiment" 
                />
                <Line 
                  type="monotone" 
                  dataKey="sleep" 
                  stroke="#9333ea" 
                  strokeWidth={3} 
                  strokeDasharray="8 8" 
                  dot={false}
                  name="Sleep" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotion Distribution Frequency bars */}
        <div className="lg:col-span-4 glass-panel rounded-[2.5rem] p-8 shadow-lg border-white/40" id="emotion-frequency-chart">
          <div className="mb-10">
            <h2 className="text-base font-extrabold text-zinc-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" /> Emotion Map
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Frequency distribution</p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} axisLine={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#71717a" 
                  fontSize={11} 
                  fontWeight="700" 
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#818cf8" 
                  radius={[0, 12, 12, 0]} 
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Longitudinal parameter logs */}
        <div className="lg:col-span-12 glass-panel rounded-[2.5rem] p-10 shadow-lg border-white/40" id="parameter-logs-chart">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 mb-1 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" /> Wellness Rhythm
              </h2>
              <p className="text-xs text-zinc-400 font-medium">Mood vs Energy Longitudinal Wave</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mood</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Energy</span>
              </div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodHist} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight="700" stroke="#a1a1aa" dy={10} />
                <YAxis hide domain={[0, 5]} />
                <Tooltip
                  cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                />
                <Bar dataKey="mood" fill="#6366f1" radius={[12, 12, 12, 12]} barSize={24} name="Mood" />
                <Bar dataKey="energy" fill="#10b981" radius={[12, 12, 12, 12]} barSize={24} name="Energy" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
