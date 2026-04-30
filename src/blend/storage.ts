import type { BlendTrial } from './types';

const STORAGE_KEY = 'lip_blend_trials_v1';

export function loadTrials(): BlendTrial[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BlendTrial[];
  } catch {
    return [];
  }
}

export function saveTrials(trials: BlendTrial[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trials));
  } catch {
    // Ignore storage errors (quota exceeded, private browsing, etc.)
  }
}

export function createTrial(): BlendTrial {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    createdAt: now,
    updatedAt: now,
    components: [],
  };
}

export function upsertTrial(trials: BlendTrial[], trial: BlendTrial): BlendTrial[] {
  const updated = { ...trial, updatedAt: new Date().toISOString() };
  const idx = trials.findIndex((t) => t.id === trial.id);
  if (idx === -1) {
    return [...trials, updated];
  }
  const next = [...trials];
  next[idx] = updated;
  return next;
}

export function deleteTrial(trials: BlendTrial[], id: string): BlendTrial[] {
  return trials.filter((t) => t.id !== id);
}
