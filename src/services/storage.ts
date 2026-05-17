import type { DemoData } from '../types';

const STORAGE_KEY = 'encuestape_data';
const VERSION_KEY = 'encuestape_data_version';
const DATA_VERSION = '2026-05-17-v4'; // bump this to force-clear localStorage

export function loadDemoData(): DemoData | null {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== DATA_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, DATA_VERSION);
      return null;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore parse errors
  }
  return null;
}

export function saveDemoData(data: DemoData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function clearDemoData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAdminToken(): string | null {
  return sessionStorage.getItem('admin_token');
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem('admin_token', token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem('admin_token');
}

const VOTE_COUNT_KEY = 'encuestape_device_votes';

export function getDeviceVoteCount(): number {
  try {
    return parseInt(localStorage.getItem(VOTE_COUNT_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

export function incrementDeviceVoteCount(): void {
  try {
    const count = getDeviceVoteCount() + 1;
    localStorage.setItem(VOTE_COUNT_KEY, String(count));
  } catch {
    // ignore
  }
}
