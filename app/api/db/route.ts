/**
 * /api/db — All DB calls go here (server-side only).
 * page.tsx is "use client" so it cannot access TURSO_DATABASE_URL directly.
 * This route runs on the server where env vars are available.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getUser, createUser, saveClaim, deductPoints,
  getLeaderboard, getLeaderboardPage, saveUsername, checkUsernameAvailable,
} from '../../../lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...args } = body;

    switch (action) {
      case 'getUser': {
        const data = await getUser(args.wallet);
        return NextResponse.json({ data });
      }
      case 'createUser': {
        await createUser(args.wallet);
        return NextResponse.json({ ok: true });
      }
      case 'saveClaim': {
        await saveClaim(args.wallet, args.pts, args.currentPts, args.currentLifetime, args.currentScratches, args.username);
        return NextResponse.json({ ok: true });
      }
      case 'deductPoints': {
        await deductPoints(args.wallet, args.pts, args.currentPts);
        return NextResponse.json({ ok: true });
      }
      case 'getLeaderboard': {
        const data = await getLeaderboard();
        return NextResponse.json({ data });
      }
      case 'getLeaderboardPage': {
        const data = await getLeaderboardPage(args.page, args.pageSize ?? 10);
        return NextResponse.json({ data });
      }
      case 'saveUsername': {
        await saveUsername(args.wallet, args.username);
        return NextResponse.json({ ok: true });
      }
      case 'checkUsernameAvailable': {
        const available = await checkUsernameAvailable(args.wallet, args.username);
        return NextResponse.json({ available });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB error';
    console.error('[/api/db]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
