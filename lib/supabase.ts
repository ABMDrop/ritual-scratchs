// ── Turso (LibSQL) client — drop-in replacement for Supabase ─────────────────
// All function names kept identical so page.tsx needs zero changes.
import { createClient } from '@libsql/client';

function getDb() {
  const url   = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) throw new Error('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is not set.');
  return createClient({ url, authToken: token });
}

export interface LeaderboardRow {
  wallet_address:  string;
  username:        string | null;
  total_points:    number;
  lifetime_points: number | null;
  total_scratches: number;
  last_claim:      number | null;
  created_at:      string;
}

// ── Get single user ───────────────────────────────────────────────────────────
export async function getUser(wallet: string): Promise<LeaderboardRow | null> {
  const db     = getDb();
  const result = await db.execute({
    sql:  'SELECT * FROM leaderboard WHERE wallet_address = ? LIMIT 1',
    args: [wallet.toLowerCase()],
  });
  return (result.rows[0] as unknown as LeaderboardRow) ?? null;
}

// ── Create user (ignores duplicate) ──────────────────────────────────────────
export async function createUser(wallet: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql:  `INSERT OR IGNORE INTO leaderboard
             (wallet_address, username, total_points, lifetime_points, total_scratches, last_claim, created_at)
           VALUES (?, '', 0, 0, 0, NULL, ?)`,
    args: [wallet.toLowerCase(), new Date().toISOString()],
  });
}

// ── Update lifetime points ────────────────────────────────────────────────────
export async function updateLifetimePoints(wallet: string, pts: number): Promise<void> {
  const db = getDb();
  await db.execute({
    sql:  'UPDATE leaderboard SET lifetime_points = ? WHERE wallet_address = ?',
    args: [pts, wallet.toLowerCase()],
  });
}

// ── Save username ─────────────────────────────────────────────────────────────
export async function saveUsername(wallet: string, username: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql:  'UPDATE leaderboard SET username = ? WHERE wallet_address = ?',
    args: [username, wallet.toLowerCase()],
  });
}

// ── Check username available ──────────────────────────────────────────────────
export async function checkUsernameAvailable(wallet: string, username: string): Promise<boolean> {
  const db     = getDb();
  const result = await db.execute({
    sql:  'SELECT wallet_address FROM leaderboard WHERE username = ? LIMIT 1',
    args: [username],
  });
  const rows = result.rows as unknown as LeaderboardRow[];
  return !rows.some((d) => d.wallet_address !== wallet.toLowerCase());
}

// ── Save claim (scratch result) ───────────────────────────────────────────────
export async function saveClaim(
  wallet: string, pts: number,
  currentPts: number, currentLifetime: number,
  currentScratches: number, username: string
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE leaderboard SET
            total_points    = ?,
            lifetime_points = ?,
            total_scratches = ?,
            last_claim      = ?,
            username        = ?
          WHERE wallet_address = ?`,
    args: [
      currentPts + pts,
      currentLifetime + pts,
      currentScratches + 1,
      Date.now(),
      username || null,
      wallet.toLowerCase(),
    ],
  });
}

// ── Deduct points (NFT mint) ──────────────────────────────────────────────────
export async function deductPoints(wallet: string, pts: number, currentPts: number): Promise<void> {
  const db = getDb();
  await db.execute({
    sql:  'UPDATE leaderboard SET total_points = ? WHERE wallet_address = ?',
    args: [Math.max(0, currentPts - pts), wallet.toLowerCase()],
  });
}

// ── Leaderboard top 10 ────────────────────────────────────────────────────────
export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const db     = getDb();
  const result = await db.execute(
    'SELECT * FROM leaderboard ORDER BY lifetime_points DESC LIMIT 10'
  );
  return result.rows as unknown as LeaderboardRow[];
}

// ── Paginated leaderboard ─────────────────────────────────────────────────────
export async function getLeaderboardPage(
  page: number, pageSize = 10
): Promise<{ rows: LeaderboardRow[]; totalCount: number }> {
  const db     = getDb();
  const offset = page * pageSize;

  const [rowsResult, countResult] = await Promise.all([
    db.execute({
      sql:  'SELECT * FROM leaderboard ORDER BY lifetime_points DESC LIMIT ? OFFSET ?',
      args: [pageSize, offset],
    }),
    db.execute('SELECT COUNT(*) as total FROM leaderboard'),
  ]);

  return {
    rows:       rowsResult.rows as unknown as LeaderboardRow[],
    totalCount: Number((countResult.rows[0] as unknown as { total: number }).total) ?? 0,
  };
}
