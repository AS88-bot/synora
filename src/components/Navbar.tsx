import { Sparkles, BookOpen, Activity, BarChart3, Terminal, LogOut, HeartHandshake } from "lucide-react";

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  onSignOut: () => void;
}

export default function Navbar({ currentTab, onTabChange, user, onSignOut }: NavbarProps) {
  const tabs = [
    { id: "chat", title: "Synora AI", icon: HeartHandshake },
    { id: "journal", title: "Reflections", icon: BookOpen },
    { id: "mood", title: "Wellness", icon: Activity },
    { id: "analytics", title: "Insights", icon: BarChart3 },
    { id: "devops", title: "System Vision", icon: Terminal },
  ];

  return (
    <nav className="bg-white/40 backdrop-blur-md border-b border-white/50 sticky top-0 z-50 px-4 py-4 sm:px-8 font-sans transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        
        {/* Brand Details */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onTabChange("chat")}>
            <div className="p-2 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-200/50 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-zinc-900">
              Synora
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex items-center overflow-x-auto scrollbar-none gap-2 bg-zinc-100/50 p-1.5 rounded-2xl border border-zinc-200/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-300 shrink-0 ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-md shadow-indigo-100/50 scale-105"
                    : "text-zinc-500 hover:text-indigo-500 hover:bg-white/50"
                }`}
                id={`nav-${tab.id}-tab`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-500" : "text-zinc-400"}`} />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Identity Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-4 border-r border-zinc-200/60 hidden sm:flex">
            <div className="text-right">
              <p className="text-xs font-bold text-zinc-900">
                {user.displayName?.split(' ')[0] || "Traveler"}
              </p>
              <p className="text-[9px] text-zinc-400 font-medium tracking-wider uppercase">
                {user.role || "user"}
              </p>
            </div>
            <img
              src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
              alt="Avatar"
              className="w-9 h-9 rounded-2xl border-2 border-white shadow-sm object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <button
            onClick={onSignOut}
            className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
            title="Sign Out"
            id="navbar-logout-btn"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

      </div>
    </nav>
  );
}
