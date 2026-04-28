import React, { useState } from 'react';
import { Wine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function TokenGate() {
  const { setToken } = useAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Please enter your Access-Token.');
      return;
    }
    setError('');
    setToken(trimmed);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-600 p-2 rounded-lg">
            <Wine className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              AVL Wines LIP Dashboard
            </h1>
            <p className="text-sm text-slate-500">Label Integrity Program</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Enter your InnoVint Access-Token to continue. Your token is held in
          memory only and is never stored persistently.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Access-Token
            </label>
            <input
              id="token"
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your InnoVint token here"
              autoComplete="off"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
            />
            {error && (
              <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Continue to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
