import { useState } from 'react';
import { Wine, LogOut, FlaskConical } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { TokenGate } from './components/TokenGate';
import { Dashboard } from './components/Dashboard';
import { BlendTrials } from './components/BlendTrials';

type View = 'lot' | 'blend';

export default function App() {
  const { token, setToken } = useAuth();
  const [view, setView] = useState<View>('lot');

  if (!token) {
    return <TokenGate />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-600 p-1.5 rounded-lg">
              <Wine className="text-white" size={18} />
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-sm">AVL Wines</span>
              <span className="text-slate-400 text-sm mx-2">|</span>
              <span className="text-slate-600 text-sm">LIP Dashboard</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setView('lot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'lot'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Wine size={13} />
              Lot View
            </button>
            <button
              onClick={() => setView('blend')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'blend'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FlaskConical size={13} />
              Blend Trials
            </button>
          </div>

          {/* Change Token */}
          <button
            onClick={() => setToken(null)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <LogOut size={15} />
            Change Token
          </button>
        </div>
      </header>

      <div style={{ display: view === 'lot' ? 'block' : 'none' }}>
        <Dashboard />
      </div>
      <div style={{ display: view === 'blend' ? 'block' : 'none' }}>
        <BlendTrials />
      </div>
    </div>
  );
}
