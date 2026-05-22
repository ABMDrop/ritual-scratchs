/**
 * lib/api.ts — Browser-safe DB wrappers.
 * Same function signatures as lib/supabase.ts.
 * Calls /api/db (server-side) instead of Turso directly.
 */
import { LeaderboardRow } from './supabase';

async function db(action: string, args: Record<string, unknown> = {}) {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...args }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error ?? 'DB request failed');
  }
  return res.json();
}

export type { LeaderboardRow };

export async function getUser(wallet: string): Promise<LeaderboardRow | null> {
  const { data } = await db('getUser', { wallet });
  return data ?? null;
}

export async function createUser(wallet: string): Promise<void> {
  await db('createUser', { wallet });
}

export async function saveClaim(
  wallet: string, pts: number, currentPts: number,
  currentLifetime: number, currentScratches: number, username: string,
): Promise<void> {
  await db('saveClaim', { wallet, pts, currentPts, currentLifetime, currentScratches, username });
}

export async function deductPoints(wallet: string, pts: number, currentPts: number): Promise<void> {
  await db('deductPoints', { wallet, pts, currentPts });
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const { data } = await db('getLeaderboard');
  return data ?? [];
}

export async function getLeaderboardPage(
  page: number, pageSize = 10,
): Promise<{ rows: LeaderboardRow[]; totalCount: number }> {
  const { data } = await db('getLeaderboardPage', { page, pageSize });
  return data ?? { rows: [], totalCount: 0 };
}

export async function saveUsername(wallet: string, username: string): Promise<void> {
  await db('saveUsername', { wallet, username });
}

export async function checkUsernameAvailable(wallet: string, username: string): Promise<boolean> {
  const { available } = await db('checkUsernameAvailable', { wallet, username });
  return available ?? true;
}
